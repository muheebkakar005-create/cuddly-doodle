import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageSalon, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await prisma.staff.findMany({
    where: { salonId: id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ staff });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;

  if (!canManageSalon(session, id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const specialty = String(body.specialty || "").trim() || "Hair & Beard Stylist";
  const photoUrl = String(body.photoUrl || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Hairdresser / Specialist name is required." }, { status: 400 });
  }

  const member = await prisma.staff.create({
    data: {
      salonId: id,
      name,
      specialty,
      photoUrl,
    },
  });

  return NextResponse.json({ staff: member }, { status: 201 });
}
