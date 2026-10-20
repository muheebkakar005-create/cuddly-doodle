import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { liveEvents, BookingEvent } from "@/lib/liveEvents";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (!session.salonId && session.role !== "admin")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const salonId = session.salonId || searchParams.get("salonId") || "";

  if (!salonId) {
    return new Response("Salon ID required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", salonId })}\n\n`)
      );

      // Subscribe to real-time booking events for this salon
      const unsubscribe = liveEvents.subscribe(salonId, (event: BookingEvent) => {
        try {
          controller.enqueue(encoder.encode(`event: new_booking\ndata: ${JSON.stringify(event)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keep-alive ping every 25 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(interval);
          unsubscribe();
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
