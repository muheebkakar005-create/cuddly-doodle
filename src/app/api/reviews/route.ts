import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePakistaniPhone } from "@/lib/phone";

async function refreshSalonRating(salonId: string) {
  const agg = await prisma.review.aggregate({
    where: { salonId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.salon.update({
    where: { id: salonId },
    data: {
      rating: Number((agg._avg.rating || 0).toFixed(1)),
      reviewCount: agg._count._all,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const appointmentId = String(body.appointmentId || "");
  const phone = normalizePakistaniPhone(String(body.customerPhone || ""));
  const rating = Number(body.rating);
  const comment = String(body.comment || "").slice(0, 800);
  const liked = Array.isArray(body.likedTags) ? body.likedTags.slice(0, 8) : [];
  const disliked = Array.isArray(body.dislikedTags) ? body.dislikedTags.slice(0, 8) : [];
  const platformFeedback = String(body.platformFeedback || "").slice(0, 500);

  if (!appointmentId || !phone || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Completed booking, phone and 1–5 star rating are required." }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { review: true },
  });
  if (!appointment || appointment.customerPhone !== phone) {
    return NextResponse.json({ error: "Booking not found for this number." }, { status: 404 });
  }
  if (appointment.status !== "COMPLETED") {
    return NextResponse.json({ error: "You can review after the salon marks the visit completed." }, { status: 400 });
  }
  if (appointment.review) {
    return NextResponse.json({ error: "This visit already has a review." }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      salonId: appointment.salonId,
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      customerPhone: phone,
      rating,
      comment,
      likedTagsJson: JSON.stringify(liked),
      dislikedTagsJson: JSON.stringify(disliked),
      platformFeedback,
    },
  });
  await refreshSalonRating(appointment.salonId);
  return NextResponse.json({ review }, { status: 201 });
}
