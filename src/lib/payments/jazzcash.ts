import crypto from "crypto";
import { PaymentInitInput, PaymentInitOutput, PaymentVerifyResult } from "./types";

/**
 * JazzCash Official Merchant Payment Gateway Adapter
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
    this.isSandbox = (process.env.JAZZCASH_ENV || "sandbox").toLowerCase() !== "live";
  }

  public isConfigured(): boolean {
    return Boolean(this.merchantId && this.password && this.integritySalt);
  }

  public getCheckoutUrl(): string {
    return this.isSandbox
      ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
      : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
  }

  /**
   * Generates official JazzCash HMAC-SHA256 Secure Hash
   * 1. Sort all fields alphabetically by field name
   * 2. Filter out empty fields and pp_SecureHash
   * 3. Join values with &
   * 4. Compute HMAC-SHA256 using integritySalt
   */
  public generateSecureHash(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== "pp_SecureHash" && params[k] !== undefined && params[k] !== null && params[k] !== "")
      .sort();

    // Standard JazzCash HMAC-SHA256 string format
    const hashString = sortedKeys.map((k) => params[k]).join("&");
    return crypto.createHmac("sha256", this.integritySalt).update(hashString).digest("hex").toUpperCase();
  }

  /**
   * Initializes a 50% advance checkout session for JazzCash
   */
  public initiatePayment(input: PaymentInitInput): PaymentInitOutput {
    const callbackUrl =
      this.returnUrl || `${input.baseUrl.replace(/\/$/, "")}/api/payments/callback/jazzcash`;

    // If live/sandbox merchant credentials are not set, route to transparent sandbox simulator
    if (!this.isConfigured()) {
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
    const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiry

    const formatDateTime = (d: Date) =>
      d.toISOString().replace(/[-:T]/g, "").slice(0, 14);

    // JazzCash pp_TxnRefNo max length is 20 chars
    const sanitizedTxnRef = input.internalRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);

    const formFields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MPAY",
      pp_Language: "EN",
      pp_MerchantID: this.merchantId,
      pp_SubMerchantID: "",
      pp_Password: this.password,
      pp_BankID: "TBANK",
      pp_ProductID: "RETD",
      pp_TxnRefNo: sanitizedTxnRef,
      pp_Amount: String(input.advancePaisa), // In integer Paisa (e.g. 100000 for PKR 1,000)
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: formatDateTime(now),
      pp_BillReference: input.appointmentId.slice(0, 20),
      pp_Description: "QSalon 50% Advance Online Booking",
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

  /**
   * Verifies JazzCash postback callback
   */
  public verifyCallback(payload: Record<string, string>, expectedAdvancePaisa: number): PaymentVerifyResult {
    const responseCode = payload.pp_ResponseCode || "";
    const responseMessage = payload.pp_ResponseMessage || "Unknown response from JazzCash";
    const txnRefNo = payload.pp_TxnRefNo || "";
    const internalRef = payload.pp_mpf_1 || payload.pp_BillReference || txnRefNo;
    const incomingHash = (payload.pp_SecureHash || "").toUpperCase();
    const paidAmountPaisa = parseInt(payload.pp_Amount || "0", 10);
    const paidAmountPkr = Math.round(paidAmountPaisa / 100);

    // 1. Signature Check if credentials configured
    if (this.isConfigured() && incomingHash) {
      const calculatedHash = this.generateSecureHash(payload);
      if (incomingHash !== calculatedHash) {
        return {
          success: false,
          internalRef,
          provider: "JAZZCASH",
          providerRef: txnRefNo,
          amountPaidPkr: 0,
          amountPaidPaisa: 0,
          failureReason: "Security hash signature mismatch. Potential tampering detected.",
          rawPayload: payload,
        };
      }
    }

    // 2. Response code check: '000' or '121' indicates success in JazzCash
    const isSuccessCode = responseCode === "000" || responseCode === "121";

    if (!isSuccessCode) {
      return {
        success: false,
        internalRef,
        provider: "JAZZCASH",
        providerRef: txnRefNo,
        amountPaidPkr: 0,
        amountPaidPaisa: 0,
        failureReason: responseMessage || `JazzCash payment failed with code: ${responseCode}`,
        rawPayload: payload,
      };
    }

    // 3. Amount integrity check: Must match the exact required 50% advance paisa
    if (paidAmountPaisa !== expectedAdvancePaisa) {
      return {
        success: false,
        internalRef,
        provider: "JAZZCASH",
        providerRef: txnRefNo,
        amountPaidPkr: paidAmountPkr,
        amountPaidPaisa: paidAmountPaisa,
        failureReason: `Amount mismatch: Received ${paidAmountPaisa} Paisa, expected exactly ${expectedAdvancePaisa} Paisa (50% advance).`,
        rawPayload: payload,
      };
    }

    // 4. Currency check
    if (payload.pp_TxnCurrency && payload.pp_TxnCurrency !== "PKR") {
      return {
        success: false,
        internalRef,
        provider: "JAZZCASH",
        providerRef: txnRefNo,
        amountPaidPkr: 0,
        amountPaidPaisa: 0,
        failureReason: `Invalid currency: ${payload.pp_TxnCurrency}. Expected PKR.`,
        rawPayload: payload,
      };
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

export const jazzCash = new JazzCashAdapter();
