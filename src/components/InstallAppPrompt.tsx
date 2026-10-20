"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
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

    // 2. Check if already installed in standalone mode
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    // 3. Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Check if user previously dismissed today
      const dismissed = localStorage.getItem("qsc_pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 4. Listen for appinstalled
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    // 5. Listen for manual trigger button clicks
    const handleManualTrigger = () => {
      setShowBanner(true);
      if (deferredPrompt) {
        deferredPrompt.prompt();
      }
    };
    window.addEventListener("trigger-pwa-install", handleManualTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("trigger-pwa-install", handleManualTrigger);
    };
  }, [deferredPrompt]);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    setShowBanner(false);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem("qsc_pwa_dismissed", Date.now().toString());
  }

  if (isInstalled || !showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed top-14 inset-x-0 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top-2 pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-[#E5C378]/30 bg-[#16161D]/95 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black font-bold text-xs shadow-md">
            ✂️
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white leading-tight truncate">
              Install Q-Salons App
            </p>
            <p className="text-[10px] text-[#E5C378] font-medium leading-tight truncate">
              Fast, offline booking on your home screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-black shadow-md hover:bg-white/90 transition-all cursor-pointer"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="h-7 w-7 rounded-lg text-white/50 hover:bg-white/10 hover:text-white text-xs flex items-center justify-center transition-all cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
