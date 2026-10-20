import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageSalon, getSession } from "@/lib/auth";

async function loadServiceSalon(id: string) {
  return prisma.service.findUnique({ where: { id } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  const existing = await loadServiceSalon(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageSalon(session, existing.salonId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const service = await prisma.service.update({
    where: { id },
    data: {
      name: body.name,
      durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
      pricePkr: body.pricePkr !== undefined ? Number(body.pricePkr) : undefined,
      category: body.category,
    },
  });
  return NextResponse.json({ service });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  const existing = await loadServiceSalon(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageSalon(session, existing.salonId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
