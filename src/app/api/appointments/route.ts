import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma, withRetry } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizePakistaniPhone } from "@/lib/phone";
import { generateSlots } from "@/lib/slots";
import { liveEvents } from "@/lib/liveEvents";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const idsParam = searchParams.get("ids");
    const salonId = searchParams.get("salonId");
    const date = searchParams.get("date");
    const area = searchParams.get("area");
    const status = searchParams.get("status");
    const session = await getSession();

    // Enforce rate limiting for unauthenticated searches
    if (!session) {
      const ip = getClientIp(req);
      const rl = rateLimit(`appointments_lookup:${ip}`, 30, 60 * 1000);
      if (!rl.success) {
        return NextResponse.json(
          { error: "Too many lookups. Please wait a minute and retry." },
          { status: 429 }
        );
      }
    }

    if (!phone && !session && !idsParam) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Prisma.AppointmentWhereInput = {};

    // 1. Client passed specific booking IDs stored in their local session
    if (idsParam) {
      const allowedIds = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (allowedIds.length > 0) {
        where.id = { in: allowedIds };
      }
    }

    // 2. Filter by customer phone if provided
    if (phone) {
      const n = normalizePakistaniPhone(phone);
      if (!n) return NextResponse.json({ appointments: [] });
      where.customerPhone = n;
    }

    // 3. Role-based isolation
    if (session?.role === "owner") {
      // Owners can strictly only view appointments belonging to their own salon
      if (!session.salonId) {
        return NextResponse.json({ appointments: [] });
      }
      where.salonId = session.salonId;
    } else if (session?.role === "admin") {
      // Super Admin can filter by any salonId
      if (salonId) where.salonId = salonId;
    } else if (salonId && !phone && !idsParam) {
      // Unauthenticated visitors cannot enumerate arbitrary salons' bookings
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (date) where.appointmentDate = date;
    if (status) where.status = status;
    if (area) where.salon = { quettaArea: area };

    const appointments = await withRetry(() =>
      prisma.appointment.findMany({
        where,
        include: {
          salon: true,
          services: { include: { service: true } },
          review: true,
        },
        orderBy: [{ appointmentDate: "desc" }, { createdAt: "desc" }],
        take: 200,
      })
    );

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("API /api/appointments GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve appointments", appointments: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const customerName = String(body.customerName || "").trim();
    const phone = normalizePakistaniPhone(String(body.customerPhone || ""));
    const salonId = String(body.salonId || "");
    const appointmentDate = String(body.appointmentDate || "");
    const appointmentTime = String(body.appointmentTime || "");
    const serviceIds: string[] = Array.isArray(body.serviceIds) ? body.serviceIds : [];
    const specialNotes = String(body.specialNotes || "").slice(0, 500);
    const staffName = String(body.staffName || "Any Available");

    if (!customerName || !phone || !salonId || !appointmentDate || !appointmentTime || !serviceIds.length) {
      return NextResponse.json(
        { error: "Please fill name, valid Pakistani WhatsApp number, services, date and time." },
        { status: 400 }
      );
    }

    const salon = await withRetry(() =>
      prisma.salon.findUnique({
        where: { id: salonId },
        include: { services: true, appointments: true },
      })
    );
    if (!salon || salon.approvalStatus !== "APPROVED") {
      return NextResponse.json({ error: "Salon not found or inactive" }, { status: 404 });
    }

    const selected = salon.services.filter((s) => serviceIds.includes(s.id));
    if (!selected.length) {
      return NextResponse.json({ error: "Select at least one valid service" }, { status: 400 });
    }

    // Calculate trusted prices and durations directly from server database records
    const durationMinutes = selected.reduce((a, s) => a + s.durationMinutes, 0);
    const totalPricePkr = selected.reduce((a, s) => a + s.pricePkr, 0);

    // Concurrency Lock: Check if slot is already occupied before saving
    const conflict = await prisma.appointment.findFirst({
      where: {
        salonId,
        appointmentDate,
        appointmentTime,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "That time slot was just booked by another customer. Please select another slot." },
        { status: 409 }
      );
    }

    // Validate operating hours and slot availability
    const slots = generateSlots({
      openTime: salon.openTime,
      closeTime: salon.closeTime,
      durationMinutes,
      date: appointmentDate,
      workingDaysJson: salon.workingDaysJson,
      breakStart: salon.breakStart,
      breakEnd: salon.breakEnd,
      booked: salon.appointments
        .filter((a) => a.appointmentDate === appointmentDate)
        .map((a) => ({
          appointmentTime: a.appointmentTime,
          durationMinutes: a.durationMinutes,
          status: a.status,
        })),
    });
    const slot = slots.find((s) => s.time === appointmentTime);
    if (!slot?.available) {
      return NextResponse.json(
        { error: "That time slot is not available. The shop may be closed, on break, or already booked." },
        { status: 409 }
      );
    }

    const appointment = await withRetry(() =>
      prisma.appointment.create({
        data: {
          salonId,
          customerName,
          customerPhone: phone,
          appointmentDate,
          appointmentTime,
          durationMinutes,
          totalPricePkr,
          status: "PENDING",
          specialNotes,
          staffName,
          services: {
            create: selected.map((s) => ({ serviceId: s.id })),
          },
        },
        include: {
          salon: true,
          services: { include: { service: true } },
        },
      })
    );

    // Emit live event to connected salon owner dashboard
    try {
      liveEvents.emit({
        appointmentId: appointment.id,
        salonId: appointment.salonId,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        services: appointment.services.map((s) => s.service.name),
        totalPricePkr: appointment.totalPricePkr,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        staffName: appointment.staffName,
        createdAt: appointment.createdAt.toISOString(),
      });
    } catch (e) {
      console.warn("LiveEvent emission error (non-fatal):", e);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("API /api/appointments POST error:", error);
    return NextResponse.json(
      { error: "Failed to book appointment. Please try again." },
      { status: 500 }
    );
  }
}
