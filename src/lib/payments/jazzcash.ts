import crypto from "crypto";
import { isPaymentSandboxMode } from "@/lib/appUrl";
import { PaymentInitInput, PaymentInitOutput, PaymentVerifyResult } from "./types";

/**
 * JazzCash hosted checkout (Customer Portal / merchantform).
 * Hashing follows JazzCash Merchant Integration Guide:
 * sort non-empty pp_* fields (except pp_SecureHash) by name, join values with &,
 * prepend Integrity Salt, then HMAC-SHA256 with the salt as key.
 * @see https://sandbox.jazzcash.com.pk/SandboxDocumentation/features.html
 */
export class JazzCashAdapter {
  private merchantId: string;
  private password: string;
  private integritySalt: string;
  private returnUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.merchantId = process.env.JAZZCASH_MERCHANT_ID || "";
    this.password = process.env.JAZZCASH_PASSWORD || "";
    this.integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || "";
    this.returnUrl = process.env.JAZZCASH_RETURN_URL || "";
    this.isSandbox = isPaymentSandboxMode();
  }

  public isConfigured(): boolean {
    return Boolean(this.merchantId && this.password && this.integritySalt);
  }

  public getCheckoutUrl(): string {
    return this.isSandbox
      ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
      : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
  }

  public generateSecureHash(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== "pp_SecureHash" && params[k] !== undefined && params[k] !== null && params[k] !== "")
      .sort();
    const message = [this.integritySalt, ...sortedKeys.map((k) => params[k])].join("&");
    return crypto.createHmac("sha256", this.integritySalt).update(message, "utf8").digest("hex");
  }

  public initiatePayment(input: PaymentInitInput): PaymentInitOutput {
    const callbackUrl =
      this.returnUrl || `${input.baseUrl.replace(/\/$/, "")}/api/payments/callback/jazzcash`;

    if (!this.isConfigured()) {
      if (!this.isSandbox) {
        throw new Error(
          "JazzCash merchant credentials are not configured. Online JazzCash checkout cannot run in production until Merchant ID, Password, and Integrity Salt are set."
        );
      }
      return {
        success: true,
        internalRef: input.internalRef,
        provider: "JAZZCASH",
        checkoutUrl: `${input.baseUrl.replace(/\/$/, "")}/checkout/sandbox?provider=JAZZCASH&ref=${encodeURIComponent(input.internalRef)}`,
        checkoutType: "SANDBOX_SIMULATOR",
        advanceAmountPkr: input.advancePkr,
        totalAmountPkr: input.totalPkr,
        remainingAmountPkr: input.remainingPkr,
      };
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    const formatDateTime = (d: Date) => d.toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const sanitizedTxnRef = input.internalRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);

    const formFields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MPAY",
      pp_Language: "EN",
      pp_MerchantID: this.merchantId,
      pp_Password: this.password,
      pp_TxnRefNo: sanitizedTxnRef,
      pp_Amount: String(input.advancePaisa),
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: formatDateTime(now),
      pp_BillReference: input.appointmentId.slice(0, 20),
      pp_Description: "QSalons 50pct advance booking",
      pp_TxnExpiryDateTime: formatDateTime(expiry),
      pp_ReturnURL: callbackUrl,
      pp_mpf_1: input.internalRef,
      pp_mpf_2: input.appointmentId,
      pp_mpf_3: input.customerPhone,
    };

    formFields.pp_SecureHash = this.generateSecureHash(formFields);

    return {
      success: true,
      internalRef: input.internalRef,
      provider: "JAZZCASH",
      checkoutUrl: this.getCheckoutUrl(),
      checkoutType: "REDIRECT_POST",
      formFields,
      advanceAmountPkr: input.advancePkr,
      totalAmountPkr: input.totalPkr,
      remainingAmountPkr: input.remainingPkr,
    };
  }

  public verifyCallback(payload: Record<string, string>, expectedAdvancePaisa: number): PaymentVerifyResult {
    const responseCode = payload.pp_ResponseCode || "";
    const responseMessage = payload.pp_ResponseMessage || "Unknown response from JazzCash";
    const txnRefNo = payload.pp_TxnRefNo || "";
    const internalRef = payload.pp_mpf_1 || "";
    const incomingHash = (payload.pp_SecureHash || "").toLowerCase();
    const paidAmountPaisa = parseInt(payload.pp_Amount || "0", 10);
    const paidAmountPkr = Math.round(paidAmountPaisa / 100);

    if (this.isConfigured()) {
      if (!incomingHash) {
        return fail(internalRef, txnRefNo, payload, "Missing JazzCash pp_SecureHash.");
      }
      const calculatedHash = this.generateSecureHash(payload);
      if (incomingHash !== calculatedHash.toLowerCase()) {
        return fail(internalRef, txnRefNo, payload, "JazzCash security hash mismatch. Callback rejected.");
      }
    } else if (!this.isSandbox) {
      return fail(internalRef, txnRefNo, payload, "JazzCash is not configured; live callbacks are rejected.");
    }

    const isSuccessCode = responseCode === "000" || responseCode === "121";
    if (!isSuccessCode) {
      return fail(internalRef, txnRefNo, payload, responseMessage || `JazzCash declined with code ${responseCode}`);
    }

    if (paidAmountPaisa !== expectedAdvancePaisa) {
      return {
        success: false,
        internalRef,
        provider: "JAZZCASH",
        providerRef: txnRefNo,
        amountPaidPkr: paidAmountPkr,
        amountPaidPaisa: paidAmountPaisa,
        failureReason: `Amount mismatch: received ${paidAmountPaisa} paisa, expected ${expectedAdvancePaisa} paisa.`,
        rawPayload: payload,
      };
    }

    if (payload.pp_TxnCurrency && payload.pp_TxnCurrency !== "PKR") {
      return fail(internalRef, txnRefNo, payload, `Invalid currency ${payload.pp_TxnCurrency}. Expected PKR.`);
    }

    return {
      success: true,
      internalRef,
      provider: "JAZZCASH",
      providerRef: txnRefNo,
      amountPaidPkr: paidAmountPkr,
      amountPaidPaisa: paidAmountPaisa,
      rawPayload: payload,
    };
  }
}

function fail(
  internalRef: string,
  providerRef: string,
  payload: Record<string, string>,
  failureReason: string
): PaymentVerifyResult {
  return {
    success: false,
    internalRef,
    provider: "JAZZCASH",
    providerRef,
    amountPaidPkr: 0,
    amountPaidPaisa: 0,
    failureReason,
    rawPayload: payload,
  };
}

export const jazzCash = new JazzCashAdapter();
