import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SalonForm } from "../SalonForm";

export const dynamic = "force-dynamic";

export default async function EditSalonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const salon = await prisma.salon.findUnique({
    where: { id },
    include: { services: true },
  });
  if (!salon) notFound();

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl">Edit {salon.name}</h1>
      <SalonForm
        initial={{
          id: salon.id,
          name: salon.name,
          category: salon.category,
          quettaArea: salon.quettaArea,
          address: salon.address,
          phone: salon.phone,
          whatsappNumber: salon.whatsappNumber,
          openTime: salon.openTime,
          closeTime: salon.closeTime,
          imageUrl: salon.imageUrl,
          mapsUrl: salon.mapsUrl,
          featured: salon.featured,
          services: salon.services,
        }}
      />
    </div>
  );
}
