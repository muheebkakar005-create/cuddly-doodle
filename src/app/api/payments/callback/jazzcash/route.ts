import { NextResponse } from "next/server";
import { paymentService } from "@/lib/payments/service";
import { getAppUrl } from "@/lib/appUrl";

export const dynamic = "force-dynamic";

async function readPayload(req: Request) {
  const payload: Record<string, string> = {};
  const { searchParams } = new URL(req.url);
  searchParams.forEach((val, key) => {
    payload[key] = val;
  });
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        Object.assign(payload, await req.json());
      } catch {}
    } else {
      try {
        const formData = await req.formData();
        formData.forEach((val, key) => {
          if (typeof val === "string") payload[key] = val;
        });
      } catch {}
    }
  }
  return payload;
}

async function processCallback(req: Request) {
  const baseUrl = getAppUrl(req);
  try {
    const payload = await readPayload(req);
    const result = await paymentService.handleCallback("JAZZCASH", payload);
    const path = result.success
      ? `/bookings/confirmed?id=${result.appointmentId}&payment=success&ref=${encodeURIComponent(result.internalRef)}`
      : `/bookings/confirmed?id=${result.appointmentId}&payment=failed&reason=${encodeURIComponent(result.error || "Payment verification failed")}`;
    return NextResponse.redirect(`${baseUrl}${path}`, 303);
  } catch (error: unknown) {
    console.error("JazzCash callback processing error:", error);
    const message = error instanceof Error ? error.message : "Payment verification error";
    return NextResponse.redirect(`${baseUrl}/bookings?payment=failed&reason=${encodeURIComponent(message)}`, 303);
  }
}

export async function POST(req: Request) {
  return processCallback(req);
}

export async function GET(req: Request) {
  return processCallback(req);
}
