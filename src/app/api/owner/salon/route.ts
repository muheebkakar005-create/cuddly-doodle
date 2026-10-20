import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerSession, getSession, isAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const salonId = session.salonId;
  if (!salonId && !isAdmin(session)) return NextResponse.json({ error: "No shop linked" }, { status: 404 });
  if (!salonId) return NextResponse.json({ salon: null });

  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: {
      services: true,
      staff: true,
      appointments: { orderBy: { createdAt: "desc" }, take: 50, include: { services: { include: { service: true } } } },
    },
  });
  return NextResponse.json({ salon });
}

export async function PATCH(req: Request) {
  const session = await getOwnerSession();
  if (!session?.salonId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const salon = await prisma.salon.update({
    where: { id: session.salonId },
    data: {
      name: body.name,
      category: body.category,
      quettaArea: body.quettaArea,
      address: body.address,
      phone: body.phone,
      whatsappNumber: body.whatsappNumber,
      openTime: body.openTime,
      closeTime: body.closeTime,
      breakStart: body.breakStart,
      breakEnd: body.breakEnd,
      workingDaysJson: body.workingDays ? JSON.stringify(body.workingDays) : undefined,
      imageUrl: body.imageUrl,
      galleryJson: body.gallery ? JSON.stringify(body.gallery) : undefined,
      mapsUrl: body.mapsUrl,
    },
  });
  return NextResponse.json({ salon });
}
