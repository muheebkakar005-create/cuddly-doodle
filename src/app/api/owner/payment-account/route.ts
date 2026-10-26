import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "owner" || !session.salonId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const salon = await withRetry(() =>
      prisma.salon.findUnique({
        where: { id: session.salonId },
        include: {
          paymentAccount: {
            include: {
              auditLogs: {
                orderBy: { createdAt: "desc" },
                take: 10,
              },
            },
          },
          payments: {
            where: { status: "PAID" },
            orderBy: { createdAt: "desc" },
            take: 100,
          },
          payouts: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      })
    );

    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Financial Ledger Calculations with 10% Platform Commission
    const paidPayments = salon.payments || [];
    const totalAdvanceCollectedPkr = paidPayments.reduce((sum, p) => sum + p.amountPaidPkr, 0);

    const totalPlatformCommissionPkr = paidPayments.reduce((sum, p) => {
      const comm = p.commissionPkr > 0 ? p.commissionPkr : Math.round(p.amountPaidPkr * 0.10);
      return sum + comm;
    }, 0);

    const totalNetSalonSharePkr = paidPayments.reduce((sum, p) => {
      const share = p.salonSharePkr > 0 ? p.salonSharePkr : (p.amountPaidPkr - Math.round(p.amountPaidPkr * 0.10));
      return sum + share;
    }, 0);

    const pendingSettlementPkr = paidPayments
      .filter((p) => p.settlementStatus === "PENDING_SETTLEMENT" || p.settlementStatus === "PROCESSING")
      .reduce((sum, p) => {
        const share = p.salonSharePkr > 0 ? p.salonSharePkr : (p.amountPaidPkr - Math.round(p.amountPaidPkr * 0.10));
        return sum + share;
      }, 0);

    const settledPkr = paidPayments
      .filter((p) => p.settlementStatus === "SETTLED")
      .reduce((sum, p) => {
        const share = p.salonSharePkr > 0 ? p.salonSharePkr : (p.amountPaidPkr - Math.round(p.amountPaidPkr * 0.10));
        return sum + share;
      }, 0);

    return NextResponse.json({
      salonId: salon.id,
      salonName: salon.name,
      paymentAccount: salon.paymentAccount || null,
      stats: {
        totalAdvanceCollectedPkr,
        totalPlatformCommissionPkr,
        totalNetSalonSharePkr,
        pendingSettlementPkr,
        settledPkr,
        totalPaymentsCount: paidPayments.length,
      },
      payments: paidPayments,
      payouts: salon.payouts || [],
    });
  } catch (error) {
    console.error("GET /api/owner/payment-account error:", error);
    return NextResponse.json({ error: "Failed to retrieve payment settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "owner" || !session.salonId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const provider = String(body.provider || "").toUpperCase();
    const accountHolderName = String(body.accountHolderName || "").trim();
    const accountNumber = String(body.accountNumber || "").trim();
    const bankName = String(body.bankName || "").trim();
    const branchCode = String(body.branchCode || "").trim();
    const cnic = String(body.cnic || "").trim();
    const businessTitle = String(body.businessTitle || "").trim();
    const ipAddress = getClientIp(req);

    if (!["JAZZCASH", "EASYPAISA", "BANK"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid payment provider. Must be JAZZCASH, EASYPAISA, or BANK." },
        { status: 400 }
      );
    }

    if (!accountHolderName || accountHolderName.length < 3) {
      return NextResponse.json(
        { error: "Account holder name must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!accountNumber || accountNumber.length < 9) {
      return NextResponse.json(
        { error: "Valid mobile wallet number (e.g. 03XXXXXXXXX) or IBAN / Account Number is required." },
        { status: 400 }
      );
    }

    if (provider === "BANK" && !bankName) {
      return NextResponse.json(
        { error: "Bank name is required when selecting Bank Transfer." },
        { status: 400 }
      );
    }

    const existingAccount = await withRetry(() =>
      prisma.salonPaymentAccount.findUnique({
        where: { salonId: session.salonId },
      })
    );

    let account;
    if (existingAccount) {
      const isDetailsChanged =
        existingAccount.provider !== provider ||
        existingAccount.accountNumber !== accountNumber ||
        existingAccount.accountHolderName !== accountHolderName ||
        existingAccount.bankName !== (bankName || null) ||
        existingAccount.cnic !== (cnic || null);

      const nextStatus = isDetailsChanged ? "PENDING" : existingAccount.verificationStatus;

      account = await withRetry(() =>
        prisma.$transaction(async (tx) => {
          const updated = await tx.salonPaymentAccount.update({
            where: { salonId: session.salonId },
            data: {
              provider,
              accountHolderName,
              accountNumber,
              bankName: provider === "BANK" ? bankName : null,
              branchCode: provider === "BANK" ? branchCode : null,
              cnic: cnic || null,
              businessTitle: businessTitle || null,
              verificationStatus: nextStatus,
              rejectionReason: isDetailsChanged ? null : existingAccount.rejectionReason,
              verifiedAt: isDetailsChanged ? null : existingAccount.verifiedAt,
              verifiedBy: isDetailsChanged ? null : existingAccount.verifiedBy,
            },
          });

          await tx.paymentAccountAuditLog.create({
            data: {
              salonPaymentAccountId: updated.id,
              action: isDetailsChanged ? "UPDATED" : "EDITED",
              changedBy: session.email,
              oldValuesJson: JSON.stringify({
                provider: existingAccount.provider,
                accountNumber: existingAccount.accountNumber,
                accountHolderName: existingAccount.accountHolderName,
                verificationStatus: existingAccount.verificationStatus,
              }),
              newValuesJson: JSON.stringify({
                provider,
                accountNumber,
                accountHolderName,
                verificationStatus: nextStatus,
              }),
              ipAddress,
            },
          });

          return updated;
        })
      );
    } else {
      account = await withRetry(() =>
        prisma.$transaction(async (tx) => {
          const created = await tx.salonPaymentAccount.create({
            data: {
              salonId: session.salonId!,
              ownerId: session.userId,
              provider,
              accountHolderName,
              accountNumber,
              bankName: provider === "BANK" ? bankName : null,
              branchCode: provider === "BANK" ? branchCode : null,
              cnic: cnic || null,
              businessTitle: businessTitle || null,
              verificationStatus: "PENDING",
            },
          });

          await tx.paymentAccountAuditLog.create({
            data: {
              salonPaymentAccountId: created.id,
              action: "CREATED",
              changedBy: session.email,
              newValuesJson: JSON.stringify({
                provider,
                accountNumber,
                accountHolderName,
                verificationStatus: "PENDING",
              }),
              ipAddress,
            },
          });

          return created;
        })
      );
    }

    return NextResponse.json({
      success: true,
      paymentAccount: account,
      message:
        "Payment settings saved successfully. New or updated accounts are submitted for Super-Admin review and verification.",
    });
  } catch (error: unknown) {
    console.error("POST /api/owner/payment-account error:", error);
    const message = error instanceof Error ? error.message : "Failed to update payment account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
