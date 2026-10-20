import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageSalon, getSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;
  if (!canManageSalon(session, id)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Service name required" }, { status: 400 });
  const service = await prisma.service.create({
    data: {
      salonId: id,
      name,
      durationMinutes: Number(body.durationMinutes || 30),
      pricePkr: Number(body.pricePkr || 0),
      category: body.category || "Custom",
    },
  });
  return NextResponse.json({ service }, { status: 201 });
}
