import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { canManageSalon, getSession } from "@/lib/auth";
import { BOOKING_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const appointment = await withRetry(() =>
      prisma.appointment.findUnique({
        where: { id },
        include: { salon: true, services: { include: { service: true } }, review: true },
      })
    );
    if (!appointment) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Authorization: only the creating customer (via booking ref) or salon owner/admin can view
    // For booking confirmation pages we allow public access by ID (the ID itself acts as a token)
    // But we strip sensitive customer phone from public access unless authenticated
    const isManagedBy = canManageSalon(session, appointment.salonId);
    if (!isManagedBy) {
      // Return a safe subset — strip phone number for unauthenticated callers
      const safeAppointment = {
        ...appointment,
        customerPhone: appointment.customerPhone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2"),
      };
      return NextResponse.json({ appointment: safeAppointment });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("GET /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Failed to retrieve appointment" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    const existing = await withRetry(() =>
      prisma.appointment.findUnique({ where: { id } })
    );
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (!canManageSalon(session, existing.salonId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const status = String(body.status || "");
    if (!BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const appointment = await withRetry(() =>
      prisma.appointment.update({ where: { id }, data: { status } })
    );
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("PATCH /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
