import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { karachiDateISO } from "@/lib/hours";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = karachiDateISO();
  const [totalSalons, liveSalons, pendingSalons, bookingsToday] = await Promise.all([
    prisma.salon.count(),
    prisma.salon.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.salon.count({ where: { approvalStatus: "PENDING" } }),
    prisma.appointment.count({ where: { appointmentDate: today, status: { not: "CANCELLED" } } }),
  ]);
  return NextResponse.json({ totalSalons, liveSalons, pendingSalons, bookingsToday });
}
