import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/slots";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salonId");
  const date = searchParams.get("date");
  const duration = Number(searchParams.get("duration") || 45);
  if (!salonId || !date) {
    return NextResponse.json({ error: "salonId and date required" }, { status: 400 });
  }
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: {
      appointments: { where: { appointmentDate: date } },
    },
  });
  if (!salon || salon.approvalStatus !== "APPROVED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const slots = generateSlots({
    openTime: salon.openTime,
    closeTime: salon.closeTime,
    durationMinutes: duration,
    date,
    workingDaysJson: salon.workingDaysJson,
    breakStart: salon.breakStart,
    breakEnd: salon.breakEnd,
    booked: salon.appointments.map((a) => ({
      appointmentTime: a.appointmentTime,
      durationMinutes: a.durationMinutes,
      status: a.status,
      expiresAt: a.expiresAt,
    })),
  });
  return NextResponse.json({ slots, closed: slots.length === 0 });
}
