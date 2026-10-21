import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImageBuffer, isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "quetta-salon-connect";

    // Allow logged-in staff/admin or registration photo upload
    const isRegistration = folder === "registration";
    if (!isRegistration && (!session || (session.role !== "admin" && session.role !== "owner"))) {
      return NextResponse.json({ error: "Unauthorized. Please log in as shop owner or admin." }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file was provided in the request." }, { status: 400 });
    }

    // Max 10MB file limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });
    }

    // Verify it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files (JPEG, PNG, WEBP, etc.) are supported." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadImageBuffer(buffer, file.name, folder);

    return NextResponse.json({
      success: true,
      url,
      provider: isCloudinaryConfigured ? "cloudinary" : "local",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image." },
      { status: 500 }
    );
  }
}
