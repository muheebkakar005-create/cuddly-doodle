import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Initialize Cloudinary if credentials are present
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

export async function uploadImageBuffer(
  buffer: Buffer,
  filename: string,
  folder: string = "quetta-salon-connect"
): Promise<string> {
  // If Cloudinary is configured, upload directly to Cloudinary
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          format: "webp",
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
          } else {
            resolve(result.secure_url);
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Graceful local filesystem fallback: store in public/uploads/
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeExt = path.extname(filename) || ".jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
  const filePath = path.join(uploadsDir, uniqueName);

  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${uniqueName}`;
}
