import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    // 1. Fetch all salons with their payment accounts and payments
    const salons = await withRetry(() =>
      prisma.salon.findMany({
        where: { approvalStatus: "APPROVED" },
        include: {
          paymentAccount: true,
          payments: {
            where: { status: "PAID" },
            select: {
              id: true,
              amountPaidPkr: true,
              settlementStatus: true,
              paidAt: true,
              provider: true,
              internalRef: true,
            },
          },
          payouts: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      })
    );

    // Compute settlement ledgers
    const settlementLedger = salons.map((salon) => {
      const paidList = salon.payments || [];
      const totalAdvanceCollectedPkr = paidList.reduce((acc, p) => acc + p.amountPaidPkr, 0);
      const pendingSettlementPkr = paidList
        .filter((p) => p.settlementStatus === "PENDING_SETTLEMENT" || p.settlementStatus === "PROCESSING")
        .reduce((acc, p) => acc + p.amountPaidPkr, 0);
      const settledPkr = paidList
        .filter((p) => p.settlementStatus === "SETTLED")
        .reduce((acc, p) => acc + p.amountPaidPkr, 0);

      return {
        salonId: salon.id,
        salonName: salon.name,
        slug: salon.slug,
        quettaArea: salon.quettaArea,
        phone: salon.phone,
        paymentAccount: salon.paymentAccount || null,
        totalAdvanceCollectedPkr,
        pendingSettlementPkr,
        settledPkr,
        unsettledPaymentsCount: paidList.filter((p) => p.settlementStatus === "PENDING_SETTLEMENT").length,
        recentPayouts: salon.payouts,
      };
    });

    // 2. Fetch all recent payouts across the platform
    const recentPayouts = await withRetry(() =>
      prisma.payout.findMany({
        include: {
          salon: {
            select: { name: true, slug: true, quettaArea: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    );

    const platformTotals = {
      totalCollectedPkr: settlementLedger.reduce((sum, s) => sum + s.totalAdvanceCollectedPkr, 0),
      totalPendingSettlementPkr: settlementLedger.reduce((sum, s) => sum + s.pendingSettlementPkr, 0),
      totalSettledPkr: settlementLedger.reduce((sum, s) => sum + s.settledPkr, 0),
    };

    return NextResponse.json({
      settlementLedger,
      recentPayouts,
      platformTotals,
    });
  } catch (error) {
    console.error("GET /api/admin/payouts error:", error);
    return NextResponse.json({ error: "Failed to retrieve payouts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const salonId = String(body.salonId || "");
    const amountPkr = parseInt(body.amountPkr, 10);
    const payoutRef = String(body.payoutRef || "").trim();
    const notes = String(body.notes || "").trim();

    if (!salonId || !amountPkr || amountPkr <= 0 || !payoutRef) {
      return NextResponse.json(
        { error: "salonId, amountPkr (> 0), and payout transaction reference (payoutRef) are required." },
        { status: 400 }
      );
    }

    // 1. Check salon & payment account
    const salon = await withRetry(() =>
      prisma.salon.findUnique({
        where: { id: salonId },
        include: {
          paymentAccount: true,
          payments: {
            where: {
              status: "PAID",
              settlementStatus: "PENDING_SETTLEMENT",
            },
            orderBy: { paidAt: "asc" },
          },
        },
      })
    );

    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    if (!salon.paymentAccount || salon.paymentAccount.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        { error: "Cannot execute payout: Salon does not have an approved and verified payment account." },
        { status: 422 }
      );
    }

    const unsettledSum = salon.payments.reduce((acc, p) => acc + p.amountPaidPkr, 0);
    if (amountPkr > unsettledSum) {
      return NextResponse.json(
        {
          error: `Payout amount (PKR ${amountPkr.toLocaleString()}) exceeds the salon's pending settlement balance (PKR ${unsettledSum.toLocaleString()}).`,
        },
        { status: 400 }
      );
    }

    // 2. Select payments to settle up to amountPkr
    let remainingToSettle = amountPkr;
    const paymentsToSettleIds: string[] = [];

    for (const p of salon.payments) {
      if (remainingToSettle <= 0) break;
      paymentsToSettleIds.push(p.id);
      remainingToSettle -= p.amountPaidPkr;
    }

    // 3. Atomically create Payout and update Payment records
    const payout = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const createdPayout = await tx.payout.create({
          data: {
            salonId: salon.id,
            amountPkr,
            amountPaisa: amountPkr * 100,
            provider: salon.paymentAccount!.provider,
            accountHolderName: salon.paymentAccount!.accountHolderName,
            accountNumber: salon.paymentAccount!.accountNumber,
            bankName: salon.paymentAccount!.bankName,
            payoutRef,
            status: "COMPLETED",
            notes,
            processedBy: session.email,
            completedAt: new Date(),
          },
        });

        // Mark associated payments as SETTLED
        await tx.payment.updateMany({
          where: { id: { in: paymentsToSettleIds } },
          data: {
            settlementStatus: "SETTLED",
            settledAt: new Date(),
            payoutId: createdPayout.id,
          },
        });

        return createdPayout;
      })
    );

    return NextResponse.json({
      success: true,
      payout,
      settledPaymentsCount: paymentsToSettleIds.length,
      message: `Successfully recorded settlement payout of PKR ${amountPkr.toLocaleString()} to ${salon.name}.`,
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/payouts error:", error);
    const message = error instanceof Error ? error.message : "Failed to record payout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
