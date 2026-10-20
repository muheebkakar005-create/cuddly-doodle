import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageSalon, getSession } from "@/lib/auth";
import { BOOKING_STATUSES } from "@/lib/constants";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { salon: true, services: { include: { service: true } }, review: true },
  });
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ appointment });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageSalon(session, existing.salonId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const status = String(body.status || "");
  if (!BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const appointment = await prisma.appointment.update({ where: { id }, data: { status } });
  return NextResponse.json({ appointment });
}
