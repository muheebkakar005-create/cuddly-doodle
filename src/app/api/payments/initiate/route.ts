import { NextResponse } from "next/server";
import { paymentService } from "@/lib/payments/service";
import { PaymentProvider } from "@/lib/payments/types";
import { getAppUrl } from "@/lib/appUrl";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const appointmentId = String(body.appointmentId || "").trim();
    const provider = String(body.provider || "").toUpperCase() as PaymentProvider;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }
    if (provider !== "JAZZCASH" && provider !== "EASYPAISA") {
      return NextResponse.json({ error: "Invalid payment provider. Must be JAZZCASH or EASYPAISA." }, { status: 400 });
    }

    const result = await paymentService.initiateAdvancePayment(appointmentId, provider, getAppUrl(req));
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("API /api/payments/initiate error:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate advance payment";
    const status = message.includes("not yet been verified") || message.includes("unavailable") ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
