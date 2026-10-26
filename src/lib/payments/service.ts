import { prisma, withRetry } from "@/lib/prisma";
import { calculateAdvancePayment } from "./calculation";
import { jazzCash } from "./jazzcash";
import { easypaisa } from "./easypaisa";
import { PaymentInitOutput, PaymentProvider, PaymentVerifyResult } from "./types";
import { liveEvents } from "@/lib/liveEvents";
import { isPaymentSandboxMode } from "@/lib/appUrl";

export class PaymentService {
  public async initiateAdvancePayment(
    appointmentId: string,
    provider: PaymentProvider,
    baseUrl: string
  ): Promise<PaymentInitOutput> {
    const appointment = await withRetry(() =>
      prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          salon: { include: { paymentAccount: true } },
          services: { include: { service: true } },
        },
      })
    );

    if (!appointment) throw new Error("Appointment not found");

    if (!appointment.salon.paymentAccount || appointment.salon.paymentAccount.verificationStatus !== "VERIFIED") {
      throw new Error(
        "Online advance payment is unavailable for this salon because its payout account has not been verified by QSalons."
      );
    }

    if (appointment.paymentStatus === "PAID" || appointment.status === "CONFIRMED") {
      throw new Error("This appointment is already paid and confirmed.");
    }

    if (appointment.status === "CANCELLED") {
      throw new Error("This appointment was cancelled.");
    }

    const recalculateTotal = appointment.services.reduce((acc, s) => acc + s.service.pricePkr, 0);
    const totalPricePkr = recalculateTotal > 0 ? recalculateTotal : appointment.totalPricePkr;
    const { advanceAmountPkr, advanceAmountPaisa, remainingAmountPkr } = calculateAdvancePayment(totalPricePkr);

    const timestamp = Date.now();
    const shortProvider = provider === "JAZZCASH" ? "JC" : "EP";
    const internalRef = `QSC${shortProvider}${timestamp}${appointment.id.slice(-6).toUpperCase()}`.slice(0, 48);

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
          settlementStatus: "PENDING_SETTLEMENT",
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

    return provider === "JAZZCASH" ? jazzCash.initiatePayment(initInput) : easypaisa.initiatePayment(initInput);
  }

  public async findPaymentByCallback(payload: Record<string, string>) {
    const candidates = [
      payload.pp_mpf_1,
      payload.orderRefNum,
      payload.orderRefNumber,
      payload.ref,
      payload.pp_TxnRefNo,
      payload.pp_BillReference,
    ].filter(Boolean);

    for (const internalRef of candidates) {
      const payment = await prisma.payment.findUnique({
        where: { internalRef },
        include: {
          appointment: {
            include: { salon: true, services: { include: { service: true } } },
          },
        },
      });
      if (payment) return payment;
    }
    return null;
  }

  public async recordEasypaisaHandshake(authToken: string, orderHint?: string) {
    if (orderHint) {
      const found = await this.findPaymentByCallback({ orderRefNum: orderHint, ref: orderHint });
      if (found && found.status === "PENDING") {
        await prisma.payment.update({
          where: { id: found.id },
          data: {
            handshakeReceivedAt: new Date(),
            rawRequestJson: JSON.stringify({ auth_token: authToken, orderHint }),
          },
        });
        return found;
      }
    }
    return null;
  }

  public async handleCallback(
    provider: PaymentProvider,
    payload: Record<string, string>
  ): Promise<{ success: boolean; appointmentId: string; internalRef: string; error?: string }> {
    const payment = await this.findPaymentByCallback(payload);
    if (!payment) {
      throw new Error("Payment record not found for this callback.");
    }

    if (payment.status === "PAID" && payment.appointment.status === "CONFIRMED") {
      return { success: true, appointmentId: payment.appointmentId, internalRef: payment.internalRef };
    }

    let verification: PaymentVerifyResult;
    if (provider === "JAZZCASH") {
      verification = jazzCash.verifyCallback(payload, payment.amountPaisa);
    } else {
      if (easypaisa.isConfigured() && !isPaymentSandboxMode()) {
        if (!payment.handshakeReceivedAt) {
          return {
            success: false,
            appointmentId: payment.appointmentId,
            internalRef: payment.internalRef,
            error: "Easypaisa handshake (auth_token) was not received. Final callback rejected.",
          };
        }
        const inquiry = await easypaisa.inquireOrderStatus(payment.internalRef);
        if (!inquiry.ok || !inquiry.paid) {
          return {
            success: false,
            appointmentId: payment.appointmentId,
            internalRef: payment.internalRef,
            error:
              "Easypaisa order-status inquiry did not confirm this transaction. Booking was not marked paid.",
          };
        }
      }
      verification = easypaisa.verifyCallback(payload, payment.advanceRequiredPkr);
    }

    if (!verification.success) {
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

    const now = new Date();
    const claimed = await withRetry(() =>
      prisma.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: "PAID",
          settlementStatus: "PENDING_SETTLEMENT",
          providerRef: verification.providerRef || `TXN_${Date.now()}`,
          amountPaidPkr: payment.advanceRequiredPkr,
          remainingBalancePkr: payment.remainingBalancePkr,
          rawResponseJson: JSON.stringify(payload),
          paidAt: now,
        },
      })
    );

    if (claimed.count === 0) {
      return { success: true, appointmentId: payment.appointmentId, internalRef: payment.internalRef };
    }

    await withRetry(() =>
      prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentProvider: provider,
          paymentRef: verification.providerRef || payment.internalRef,
          paidAmountPkr: payment.advanceRequiredPkr,
          remainingAmountPkr: payment.remainingBalancePkr,
          expiresAt: null,
        },
      })
    );

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

    return { success: true, appointmentId: payment.appointmentId, internalRef: payment.internalRef };
  }
}

export const paymentService = new PaymentService();
