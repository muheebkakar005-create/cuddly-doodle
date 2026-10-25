import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId");
    const ref = searchParams.get("ref");

    if (!appointmentId && !ref) {
      return NextResponse.json({ error: "appointmentId or ref is required" }, { status: 400 });
    }

    if (ref) {
      const payment = await withRetry(() =>
        prisma.payment.findUnique({
          where: { internalRef: ref },
          include: { appointment: true },
        })
      );
      if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      return NextResponse.json({
        payment: {
          id: payment.id,
          internalRef: payment.internalRef,
          provider: payment.provider,
          status: payment.status,
          totalBookingPkr: payment.totalBookingPkr,
          advanceRequiredPkr: payment.advanceRequiredPkr,
          amountPaidPkr: payment.amountPaidPkr,
          remainingBalancePkr: payment.remainingBalancePkr,
          providerRef: payment.providerRef,
          paidAt: payment.paidAt,
        },
        appointment: {
          id: payment.appointment.id,
          status: payment.appointment.status,
          paymentStatus: payment.appointment.paymentStatus,
        },
      });
    }

    if (appointmentId) {
      const appointment = await withRetry(() =>
        prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
        })
      );
      if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      const latestPayment = appointment.payments[0] || null;
      return NextResponse.json({
        appointment: {
          id: appointment.id,
          status: appointment.status,
          paymentStatus: appointment.paymentStatus,
          totalPricePkr: appointment.totalPricePkr,
          advanceAmountPkr: appointment.advanceAmountPkr,
          paidAmountPkr: appointment.paidAmountPkr,
          remainingAmountPkr: appointment.remainingAmountPkr,
          paymentProvider: appointment.paymentProvider,
          paymentRef: appointment.paymentRef,
        },
        latestPayment,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: unknown) {
    console.error("API /api/payments/status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
