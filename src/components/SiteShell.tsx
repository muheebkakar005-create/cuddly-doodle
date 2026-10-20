import { Suspense } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { InstallAppPrompt } from "./InstallAppPrompt";
import { OfflineSyncNotifier } from "./OfflineSyncNotifier";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineSyncNotifier />
      <InstallAppPrompt />
      <Suspense fallback={<div className="h-16 bg-[#0C0C0E]" />}>
        <Header />
      </Suspense>
      <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 pb-20 pt-4 md:pb-12">{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
