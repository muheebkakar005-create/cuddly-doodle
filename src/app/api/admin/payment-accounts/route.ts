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
    const status = searchParams.get("status");

    const where: Record<string, string> = {};
    if (status) where.verificationStatus = status;

    const accounts = await withRetry(() =>
      prisma.salonPaymentAccount.findMany({
        where,
        include: {
          salon: {
            select: {
              id: true,
              name: true,
              slug: true,
              quettaArea: true,
              phone: true,
              whatsappNumber: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    );

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("GET /api/admin/payment-accounts error:", error);
    return NextResponse.json({ error: "Failed to load payment accounts" }, { status: 500 });
  }
}
