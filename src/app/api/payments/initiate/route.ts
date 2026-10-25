import { NextResponse } from "next/server";
import { paymentService } from "@/lib/payments/service";
import { PaymentProvider } from "@/lib/payments/types";

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
      return NextResponse.json(
        { error: "Invalid payment provider. Must be JAZZCASH or EASYPAISA." },
        { status: 400 }
      );
    }

    // Determine current base URL
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const result = await paymentService.initiateAdvancePayment(appointmentId, provider, baseUrl);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("API /api/payments/initiate error:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate advance payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
