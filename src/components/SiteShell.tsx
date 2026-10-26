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
      <main className="mx-auto min-h-[70vh] w-full max-w-6xl lg:max-w-7xl xl:max-w-[1536px] 2xl:max-w-[1780px] px-4 sm:px-6 lg:px-8 xl:px-12 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-4 md:pb-12">{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}
