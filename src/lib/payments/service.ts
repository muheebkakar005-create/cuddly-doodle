import { prisma, withRetry } from "@/lib/prisma";
import { calculateAdvancePayment } from "./calculation";
import { jazzCash } from "./jazzcash";
import { easypaisa } from "./easypaisa";
import { PaymentInitOutput, PaymentProvider, PaymentVerifyResult } from "./types";
import { liveEvents } from "@/lib/liveEvents";

export class PaymentService {
  /**
   * Initializes a mandatory 50% advance payment for an appointment.
   * Calculates the exact price server-side from the database records.
   */
  public async initiateAdvancePayment(
    appointmentId: string,
    provider: PaymentProvider,
    baseUrl: string
  ): Promise<PaymentInitOutput> {
    const appointment = await withRetry(() =>
      prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          salon: {
            include: { paymentAccount: true },
          },
          services: { include: { service: true } },
        },
      })
    );

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Mandatory Rule: Salon must have an approved, verified payment account
    if (
      !appointment.salon.paymentAccount ||
      appointment.salon.paymentAccount.verificationStatus !== "VERIFIED"
    ) {
      throw new Error(
        "Online advance payment is unavailable for this salon because its payment account has not yet been verified. Please try another salon or contact support."
      );
    }

    if (appointment.paymentStatus === "PAID" || appointment.status === "CONFIRMED") {
      throw new Error("This appointment is already paid and confirmed.");
    }

    // Server-side recalculation of total from database services to ensure zero client-side tampering
    const recalculateTotal = appointment.services.reduce((acc, s) => acc + s.service.pricePkr, 0);
    const totalPricePkr = recalculateTotal > 0 ? recalculateTotal : appointment.totalPricePkr;

    // Strict 50% Advance calculation in integer Paisa
    const {
      advanceAmountPkr,
      advanceAmountPaisa,
      remainingAmountPkr,
    } = calculateAdvancePayment(totalPricePkr);

    // Generate unique internal tracking reference
    const timestamp = Date.now();
    const shortProvider = provider === "JAZZCASH" ? "JC" : "EP";
    const internalRef = `QSC_${shortProvider}_${timestamp}_${appointment.id.slice(-6).toUpperCase()}`;

    // Update appointment with calculated advance amounts
    await withRetry(() =>
      prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          totalPricePkr,
          advanceAmountPkr,
          remainingAmountPkr,
          paymentProvider: provider,
        },
      })
    );

    // Create a new Payment record in PENDING status
    await withRetry(() =>
      prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          salonId: appointment.salonId,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          provider,
          internalRef,
          totalBookingPkr: totalPricePkr,
          advanceRequiredPkr: advanceAmountPkr,
          amountPaidPkr: 0,
          remainingBalancePkr: remainingAmountPkr,
          amountPaisa: advanceAmountPaisa,
          status: "PENDING",
        },
      })
    );

    const initInput = {
      appointmentId: appointment.id,
      provider,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      totalPkr: totalPricePkr,
      advancePkr: advanceAmountPkr,
      advancePaisa: advanceAmountPaisa,
      remainingPkr: remainingAmountPkr,
      internalRef,
      baseUrl,
    };

    if (provider === "JAZZCASH") {
      return jazzCash.initiatePayment(initInput);
    } else {
      return easypaisa.initiatePayment(initInput);
    }
  }

  /**
   * Processes gateway return callback or webhook notification idempotently.
   */
  public async handleCallback(
    provider: PaymentProvider,
    payload: Record<string, string>
  ): Promise<{ success: boolean; appointmentId: string; internalRef: string; error?: string }> {
    // 1. Determine internal reference
    const internalRef =
      payload.pp_mpf_1 ||
      payload.pp_BillReference ||
      payload.pp_TxnRefNo ||
      payload.orderRefNum ||
      payload.orderRefNumber ||
      payload.ref ||
      "";

    if (!internalRef) {
      throw new Error("Missing transaction tracking reference in payment callback.");
    }

    // 2. Fetch corresponding payment record
    const payment = await withRetry(() =>
      prisma.payment.findUnique({
        where: { internalRef },
        include: {
          appointment: {
            include: { salon: true, services: { include: { service: true } } },
          },
        },
      })
    );

    if (!payment) {
      throw new Error(`Payment record not found for internalRef: ${internalRef}`);
    }

    // 3. Idempotency Check: If already processed and confirmed, return success immediately
    if (payment.status === "PAID" && payment.appointment.status === "CONFIRMED") {
      return {
        success: true,
        appointmentId: payment.appointmentId,
        internalRef: payment.internalRef,
      };
    }

    // 4. Verify Gateway Callback
    let verification: PaymentVerifyResult;
    if (provider === "JAZZCASH") {
      verification = jazzCash.verifyCallback(payload, payment.amountPaisa);
    } else {
      verification = easypaisa.verifyCallback(payload, payment.advanceRequiredPkr);
    }

    // 5. Atomic Update
    if (verification.success) {
      const now = new Date();

      await withRetry(() =>
        prisma.$transaction([
          // Update Payment to PAID
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              providerRef: verification.providerRef || `TXN_${Date.now()}`,
              amountPaidPkr: payment.advanceRequiredPkr,
              remainingBalancePkr: payment.remainingBalancePkr,
              rawResponseJson: JSON.stringify(payload),
              paidAt: now,
            },
          }),
          // Update Appointment to CONFIRMED
          prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: {
              status: "CONFIRMED",
              paymentStatus: "PAID",
              paymentProvider: provider,
              paymentRef: verification.providerRef || `TXN_${Date.now()}`,
              paidAmountPkr: payment.advanceRequiredPkr,
              remainingAmountPkr: payment.remainingBalancePkr,
            },
          }),
        ])
      );

      // Emit live real-time notification to the salon owner dashboard
      try {
        liveEvents.emit({
          appointmentId: payment.appointment.id,
          salonId: payment.appointment.salonId,
          customerName: payment.appointment.customerName,
          customerPhone: payment.appointment.customerPhone,
          services: payment.appointment.services.map((s) => s.service.name),
          totalPricePkr: payment.appointment.totalPricePkr,
          appointmentDate: payment.appointment.appointmentDate,
          appointmentTime: payment.appointment.appointmentTime,
          staffName: payment.appointment.staffName,
          createdAt: now.toISOString(),
        });
      } catch (e) {
        console.warn("LiveEvent emission error (non-fatal):", e);
      }

      return {
        success: true,
        appointmentId: payment.appointmentId,
        internalRef: payment.internalRef,
      };
    } else {
      // Payment Failed or Rejected
      await withRetry(() =>
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            failureReason: verification.failureReason || "Payment verification failed",
            rawResponseJson: JSON.stringify(payload),
          },
        })
      );

      return {
        success: false,
        appointmentId: payment.appointmentId,
        internalRef: payment.internalRef,
        error: verification.failureReason || "Payment unsuccessful",
      };
    }
  }
}

export const paymentService = new PaymentService();
