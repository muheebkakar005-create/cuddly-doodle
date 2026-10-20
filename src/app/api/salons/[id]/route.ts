import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canManageSalon, getAdminSession, getSession, isAdmin } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const salon = await prisma.salon.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { services: true, staff: true, reviews: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!salon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const session = await getSession();
  if (salon.approvalStatus !== "APPROVED" && !canManageSalon(session, salon.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ salon });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  if (!canManageSalon(session, id)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const data: Prisma.SalonUpdateInput = {
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
    imageUrl: body.imageUrl,
    mapsUrl: body.mapsUrl,
  };

  if (body.workingDays) data.workingDaysJson = JSON.stringify(body.workingDays);
  if (body.gallery) data.galleryJson = JSON.stringify(body.gallery);
  if (typeof body.galleryJson === "string") data.galleryJson = body.galleryJson;

  if (isAdmin(session)) {
    if (body.featured !== undefined) data.featured = Boolean(body.featured);
    if (body.rating !== undefined) data.rating = Number(body.rating);
    if (body.approvalStatus) {
      data.approvalStatus = body.approvalStatus;
      data.rejectionReason = body.rejectionReason || "";
    }
  }

  const salon = await prisma.salon.update({ where: { id }, data });
  return NextResponse.json({ salon });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.salon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
