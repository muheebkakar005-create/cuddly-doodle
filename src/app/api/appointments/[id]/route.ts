import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { canManageBookings, getSession } from "@/lib/auth";
import { BOOKING_STATUSES } from "@/lib/constants";
import { karachiNow } from "@/lib/hours";

export const dynamic = "force-dynamic";

function appointmentDateTime(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("token") || "";
    const session = await getSession();

    const appointment = await withRetry(() =>
      prisma.appointment.findUnique({
        where: { id },
        include: {
          salon: true,
          services: { include: { service: true } },
          review: true,
          payments: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      })
    );
    if (!appointment) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isManagedBy = canManageBookings(session, appointment.salonId);
    const hasToken = token && token === appointment.accessToken;
    const isCustomer =
      session?.role === "customer" &&
      (await prisma.user.findUnique({ where: { id: session.userId } }))?.phone === appointment.customerPhone;

    if (!isManagedBy && !hasToken && !isCustomer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("GET /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Failed to retrieve appointment" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const { id } = await params;
    const body = await req.json();
    const status = String(body.status || "");
    const token = String(body.token || "");

    const existing = await withRetry(() => prisma.appointment.findUnique({ where: { id } }));
    if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (!BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const managed = canManageBookings(session, existing.salonId);
    const customerCancel = token && token === existing.accessToken && status === "CANCELLED";

    if (!managed && !customerCancel) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (status === "CONFIRMED" && existing.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Cannot confirm an unpaid online booking. Wait for verified 50% advance payment." },
        { status: 409 }
      );
    }

    if (customerCancel) {
      if (existing.status === "COMPLETED") {
        return NextResponse.json({ error: "Completed visits cannot be cancelled." }, { status: 409 });
      }
      if (existing.status === "CONFIRMED" && existing.paymentStatus === "PAID") {
        const start = appointmentDateTime(existing.appointmentDate, existing.appointmentTime);
        const hoursLeft = (start.getTime() - karachiNow().getTime()) / 36e5;
        if (hoursLeft < 4) {
          return NextResponse.json(
            { error: "Paid bookings can only be cancelled at least 4 hours before the appointment." },
            { status: 409 }
          );
        }
      }
    }

    const appointment = await withRetry(() => prisma.appointment.update({ where: { id }, data: { status } }));
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("PATCH /api/appointments/[id] error:", error);
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}
