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

    const records = await withRetry(() =>
      prisma.platformCommission.findMany({
        include: {
          salon: { select: { name: true, quettaArea: true } },
          payment: { select: { internalRef: true, totalBookingPkr: true, customerName: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    // CSV Headers
    const headers = [
      "Commission_ID",
      "Date",
      "Salon_Name",
      "Quetta_Area",
      "Customer_Name",
      "Provider",
      "Provider_Ref",
      "Internal_Ref",
      "Total_Booking_PKR",
      "Advance_Paid_PKR",
      "Commission_Rate",
      "Commission_Amount_PKR",
      "Salon_Allocation_PKR",
      "Status",
      "Settlement_Status",
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${new Date(r.createdAt).toISOString()}"`,
      `"${(r.salon.name || "").replace(/"/g, '""')}"`,
      `"${(r.salon.quettaArea || "").replace(/"/g, '""')}"`,
      `"${(r.payment.customerName || "").replace(/"/g, '""')}"`,
      `"${r.provider}"`,
      `"${r.providerRef || ""}"`,
      `"${r.payment.internalRef || ""}"`,
      r.payment.totalBookingPkr,
      r.advanceAmountPkr,
      `"10% (1000 bps)"`,
      r.commissionPkr,
      r.salonAllocationPkr,
      `"${r.status}"`,
      `"${r.settlementStatus}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qsalon-platform-commissions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/commission/export error:", error);
    return NextResponse.json({ error: "Failed to export commission data" }, { status: 500 });
  }
}
