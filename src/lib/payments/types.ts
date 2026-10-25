export type PaymentProvider = "JAZZCASH" | "EASYPAISA";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface PaymentInitInput {
  appointmentId: string;
  provider: PaymentProvider;
  customerName: string;
  customerPhone: string;
  totalPkr: number;
  advancePkr: number;
  advancePaisa: number;
  remainingPkr: number;
  internalRef: string;
  baseUrl: string;
}

export interface PaymentInitOutput {
  success: boolean;
  internalRef: string;
  provider: PaymentProvider;
  checkoutUrl: string;
  checkoutType: "REDIRECT_POST" | "REDIRECT_GET" | "SANDBOX_SIMULATOR";
  formFields?: Record<string, string>;
  advanceAmountPkr: number;
  totalAmountPkr: number;
  remainingAmountPkr: number;
}

export interface PaymentVerifyResult {
  success: boolean;
  internalRef: string;
  provider: PaymentProvider;
  providerRef?: string;
  amountPaidPkr: number;
  amountPaidPaisa: number;
  failureReason?: string;
  rawPayload: Record<string, unknown>;
}
