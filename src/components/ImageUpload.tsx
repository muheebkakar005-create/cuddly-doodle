"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Photo",
  hint = "Upload directly from camera or device (JPEG, PNG, WEBP)",
  folder = "salons",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowManualUrl((prev) => !prev)}
            className="text-[10px] font-medium text-white/50 hover:text-gold transition-colors cursor-pointer"
          >
            {showManualUrl ? "← Direct Upload" : "Paste link instead"}
          </button>
        </div>
      )}

      {showManualUrl ? (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="h-10 w-full rounded-xl border border-white/10 bg-[#1C1C24] px-3 text-xs text-white placeholder:text-white/40 outline-none focus:border-white focus:ring-1 focus:ring-white"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {value ? (
            <div className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-[#1C1C24] p-2.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                <Image
                  src={value}
                  alt="Upload preview"
                  fill
                  className="object-cover"
                  unoptimized={value.startsWith("/uploads/") || value.startsWith("data:")}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">Image uploaded</p>
                <p className="truncate text-[10px] text-white/50">{value}</p>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <span className="text-white/20">·</span>
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#1C1C24]/60 p-4 text-center transition-all cursor-pointer hover:border-gold/60 hover:bg-[#1C1C24] ${
                uploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white text-base mb-1.5 shadow-sm">
                📷
              </div>
              <p className="text-xs font-bold text-white">
                {uploading ? "Uploading Image…" : "Tap to Select & Upload Photo"}
              </p>
              <p className="mt-0.5 text-[10px] text-white/50">{hint}</p>
            </div>
          )}

          {error && (
            <p className="text-[10px] font-semibold text-rose-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
