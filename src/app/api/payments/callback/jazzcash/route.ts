import { NextResponse } from "next/server";
import { paymentService } from "@/lib/payments/service";

export const dynamic = "force-dynamic";

async function processCallback(req: Request) {
  try {
    const payload: Record<string, string> = {};

    // 1. Try URL search parameters
    const { searchParams } = new URL(req.url);
    searchParams.forEach((val, key) => {
      payload[key] = val;
    });

    // 2. Try POST form data or JSON body
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const json = await req.json();
          Object.assign(payload, json);
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

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const result = await paymentService.handleCallback("JAZZCASH", payload);

    if (result.success) {
      return NextResponse.redirect(
        `${baseUrl}/bookings/confirmed?id=${result.appointmentId}&payment=success&ref=${encodeURIComponent(result.internalRef)}`,
        303
      );
    } else {
      return NextResponse.redirect(
        `${baseUrl}/bookings/confirmed?id=${result.appointmentId}&payment=failed&reason=${encodeURIComponent(result.error || "Payment verification failed")}`,
        303
      );
    }
  } catch (error: unknown) {
    console.error("JazzCash callback processing error:", error);
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    const message = error instanceof Error ? error.message : "Payment verification error";
    return NextResponse.redirect(
      `${baseUrl}/bookings?payment=failed&reason=${encodeURIComponent(message)}`,
      303
    );
  }
}

export async function POST(req: Request) {
  return processCallback(req);
}

export async function GET(req: Request) {
  return processCallback(req);
}
