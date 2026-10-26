import { prisma, withRetry } from "@/lib/prisma";
import { calculateAdvancePayment, calculatePlatformCommission } from "./calculation";
import { jazzCash } from "./jazzcash";
import { easypaisa } from "./easypaisa";
import { PaymentInitOutput, PaymentProvider, PaymentVerifyResult } from "./types";
import { liveEvents } from "@/lib/liveEvents";
import { isPaymentSandboxMode } from "@/lib/appUrl";

export class PaymentService {
  public async initiatePayment(
    appointmentId: string,
    provider: PaymentProvider,
    baseUrl: string,
    paymentType: "ADVANCE" | "REMAINING" = "ADVANCE"
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
        "Online payment is unavailable for this salon because its payout account has not been verified by QSalons."
      );
    }

    if (appointment.status === "CANCELLED") {
      throw new Error("This appointment was cancelled.");
    }

    // Load platform default commission rate (basis points)
    const platformConfig = await withRetry(() =>
      prisma.platformPaymentConfig.findUnique({
        where: { id: "platform-config" },
      })
    );
    const rateBps = platformConfig?.defaultCommissionRateBps || 1000;

    let amountToPayPkr = 0;
    let amountToPayPaisa = 0;
    let remainingAmountPkr = 0;
    const recalculateTotal = appointment.services.reduce((acc, s) => acc + s.service.pricePkr, 0);
    const totalPricePkr = recalculateTotal > 0 ? recalculateTotal : appointment.totalPricePkr;

    if (paymentType === "ADVANCE") {
      if (appointment.paymentStatus === "PAID" || appointment.status === "CONFIRMED") {
        throw new Error("This appointment already has an advance paid and confirmed.");
      }
      const calc = calculateAdvancePayment(totalPricePkr);
      amountToPayPkr = calc.advanceAmountPkr;
      amountToPayPaisa = calc.advanceAmountPaisa;
      remainingAmountPkr = calc.remainingAmountPkr;

      await withRetry(() =>
        prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            totalPricePkr,
            advanceAmountPkr: amountToPayPkr,
            remainingAmountPkr,
            paymentProvider: provider,
          },
        })
      );
    } else if (paymentType === "REMAINING") {
      if (appointment.remainingAmountPkr <= 0) {
        throw new Error("This appointment has no remaining balance due.");
      }
      amountToPayPkr = appointment.remainingAmountPkr;
      amountToPayPaisa = amountToPayPkr * 100;
      remainingAmountPkr = 0;
    } else {
      throw new Error(`Unsupported payment type: ${paymentType}`);
    }

    // Calculate platform commission on this payment step
    const comm = calculatePlatformCommission(amountToPayPkr, rateBps);

    const timestamp = Date.now();
    const shortProvider = provider === "JAZZCASH" ? "JC" : "EP";
    const typeCode = paymentType === "REMAINING" ? "REM" : "ADV";
    const internalRef = `QSC${shortProvider}${typeCode}${timestamp}${appointment.id.slice(-6).toUpperCase()}`.slice(0, 48);

    await withRetry(() =>
      prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          salonId: appointment.salonId,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          provider,
          internalRef,
          paymentType,
          totalBookingPkr: totalPricePkr,
          advanceRequiredPkr: amountToPayPkr,
          amountPaidPkr: 0,
          remainingBalancePkr: remainingAmountPkr,
          amountPaisa: amountToPayPaisa,
          commissionRateBps: rateBps,
          commissionPkr: comm.commissionPkr,
          commissionPaisa: comm.commissionPaisa,
          salonSharePkr: comm.salonAllocationPkr,
          salonSharePaisa: comm.salonAllocationPaisa,
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
      advancePkr: amountToPayPkr,
      advancePaisa: amountToPayPaisa,
      remainingPkr: remainingAmountPkr,
      internalRef,
      baseUrl,
      paymentType,
    };

    return provider === "JAZZCASH" ? jazzCash.initiatePayment(initInput) : easypaisa.initiatePayment(initInput);
  }

  public async initiateAdvancePayment(
    appointmentId: string,
    provider: PaymentProvider,
    baseUrl: string
  ): Promise<PaymentInitOutput> {
    return this.initiatePayment(appointmentId, provider, baseUrl, "ADVANCE");
  }

  public async findPaymentByCallback(payload: Record<string, string>) {
    const candidates = [
      payload.pp_mpf_1,
      payload.orderRefNum,
      payload.pp_BillReference,
      payload.pp_TxnRefNo,
      payload.transactionId,
    ].filter(Boolean);

    for (const ref of candidates) {
      const found = await withRetry(() =>
        prisma.payment.findFirst({
          where: {
            OR: [{ internalRef: ref }, { providerRef: ref }, { appointmentId: ref }],
          },
          include: {
            appointment: {
              include: { services: { include: { service: true } } },
            },
          },
        })
      );
      if (found) return found;
    }
    return null;
  }

  public async recordEasypaisaHandshake(authToken: string, ref?: string) {
    if (!ref && !authToken) return;
    try {
      const candidates: { internalRef?: string; providerRef?: string }[] = [];
      if (ref) {
        candidates.push({ internalRef: ref });
        candidates.push({ providerRef: ref });
      }
      if (candidates.length > 0) {
        await withRetry(() =>
          prisma.payment.updateMany({
            where: {
              OR: candidates,
              status: "PENDING",
            },
            data: { handshakeReceivedAt: new Date() },
          })
        );
      }
    } catch {
      // non-fatal
    }
  }

  public async recordHandshake(internalRef: string) {
    return this.recordEasypaisaHandshake("", internalRef);
  }

  public async handleCallback(
    provider: PaymentProvider,
    payload: Record<string, string>
  ): Promise<{ success: boolean; appointmentId?: string; internalRef?: string; error?: string }> {
    const payment = await this.findPaymentByCallback(payload);
    if (!payment) {
      return { success: false, error: "Payment record not found for this callback." };
    }

    if (payment.status === "PAID") {
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
    const actualPaidPkr = payment.advanceRequiredPkr;
    const rateBps = payment.commissionRateBps || 1000;
    const comm = calculatePlatformCommission(actualPaidPkr, rateBps);

    // Atomic check-and-set: only update if status is still PENDING to prevent race conditions & duplicate commissions
    const claimed = await withRetry(() =>
      prisma.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: "PAID",
          settlementStatus: "PENDING_SETTLEMENT",
          providerRef: verification.providerRef || `TXN_${Date.now()}`,
          amountPaidPkr: actualPaidPkr,
          remainingBalancePkr: payment.remainingBalancePkr,
          commissionRateBps: rateBps,
          commissionPkr: comm.commissionPkr,
          commissionPaisa: comm.commissionPaisa,
          salonSharePkr: comm.salonAllocationPkr,
          salonSharePaisa: comm.salonAllocationPaisa,
          rawResponseJson: JSON.stringify(payload),
          paidAt: now,
        },
      })
    );

    if (claimed.count === 0) {
      return { success: true, appointmentId: payment.appointmentId, internalRef: payment.internalRef };
    }

    // Record verified PlatformCommission ledger entry (idempotent unique constraint on paymentId)
    await withRetry(() =>
      prisma.platformCommission.upsert({
        where: { paymentId: payment.id },
        create: {
          paymentId: payment.id,
          appointmentId: payment.appointmentId,
          salonId: payment.salonId,
          paymentType: payment.paymentType,
          advanceAmountPaisa: payment.amountPaisa,
          advanceAmountPkr: actualPaidPkr,
          rateBps,
          commissionPaisa: comm.commissionPaisa,
          commissionPkr: comm.commissionPkr,
          salonAllocationPaisa: comm.salonAllocationPaisa,
          salonAllocationPkr: comm.salonAllocationPkr,
          providerRef: verification.providerRef || payment.internalRef,
          provider,
          status: "EARNED",
          settlementStatus: "RETAINED",
        },
        update: {
          paymentType: payment.paymentType,
          providerRef: verification.providerRef || payment.internalRef,
          status: "EARNED",
          settlementStatus: "RETAINED",
        },
      })
    );

    // Update appointment paid status
    if (payment.paymentType === "REMAINING") {
      await withRetry(() =>
        prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paidAmountPkr: payment.totalBookingPkr,
            remainingAmountPkr: 0,
            paymentProvider: provider,
            paymentRef: verification.providerRef || payment.internalRef,
          },
        })
      );
    } else {
      await withRetry(() =>
        prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: "CONFIRMED",
            paymentStatus: "PAID",
            paymentProvider: provider,
            paymentRef: verification.providerRef || payment.internalRef,
            paidAmountPkr: actualPaidPkr,
            remainingAmountPkr: payment.remainingBalancePkr,
            expiresAt: null,
          },
        })
      );
    }

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
