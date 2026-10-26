import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const provider = searchParams.get("provider") || "";
    const salonId = searchParams.get("salonId") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (provider) where.provider = provider;
    if (salonId) where.salonId = salonId;

    // 1. Fetch Commissions with relations
    const commissions = await withRetry(() =>
      prisma.platformCommission.findMany({
        where,
        include: {
          salon: {
            select: { id: true, name: true, slug: true, quettaArea: true, phone: true },
          },
          payment: {
            select: {
              internalRef: true,
              customerName: true,
              customerPhone: true,
              totalBookingPkr: true,
              amountPaidPkr: true,
              paidAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    );

    // 2. Fetch or initialize Platform Destination Account Config
    let config = await withRetry(() =>
      prisma.platformPaymentConfig.findUnique({
        where: { id: "platform-config" },
      })
    );
    if (!config) {
      config = await withRetry(() =>
        prisma.platformPaymentConfig.create({
          data: {
            id: "platform-config",
            accountHolderName: "QSalon Platform Commission Account",
            provider: "JAZZCASH",
            accountNumber: "03001234567",
            businessName: "Devbase / QSalon Pakistan",
            updatedBy: session.email,
          },
        })
      );
    }

    // 3. Compute High-Level Metrics
    const allCommissions = await withRetry(() =>
      prisma.platformCommission.findMany({
        select: {
          advanceAmountPkr: true,
          commissionPkr: true,
          salonAllocationPkr: true,
          status: true,
          settlementStatus: true,
          paymentType: true,
          provider: true,
          salonId: true,
        },
      })
    );

    const failedPaymentsCount = await withRetry(() =>
      prisma.payment.count({ where: { status: "FAILED" } })
    );

    const totalCommissionsEarnedPkr = allCommissions
      .filter((c) => c.status === "EARNED")
      .reduce((sum, c) => sum + c.commissionPkr, 0);

    const totalAdvanceVolumeProcessedPkr = allCommissions
      .filter((c) => c.status === "EARNED")
      .reduce((sum, c) => sum + c.advanceAmountPkr, 0);

    const totalSalonAllocationDisbursablePkr = allCommissions
      .filter((c) => c.status === "EARNED")
      .reduce((sum, c) => sum + c.salonAllocationPkr, 0);

    const jazzCashCommissionsPkr = allCommissions
      .filter((c) => c.status === "EARNED" && c.provider === "JAZZCASH")
      .reduce((sum, c) => sum + c.commissionPkr, 0);

    const easypaisaCommissionsPkr = allCommissions
      .filter((c) => c.status === "EARNED" && c.provider === "EASYPAISA")
      .reduce((sum, c) => sum + c.commissionPkr, 0);

    const advancePaymentsCommissionPkr = allCommissions
      .filter((c) => c.status === "EARNED" && c.paymentType === "ADVANCE")
      .reduce((sum, c) => sum + c.commissionPkr, 0);

    const remainingPaymentsCommissionPkr = allCommissions
      .filter((c) => c.status === "EARNED" && c.paymentType === "REMAINING")
      .reduce((sum, c) => sum + c.commissionPkr, 0);

    const pendingSettlementCommissionsPkr = allCommissions
      .filter((c) => c.status === "EARNED" && c.settlementStatus === "PENDING_SETTLEMENT")
      .reduce((sum, c) => sum + c.commissionPkr, 0);

    const settledCommissionsPkr = allCommissions
      .filter((c) => c.status === "EARNED" && (c.settlementStatus === "SETTLED" || c.settlementStatus === "RETAINED"))
      .reduce((sum, c) => sum + c.commissionPkr, 0);

    return NextResponse.json({
      commissions,
      config,
      metrics: {
        totalCommissionsEarnedPkr,
        totalAdvanceVolumeProcessedPkr,
        totalSalonAllocationDisbursablePkr,
        jazzCashCommissionsPkr,
        easypaisaCommissionsPkr,
        advancePaymentsCommissionPkr,
        remainingPaymentsCommissionPkr,
        pendingSettlementCommissionsPkr,
        settledCommissionsPkr,
        failedPaymentsCount,
        totalTransactionsCount: allCommissions.length,
        commissionRateBps: config?.defaultCommissionRateBps || 1000,
        commissionPercentage: (config?.defaultCommissionRateBps || 1000) / 100,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/commission error:", error);
    return NextResponse.json({ error: "Failed to retrieve platform commission data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const body = await req.json();
    const accountHolderName = String(body.accountHolderName || "").trim();
    const provider = String(body.provider || "JAZZCASH").toUpperCase();
    const accountNumber = String(body.accountNumber || "").trim();
    const bankName = String(body.bankName || "").trim();
    const branchCode = String(body.branchCode || "").trim();
    const businessName = String(body.businessName || "").trim();
    const defaultCommissionRateBps = body.defaultCommissionRateBps !== undefined
      ? parseInt(body.defaultCommissionRateBps, 10)
      : undefined;

    if (!accountHolderName || !accountNumber) {
      return NextResponse.json(
        { error: "Account holder name and account/wallet number are required." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      accountHolderName,
      provider,
      accountNumber,
      bankName: provider === "BANK" ? bankName : null,
      branchCode: provider === "BANK" ? branchCode : null,
      businessName,
      updatedBy: session.email,
    };
    if (defaultCommissionRateBps && defaultCommissionRateBps > 0) {
      updateData.defaultCommissionRateBps = defaultCommissionRateBps;
    }

    const updated = await withRetry(() =>
      prisma.platformPaymentConfig.upsert({
        where: { id: "platform-config" },
        create: {
          id: "platform-config",
          accountHolderName,
          provider,
          accountNumber,
          bankName: provider === "BANK" ? bankName : null,
          branchCode: provider === "BANK" ? branchCode : null,
          businessName,
          defaultCommissionRateBps: defaultCommissionRateBps || 1000,
          updatedBy: session.email,
        },
        update: updateData,
      })
    );

    return NextResponse.json({
      success: true,
      config: updated,
      message: "Platform verified business payment destination updated successfully.",
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/commission error:", error);
    const message = error instanceof Error ? error.message : "Failed to update platform payment destination";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
