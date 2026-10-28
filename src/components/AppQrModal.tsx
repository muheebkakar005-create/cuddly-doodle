"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

interface AppQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppQrModal({ isOpen, onClose }: AppQrModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const currentUrl = "https://qsalons.vercel.app/install";

  function handleCopy() {
    navigator.clipboard?.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
      style={{ isolation: "isolate" }}
    >
      <div className="relative my-auto w-full max-w-sm rounded-3xl border border-white/20 bg-[#16161D] p-5 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black font-bold text-lg shadow-md">
              📷
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Scan App QR Code</h3>
              <p className="text-[10px] text-gold font-medium">Direct mobile install</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
          <div className="relative h-48 w-48 sm:h-52 sm:w-52">
            <Image
              src="/qr-app-prod.png"
              alt="Q_Salons App QR Code"
              fill
              className="rounded-lg object-contain"
              priority
            />
          </div>
          <p className="mt-2 text-[11px] font-bold text-black text-center break-all select-all">
            {currentUrl}
          </p>
        </div>

        {/* Instructions */}
        <p className="text-center text-xs text-white/70 leading-relaxed">
          Point your phone&apos;s camera at the QR code to directly open and install the app on your mobile screen!
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 rounded-2xl border border-white/15 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
