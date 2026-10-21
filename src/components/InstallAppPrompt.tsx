"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((reg) => {
            console.log("PWA Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("PWA Service Worker registration failed:", err);
          });
      });
    }

    // 2. Detect iOS Safari
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
      setIsIOS(isAppleDevice);

      // Check if already in standalone (installed) mode
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    // 3. Listen for Android/Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show banner if not dismissed in this session or in last 3 days
      const dismissedTime = localStorage.getItem("qsc_pwa_dismissed");
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 3 * 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 4. Listen for appinstalled
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowIosModal(false);
      setDeferredPrompt(null);
    });

    // 5. Listen for manual trigger button clicks anywhere in the app
    const handleManualTrigger = () => {
      if (typeof window !== "undefined") {
        const ua = window.navigator.userAgent;
        const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
        if (isAppleDevice) {
          setShowIosModal(true);
          return;
        }
      }

      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        // Fallback for browsers where beforeinstallprompt didn't fire yet
        setShowBanner(true);
      }
    };

    window.addEventListener("trigger-pwa-install", handleManualTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("trigger-pwa-install", handleManualTrigger);
    };
  }, [deferredPrompt]);

  async function handleInstallClick() {
    if (isIOS) {
      setShowBanner(false);
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      setShowBanner(false);
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction
      alert("To install, tap your browser's menu (⋮ or Share) and select 'Add to Home Screen' or 'Install App'.");
      setShowBanner(false);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("qsc_pwa_dismissed", Date.now().toString());
  }

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. Mobile & Tablet floating install banner */}
      {showBanner && (
        <div className="fixed top-2 inset-x-0 z-50 flex justify-center px-3 pt-safe animate-in fade-in slide-in-from-top-2 pointer-events-none">
          <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[#16161D]/95 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0C0C0E] border border-white/10 shadow-md overflow-hidden">
                <Image
                  src="/icons/icon-192.png"
                  alt="Q_Salons App"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white leading-tight truncate">
                  Install Q_Salons App
                </p>
                <p className="text-[10px] text-white/70 font-medium leading-tight truncate">
                  Fast, offline booking on your mobile screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="rounded-xl bg-white px-3.5 py-1.5 text-[11px] font-bold text-black shadow-md hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="h-7 w-7 rounded-lg text-white/50 hover:bg-white/10 hover:text-white text-xs flex items-center justify-center transition-all cursor-pointer"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. iOS Safari Add to Home Screen Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#16161D] p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#0C0C0E] border border-white/10">
                  <Image
                    src="/icons/icon-192.png"
                    alt="Q_Salons"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
                  <p className="text-[10px] text-white/60">Quetta Salon Connect</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="h-7 w-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/80 leading-relaxed">
              Install the app directly on your mobile screen for full-screen mode, faster speeds, and instant booking:
            </p>

            <div className="space-y-3 rounded-2xl bg-black/40 border border-white/10 p-3.5 text-xs text-white/90">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[11px]">
                  1
                </span>
                <p className="pt-0.5">
                  Tap the <strong className="text-white">Share</strong> button{" "}
                  <span className="inline-block px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">⎋</span>{" "}
                  at the bottom bar of Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[11px]">
                  2
                </span>
                <p className="pt-0.5">
                  Scroll down the menu and tap <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>{" "}
                  <span className="inline-block px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono">➕</span>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-bold text-white text-[11px]">
                  3
                </span>
                <p className="pt-0.5">
                  Tap <strong className="text-white">Add</strong> at the top right to complete.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full rounded-2xl bg-white py-2.5 text-xs font-bold text-black hover:bg-white/90 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
