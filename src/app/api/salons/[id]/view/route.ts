import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const salon = await prisma.salon.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => null);
  if (!salon) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ viewCount: salon.viewCount });
}
