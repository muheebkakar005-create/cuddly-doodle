import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth";
import { PRICE_MAX, PRICE_MIN } from "@/lib/constants";
import { sortByRank } from "@/lib/rank";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category") || "ALL";
    const areas = searchParams.getAll("area");
    const minPrice = Number(searchParams.get("minPrice") || PRICE_MIN);
    const maxPrice = Number(searchParams.get("maxPrice") || PRICE_MAX);
    const minRating = Number(searchParams.get("minRating") || 0);
    const session = await getSession();

    const salons = await withRetry(() =>
      prisma.salon.findMany({
        where: isAdmin(session) ? undefined : { approvalStatus: "APPROVED" },
        include: { services: true, owner: true },
        orderBy: { createdAt: "desc" },
      })
    );

    // If Super Admin is requesting without specific filters, return all salons directly
    if (isAdmin(session) && !q && category === "ALL" && !areas.length && minRating === 0) {
      return NextResponse.json({ salons });
    }

    const filtered = sortByRank(
      salons.filter((s) => {
        if (category !== "ALL" && s.category !== category) return false;
        if (areas.length && !areas.includes(s.quettaArea)) return false;
        if (s.rating < minRating) return false;
        const prices = s.services.map((sv) => sv.pricePkr);
        if (prices.length > 0) {
          const start = Math.min(...prices);
          if (start < minPrice || start > maxPrice) return false;
        }
        if (q) {
          const hay = `${s.name} ${s.quettaArea} ${s.address} ${s.services.map((sv) => sv.name).join(" ")}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    );

    return NextResponse.json({ salons: filtered });
  } catch (error) {
    console.error("API /api/salons error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve salons", salons: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  let slug = slugify(body.slug || name);
  const exists = await prisma.salon.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;

  const salon = await prisma.salon.create({
    data: {
      name,
      slug,
      category: body.category || "GENTS",
      quettaArea: body.quettaArea,
      address: body.address,
      phone: body.phone,
      whatsappNumber: body.whatsappNumber,
      openTime: body.openTime || "11:00",
      closeTime: body.closeTime || "22:00",
      breakStart: body.breakStart || "",
      breakEnd: body.breakEnd || "",
      workingDaysJson: JSON.stringify(body.workingDays || [0, 1, 2, 3, 4, 5, 6]),
      imageUrl: body.imageUrl || "",
      galleryJson: JSON.stringify(body.gallery || [body.imageUrl].filter(Boolean)),
      mapsUrl: body.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(body.address || "Quetta")}`,
      rating: Number(body.rating || 0),
      featured: Boolean(body.featured),
      approvalStatus: "APPROVED",
    },
  });
  return NextResponse.json({ salon }, { status: 201 });
}
