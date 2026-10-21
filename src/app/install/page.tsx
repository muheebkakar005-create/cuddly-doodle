"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const isApple = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
      setIsIOS(isApple);

      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setInstalledSuccessfully(true);
        setIsStandalone(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  async function handleInstall() {
    if (isIOS) {
      // Scroll to or highlight iOS instructions
      const el = document.getElementById("ios-instructions");
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalledSuccessfully(true);
      }
      setDeferredPrompt(null);
    } else {
      // Trigger global event or show notification
      window.dispatchEvent(new Event("trigger-pwa-install"));
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8 text-center text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-gradient-to-b from-[#1C1C24] to-[#121217] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6">
        {/* App Icon */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[#0C0C0E] border-2 border-gold/40 shadow-[0_12px_30px_rgba(229,195,120,0.25)] overflow-hidden">
          <Image
            src="/icons/icon-192.png"
            alt="Q_Salons App"
            width={96}
            height={96}
            priority
            className="object-cover"
          />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Install Q_Salons App
          </h1>
          <p className="text-xs font-semibold text-gold">
            سلونز آف کوئٹہ • Quetta, Balochistan
          </p>
          <p className="text-xs text-white/60 pt-1">
            Book top barber shops, ladies parlours, and luxury spas right from your home screen.
          </p>
        </div>

        {/* Status / Main Action Button */}
        {isStandalone || installedSuccessfully ? (
          <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-4 space-y-2">
            <p className="text-xs font-bold text-emerald-400">
              ✓ App is installed on your device!
            </p>
            <Link
              href="/explore"
              className="inline-block w-full rounded-2xl bg-white py-3 text-xs font-bold text-black shadow-lg hover:bg-white/90 transition-all"
            >
              Open Salons Explorer →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleInstall}
              className="w-full rounded-2xl bg-gradient-to-r from-gold to-[#c99f3b] py-3.5 text-sm font-bold text-[#0C0C0E] shadow-[0_10px_25px_rgba(229,195,120,0.35)] hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              📲 Install App Now
            </button>

            <Link
              href="/"
              className="inline-block text-xs font-semibold text-white/50 hover:text-white transition-colors"
            >
              Continue in Browser instead
            </Link>
          </div>
        )}

        {/* iOS Step-by-Step Instructions */}
        {isIOS && !isStandalone && (
          <div id="ios-instructions" className="rounded-2xl bg-black/40 border border-white/10 p-4 text-left space-y-3">
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <span>🍎</span> iPhone / iPad Instructions:
            </p>
            <ol className="space-y-2.5 text-xs text-white/80">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                  1
                </span>
                <span>
                  Tap the <strong className="text-white">Share</strong> icon{" "}
                  <span className="inline-block px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">⎋</span>{" "}
                  at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>{" "}
                  <span className="inline-block px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">➕</span>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                  3
                </span>
                <span>
                  Tap <strong className="text-white">Add</strong> in the top right corner.
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 text-left">
          <div className="rounded-2xl border border-white/10 bg-[#16161D]/80 p-3">
            <span className="text-sm">⚡</span>
            <p className="mt-1 text-[11px] font-bold text-white">Instant Launch</p>
            <p className="text-[10px] text-white/50">Opens in fullscreen like a native app</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#16161D]/80 p-3">
            <span className="text-sm">📶</span>
            <p className="mt-1 text-[11px] font-bold text-white">Offline Ready</p>
            <p className="text-[10px] text-white/50">Browse saved appointments anytime</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#16161D]/80 p-3">
            <span className="text-sm">₨</span>
            <p className="mt-1 text-[11px] font-bold text-white">Verified PKR</p>
            <p className="text-[10px] text-white/50">Real salon prices across Quetta</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#16161D]/80 p-3">
            <span className="text-sm">💬</span>
            <p className="mt-1 text-[11px] font-bold text-white">WhatsApp Alert</p>
            <p className="text-[10px] text-white/50">Direct confirmation on your phone</p>
          </div>
        </div>
      </div>
    </div>
  );
}
