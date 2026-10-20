import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageSalon, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const { id } = await params;

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  if (!canManageSalon(session, staff.salonId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.staff.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
