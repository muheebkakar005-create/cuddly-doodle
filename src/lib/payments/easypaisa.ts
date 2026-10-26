import crypto from "crypto";
import { isPaymentSandboxMode } from "@/lib/appUrl";
import { PaymentInitInput, PaymentInitOutput, PaymentVerifyResult } from "./types";

/**
 * Easypaisa Easypay hosted checkout (Index.jsf + Confirm.jsf).
 * merchantHashedReq: sort request fields alphabetically, join as key=value&,
 * AES/ECB/PKCS5Padding with the merchant hash key, Base64.
 * Final status is not HMAC-signed; live confirmation must use order-status inquiry.
 * @see Easypay Merchant Integration Guide (Index.jsf / Confirm.jsf / REST order-status)
 */
export class EasypaisaAdapter {
  private storeId: string;
  private hashKey: string;
  private returnUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.storeId = process.env.EASYPAISA_STORE_ID || "";
    this.hashKey = process.env.EASYPAISA_HASH_KEY || "";
    this.returnUrl = process.env.EASYPAISA_RETURN_URL || process.env.EASYPAISA_POST_BACK_URL || "";
    this.isSandbox = isPaymentSandboxMode();
  }

  public isConfigured(): boolean {
    return Boolean(this.storeId && this.hashKey);
  }

  public getCheckoutUrl(): string {
    return this.isSandbox
      ? "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf"
      : "https://easypay.easypaisa.com.pk/easypay/Index.jsf";
  }

  public getConfirmUrl(): string {
    return this.isSandbox
      ? "https://easypaystg.easypaisa.com.pk/easypay/Confirm.jsf"
      : "https://easypay.easypaisa.com.pk/easypay/Confirm.jsf";
  }

  public generateHash(params: Record<string, string>): string {
    return this.generateMerchantHashedReq(params);
  }

  public generateMerchantHashedReq(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params)
      .filter((k) => k !== "merchantHashedReq" && params[k] !== undefined && params[k] !== "")
      .sort();
    const value = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
    return this.aesEcbEncrypt(value, this.hashKey);
  }

  private aesEcbEncrypt(plain: string, key: string): string {
    const keyBuf = Buffer.from(key, "utf8");
    let aesKey: Buffer;
    if (keyBuf.length === 16 || keyBuf.length === 24 || keyBuf.length === 32) {
      aesKey = keyBuf;
    } else if (keyBuf.length < 16) {
      aesKey = Buffer.concat([keyBuf, Buffer.alloc(16 - keyBuf.length)]);
    } else {
      aesKey = keyBuf.subarray(0, 16);
    }
    const cipher = crypto.createCipheriv(`aes-${aesKey.length * 8}-ecb`, aesKey, null);
    cipher.setAutoPadding(true);
    return Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]).toString("base64");
  }

  public initiatePayment(input: PaymentInitInput): PaymentInitOutput {
    const callbackUrl =
      this.returnUrl || `${input.baseUrl.replace(/\/$/, "")}/api/payments/callback/easypaisa`;

    if (!this.isConfigured()) {
      if (!this.isSandbox) {
        throw new Error(
          "Easypaisa merchant credentials are not configured. Online Easypaisa checkout cannot run in production until Store ID and Hash Key are set."
        );
      }
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
    const pad = (n: number) => String(n).padStart(2, "0");
    const expiryDate = `${expiry.getFullYear()}${pad(expiry.getMonth() + 1)}${pad(expiry.getDate())} ${pad(expiry.getHours())}${pad(expiry.getMinutes())}${pad(expiry.getSeconds())}`;

    const formFields: Record<string, string> = {
      storeId: this.storeId,
      amount: `${input.advancePkr}.0`,
      postBackURL: callbackUrl,
      orderRefNum: input.internalRef,
      expiryDate,
      autoRedirect: "1",
      paymentMethod: "MA_PAYMENT_METHOD",
      emailAddr: "info@qsalons.pk",
      mobileNum: input.customerPhone.replace(/[^0-9]/g, "").slice(-11),
    };
    formFields.merchantHashedReq = this.generateMerchantHashedReq(formFields);

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
   * Final Confirm.jsf callback: status + desc + orderRefNumber.
   * Unsigned. Live path must also pass inquireOrderStatus().
   */
  public verifyCallback(payload: Record<string, string>, expectedAdvancePkr: number): PaymentVerifyResult {
    const status = (payload.status || payload.responseCode || payload.rc || "").toString();
    const desc = payload.desc || payload.responseDesc || payload.responseCode || "";
    const internalRef = payload.orderRefNumber || payload.orderRefNum || payload.ref || "";
    const transactionId = payload.transactionId || payload.transId || payload.orderId || "";
    const incomingAmount = parseFloat(payload.amount || String(expectedAdvancePkr));
    const incomingAmountPaisa = Math.round(incomingAmount * 100);

    const isSuccess =
      status.toUpperCase() === "SUCCESS" ||
      status === "0000" ||
      status === "0" ||
      desc === "0000";

    if (!isSuccess) {
      return {
        success: false,
        internalRef,
        provider: "EASYPAISA",
        providerRef: transactionId,
        amountPaidPkr: 0,
        amountPaidPaisa: 0,
        failureReason: payload.desc || payload.responseDesc || `Easypaisa payment failed (${status})`,
        rawPayload: payload,
      };
    }

    if (payload.amount && Math.round(incomingAmount) !== Math.round(expectedAdvancePkr)) {
      return {
        success: false,
        internalRef,
        provider: "EASYPAISA",
        providerRef: transactionId,
        amountPaidPkr: Math.round(incomingAmount),
        amountPaidPaisa: incomingAmountPaisa,
        failureReason: `Amount mismatch: received PKR ${incomingAmount}, expected PKR ${expectedAdvancePkr}.`,
        rawPayload: payload,
      };
    }

    return {
      success: true,
      internalRef,
      provider: "EASYPAISA",
      providerRef: transactionId || internalRef,
      amountPaidPkr: expectedAdvancePkr,
      amountPaidPaisa: expectedAdvancePkr * 100,
      rawPayload: payload,
    };
  }

  public isHandshakePayload(payload: Record<string, string>): boolean {
    return Boolean(payload.auth_token) && !payload.status && !payload.orderRefNumber && payload.responseCode !== "0000";
  }

  public async inquireOrderStatus(orderRef: string): Promise<{ ok: boolean; raw: string; paid: boolean }> {
    if (!this.isConfigured()) {
      return { ok: false, raw: "", paid: false };
    }
    const base = this.isSandbox
      ? "https://easypaystg.easypaisa.com.pk"
      : "https://easypay.easypaisa.com.pk";
    const url = `${base}/easypay-service/rest/v1/order-status/${encodeURIComponent(orderRef)}/${encodeURIComponent(this.storeId)}`;
    try {
      const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
      const raw = await res.text();
      const paid = /success/i.test(raw) || /"0000"/.test(raw) || /PAID/i.test(raw);
      return { ok: res.ok, raw: raw.slice(0, 4000), paid };
    } catch (err) {
      return { ok: false, raw: err instanceof Error ? err.message : "inquiry failed", paid: false };
    }
  }
}

export const easypaisa = new EasypaisaAdapter();
