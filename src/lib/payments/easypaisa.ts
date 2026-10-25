import crypto from "crypto";
import { PaymentInitInput, PaymentInitOutput, PaymentVerifyResult } from "./types";

/**
 * Easypaisa Official Merchant Gateway Adapter
 */
export class EasypaisaAdapter {
  private storeId: string;
  private hashKey: string;
  private returnUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.storeId = process.env.EASYPAISA_STORE_ID || "";
    this.hashKey = process.env.EASYPAISA_HASH_KEY || "";
    this.returnUrl = process.env.EASYPAISA_RETURN_URL || "";
    this.isSandbox = (process.env.EASYPAISA_ENV || "sandbox").toLowerCase() !== "live";
  }

  public isConfigured(): boolean {
    return Boolean(this.storeId && this.hashKey);
  }

  public getCheckoutUrl(): string {
    return this.isSandbox
      ? "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf"
      : "https://easypay.easypaisa.com.pk/easypay/Index.jsf";
  }

  /**
   * Generates Easypaisa Merchant Hash (HMAC-SHA256 or AES)
   */
  public generateHash(params: Record<string, string>): string {
    if (!this.hashKey) return "";
    const sortedKeys = Object.keys(params).sort();
    const dataString = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
    return crypto.createHmac("sha256", this.hashKey).update(dataString).digest("hex");
  }

  /**
   * Initializes a 50% advance checkout session for Easypaisa
   */
  public initiatePayment(input: PaymentInitInput): PaymentInitOutput {
    const callbackUrl =
      this.returnUrl || `${input.baseUrl.replace(/\/$/, "")}/api/payments/callback/easypaisa`;

    // If live/sandbox merchant credentials are not set, route to transparent sandbox simulator
    if (!this.isConfigured()) {
      return {
        success: true,
        internalRef: input.internalRef,
        provider: "EASYPAISA",
        checkoutUrl: `${input.baseUrl.replace(/\/$/, "")}/checkout/sandbox?provider=EASYPAISA&ref=${encodeURIComponent(input.internalRef)}`,
        checkoutType: "SANDBOX_SIMULATOR",
        advanceAmountPkr: input.advancePkr,
        totalAmountPkr: input.totalPkr,
        remainingAmountPkr: input.remainingPkr,
      };
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    const formatExpiry = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;

    const formFields: Record<string, string> = {
      storeId: this.storeId,
      amount: `${input.advancePkr}.0`, // PKR with decimal as per Easypay format
      postBackURL: callbackUrl,
      orderRefNum: input.internalRef,
      expiryDate: formatExpiry(expiry),
      autoRedirect: "1",
      paymentMethod: "MA_PAYMENT_METHOD",
      emailAddress: "info@qsalons.pk",
      mobileNum: input.customerPhone.replace(/[^0-9]/g, "").slice(-11),
    };

    formFields.merchantHashedReq = this.generateHash(formFields);

    return {
      success: true,
      internalRef: input.internalRef,
      provider: "EASYPAISA",
      checkoutUrl: this.getCheckoutUrl(),
      checkoutType: "REDIRECT_POST",
      formFields,
      advanceAmountPkr: input.advancePkr,
      totalAmountPkr: input.totalPkr,
      remainingAmountPkr: input.remainingPkr,
    };
  }

  /**
   * Verifies Easypaisa return callback or webhook notification
   */
  public verifyCallback(payload: Record<string, string>, expectedAdvancePkr: number): PaymentVerifyResult {
    const responseCode = payload.responseCode || payload.status || payload.rc || "";
    const responseDesc = payload.responseDesc || payload.desc || "Transaction processing completed";
    const transactionId = payload.transactionId || payload.transId || payload.orderId || "";
    const internalRef = payload.orderRefNum || payload.orderRefNumber || payload.ref || "";
    const incomingAmount = parseFloat(payload.amount || "0");
    const incomingAmountPaisa = Math.round(incomingAmount * 100);

    // Success codes in Easypay: '0000', '0', 'SUCCESS'
    const isSuccess = responseCode === "0000" || responseCode === "0" || responseCode.toUpperCase() === "SUCCESS";

    if (!isSuccess) {
      return {
        success: false,
        internalRef,
        provider: "EASYPAISA",
        providerRef: transactionId,
        amountPaidPkr: 0,
        amountPaidPaisa: 0,
        failureReason: responseDesc || `Easypaisa payment failed with code: ${responseCode}`,
        rawPayload: payload,
      };
    }

    // Amount verification: Must match the expected 50% advance in PKR
    if (Math.round(incomingAmount) !== Math.round(expectedAdvancePkr)) {
      return {
        success: false,
        internalRef,
        provider: "EASYPAISA",
        providerRef: transactionId,
        amountPaidPkr: Math.round(incomingAmount),
        amountPaidPaisa: incomingAmountPaisa,
        failureReason: `Amount mismatch: Received PKR ${incomingAmount}, expected PKR ${expectedAdvancePkr} (50% advance).`,
        rawPayload: payload,
      };
    }

    return {
      success: true,
      internalRef,
      provider: "EASYPAISA",
      providerRef: transactionId,
      amountPaidPkr: Math.round(incomingAmount),
      amountPaidPaisa: Math.round(incomingAmount * 100),
      rawPayload: payload,
    };
  }
}

export const easypaisa = new EasypaisaAdapter();
