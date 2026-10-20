import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizePakistaniPhone } from "@/lib/phone";
import { generateSlots } from "@/lib/slots";
import { liveEvents } from "@/lib/liveEvents";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const salonId = searchParams.get("salonId");
  const date = searchParams.get("date");
  const area = searchParams.get("area");
  const status = searchParams.get("status");
  const session = await getSession();

  if (!phone && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where: Prisma.AppointmentWhereInput = {};
  if (phone) {
    const n = normalizePakistaniPhone(phone);
    if (!n) return NextResponse.json({ appointments: [] });
    where.customerPhone = n;
  }
  if (session?.role === "owner" && session.salonId) {
    where.salonId = session.salonId;
  } else if (salonId) {
    where.salonId = salonId;
  }
  if (date) where.appointmentDate = date;
  if (status) where.status = status;
  if (area) where.salon = { quettaArea: area };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      salon: true,
      services: { include: { service: true } },
      review: true,
    },
    orderBy: [{ appointmentDate: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return NextResponse.json({ appointments });
}

export async function POST(req: Request) {
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
      { status: 400 },
    );
  }

  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: { services: true, appointments: true },
  });
  if (!salon || salon.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  const selected = salon.services.filter((s) => serviceIds.includes(s.id));
  if (!selected.length) return NextResponse.json({ error: "Select at least one service" }, { status: 400 });

  const durationMinutes = selected.reduce((a, s) => a + s.durationMinutes, 0);
  const totalPricePkr = selected.reduce((a, s) => a + s.pricePkr, 0);

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
      { status: 409 },
    );
  }

  const appointment = await prisma.appointment.create({
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
  });

  // Emit instantaneous live event to salon owner's connected dashboard
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

  return NextResponse.json({ appointment }, { status: 201 });
}
