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

    // Financial Ledger Calculations
    const paidPayments = salon.payments || [];
    const totalAdvanceCollectedPkr = paidPayments.reduce((sum, p) => sum + p.amountPaidPkr, 0);

    const pendingSettlementPkr = paidPayments
      .filter((p) => p.settlementStatus === "PENDING_SETTLEMENT" || p.settlementStatus === "PROCESSING")
      .reduce((sum, p) => sum + p.amountPaidPkr, 0);

    const settledPkr = paidPayments
      .filter((p) => p.settlementStatus === "SETTLED")
      .reduce((sum, p) => sum + p.amountPaidPkr, 0);

    return NextResponse.json({
      salonId: salon.id,
      salonName: salon.name,
      paymentAccount: salon.paymentAccount || null,
      stats: {
        totalAdvanceCollectedPkr,
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
        { error: "Valid Account Holder Full Legal Name is required." },
        { status: 400 }
      );
    }

    if (!accountNumber || accountNumber.length < 8) {
      return NextResponse.json(
        { error: "Valid Mobile Wallet Number or Bank IBAN/Account Number is required." },
        { status: 400 }
      );
    }

    if (provider === "BANK" && !bankName) {
      return NextResponse.json(
        { error: "Bank Name is required for Bank Account/IBAN payouts." },
        { status: 400 }
      );
    }

    // Check existing payment account
    const existing = await withRetry(() =>
      prisma.salonPaymentAccount.findUnique({
        where: { salonId: session.salonId },
      })
    );

    let paymentAccount;

    if (existing) {
      // Re-verification rule: If payout details are edited, reset status to PENDING
      paymentAccount = await withRetry(() =>
        prisma.$transaction(async (tx) => {
          const updated = await tx.salonPaymentAccount.update({
            where: { salonId: session.salonId },
            data: {
              provider,
              accountHolderName,
              accountNumber,
              bankName: provider === "BANK" ? bankName : null,
              branchCode: provider === "BANK" ? branchCode : null,
              cnic: cnic || existing.cnic,
              businessTitle: businessTitle || existing.businessTitle,
              verificationStatus: "PENDING", // Requires Admin Re-Verification
              rejectionReason: null,
            },
          });

          await tx.paymentAccountAuditLog.create({
            data: {
              salonPaymentAccountId: updated.id,
              action: "UPDATED",
              changedBy: session.email,
              oldValuesJson: JSON.stringify({
                provider: existing.provider,
                accountHolderName: existing.accountHolderName,
                accountNumber: existing.accountNumber.replace(/.(?=.{4})/g, "*"),
                bankName: existing.bankName,
              }),
              newValuesJson: JSON.stringify({
                provider,
                accountHolderName,
                accountNumber: accountNumber.replace(/.(?=.{4})/g, "*"),
                bankName,
              }),
              ipAddress,
            },
          });

          return updated;
        })
      );
    } else {
      paymentAccount = await withRetry(() =>
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
              cnic,
              businessTitle,
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
                accountHolderName,
                accountNumber: accountNumber.replace(/.(?=.{4})/g, "*"),
                bankName,
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
      paymentAccount,
      message:
        "Payment details submitted successfully. Status is now PENDING verification by QSalon administrators.",
    });
  } catch (error) {
    console.error("POST /api/owner/payment-account error:", error);
    return NextResponse.json({ error: "Failed to save payment settings" }, { status: 500 });
  }
}
