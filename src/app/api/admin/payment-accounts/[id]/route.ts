import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const verificationStatus = String(body.verificationStatus || "").toUpperCase();
    const rejectionReason = body.rejectionReason ? String(body.rejectionReason).trim() : null;
    const ipAddress = getClientIp(req);

    if (!["VERIFIED", "REJECTED", "SUSPENDED", "PENDING"].includes(verificationStatus)) {
      return NextResponse.json(
        { error: "Invalid verificationStatus. Must be VERIFIED, REJECTED, SUSPENDED, or PENDING." },
        { status: 400 }
      );
    }

    const existing = await withRetry(() =>
      prisma.salonPaymentAccount.findUnique({
        where: { id },
        include: { salon: true },
      })
    );

    if (!existing) {
      return NextResponse.json({ error: "Payment account not found" }, { status: 404 });
    }

    const updated = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const account = await tx.salonPaymentAccount.update({
          where: { id },
          data: {
            verificationStatus,
            rejectionReason: verificationStatus === "REJECTED" ? rejectionReason : null,
            verifiedAt: verificationStatus === "VERIFIED" ? new Date() : null,
            verifiedBy: verificationStatus === "VERIFIED" ? session.email : null,
          },
        });

        await tx.paymentAccountAuditLog.create({
          data: {
            salonPaymentAccountId: account.id,
            action: verificationStatus,
            changedBy: session.email,
            oldValuesJson: JSON.stringify({
              verificationStatus: existing.verificationStatus,
              rejectionReason: existing.rejectionReason,
            }),
            newValuesJson: JSON.stringify({
              verificationStatus,
              rejectionReason,
            }),
            ipAddress,
          },
        });

        return account;
      })
    );

    return NextResponse.json({
      success: true,
      account: updated,
      message: `Salon payment account status updated to ${verificationStatus}.`,
    });
  } catch (error) {
    console.error("PATCH /api/admin/payment-accounts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update payment account status" }, { status: 500 });
  }
}
