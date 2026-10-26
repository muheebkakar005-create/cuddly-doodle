import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma, withRetry } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizePakistaniPhone } from "@/lib/phone";
import { generateSlots } from "@/lib/slots";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { calculateAdvancePayment } from "@/lib/payments/calculation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const idsParam = searchParams.get("ids");
    const tokensParam = searchParams.get("tokens");
    const salonId = searchParams.get("salonId");
    const date = searchParams.get("date");
    const area = searchParams.get("area");
    const status = searchParams.get("status");
    const session = await getSession();

    if (!session) {
      const ip = getClientIp(req);
      const rl = rateLimit(`appointments_lookup:${ip}`, 30, 60 * 1000);
      if (!rl.success) {
        return NextResponse.json({ error: "Too many lookups. Please wait a minute and retry." }, { status: 429 });
      }
    }

    const where: Prisma.AppointmentWhereInput = {};

    if (session?.role === "owner" || session?.role === "staff") {
      if (!session.salonId) return NextResponse.json({ appointments: [] });
      where.salonId = session.salonId;
      if (date) where.appointmentDate = date;
      if (status) where.status = status;
      if (area) where.salon = { quettaArea: area };
    } else if (session?.role === "admin") {
      if (salonId) where.salonId = salonId;
      if (phone) {
        const n = normalizePakistaniPhone(phone);
        if (n) where.customerPhone = n;
      }
      if (date) where.appointmentDate = date;
      if (status) where.status = status;
      if (area) where.salon = { quettaArea: area };
    } else {
      const tokens = (tokensParam || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const ids = (idsParam || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const n = phone ? normalizePakistaniPhone(phone) : null;

      if (session?.role === "customer") {
        const me = await prisma.user.findUnique({ where: { id: session.userId } });
        if (me?.phone) where.customerPhone = me.phone;
        else if (n) where.customerPhone = n;
        else return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      } else if (tokens.length > 0 && n) {
        where.AND = [{ customerPhone: n }, { accessToken: { in: tokens } }];
      } else if (ids.length > 0 && tokens.length > 0) {
        where.AND = [{ id: { in: ids } }, { accessToken: { in: tokens } }];
      } else {
        return NextResponse.json(
          { error: "Sign in or provide your booking access tokens to view appointments." },
          { status: 401 }
        );
      }
    }

    const appointments = await withRetry(() =>
      prisma.appointment.findMany({
        where,
        include: {
          salon: true,
          services: { include: { service: true } },
          review: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: [{ appointmentDate: "desc" }, { createdAt: "desc" }],
        take: 200,
      })
    );

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("API /api/appointments GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve appointments", appointments: [] }, { status: 500 });
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
        include: { services: true, paymentAccount: true },
      })
    );
    if (!salon || salon.approvalStatus !== "APPROVED") {
      return NextResponse.json({ error: "Salon not found or inactive" }, { status: 404 });
    }

    if (!salon.paymentAccount || salon.paymentAccount.verificationStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          error:
            "Online advance payment is unavailable for this salon because its payout account has not yet been verified.",
        },
        { status: 422 }
      );
    }

    const selected = salon.services.filter((s) => serviceIds.includes(s.id));
    if (!selected.length) {
      return NextResponse.json({ error: "Select at least one valid service" }, { status: 400 });
    }

    const durationMinutes = selected.reduce((a, s) => a + s.durationMinutes, 0);
    const totalPricePkr = selected.reduce((a, s) => a + s.pricePkr, 0);
    const { advanceAmountPkr, remainingAmountPkr } = calculateAdvancePayment(totalPricePkr);

    const appointment = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${salonId}), hashtext(${appointmentDate + appointmentTime}))`;

        const now = new Date();
        const conflict = await tx.appointment.findFirst({
          where: {
            salonId,
            appointmentDate,
            appointmentTime,
            OR: [
              { status: { in: ["CONFIRMED", "COMPLETED"] } },
              { status: "PENDING", paymentStatus: "PENDING", expiresAt: { gt: now } },
            ],
          },
        });
        if (conflict) {
          throw new Error("SLOT_TAKEN");
        }

        const dayAppointments = await tx.appointment.findMany({
          where: { salonId, appointmentDate },
        });
        const slots = generateSlots({
          openTime: salon.openTime,
          closeTime: salon.closeTime,
          durationMinutes,
          date: appointmentDate,
          workingDaysJson: salon.workingDaysJson,
          breakStart: salon.breakStart,
          breakEnd: salon.breakEnd,
          booked: dayAppointments.map((a) => ({
            appointmentTime: a.appointmentTime,
            durationMinutes: a.durationMinutes,
            status: a.status,
            expiresAt: a.expiresAt,
          })),
        });
        const slot = slots.find((s) => s.time === appointmentTime);
        if (!slot?.available) {
          throw new Error("SLOT_UNAVAILABLE");
        }

        return tx.appointment.create({
          data: {
            salonId,
            customerName,
            customerPhone: phone,
            appointmentDate,
            appointmentTime,
            durationMinutes,
            totalPricePkr,
            advanceAmountPkr,
            paidAmountPkr: 0,
            remainingAmountPkr,
            paymentStatus: "PENDING",
            status: "PENDING",
            specialNotes,
            staffName,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            services: { create: selected.map((s) => ({ serviceId: s.id })) },
          },
          include: {
            salon: true,
            services: { include: { service: true } },
          },
        });
      })
    );

    return NextResponse.json({ appointment, accessToken: appointment.accessToken }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "That time slot was just selected by another customer. Please select another slot." },
        { status: 409 }
      );
    }
    if (msg === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "That time slot is not available. The shop may be closed, on break, or already booked." },
        { status: 409 }
      );
    }
    console.error("API /api/appointments POST error:", error);
    return NextResponse.json({ error: "Failed to initiate appointment booking. Please try again." }, { status: 500 });
  }
}
