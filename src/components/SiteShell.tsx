import { Suspense } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
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
      <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 pb-28 pt-4 md:pb-12">{children}</main>
      <footer className="hidden border-t border-white/10 bg-[#0C0C0E] px-4 py-10 text-white md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-6">
          <div>
            <p className="font-display text-2xl font-bold text-white">Quetta Salon Connect</p>
            <p className="mt-1 text-sm text-gold">سلونز آف کوئٹہ · Serving Quetta, Balochistan</p>
          </div>
          <div className="text-sm text-white/60 space-y-1">
            <p>Book via WhatsApp · No advance fees · Real PKR pricing</p>
            <p>
              Shop owners: <a href="/owner/register" className="text-white underline hover:text-gold">register</a> · Super Admin: <a href="/admin/login" className="text-white underline hover:text-gold">login</a>
            </p>
          </div>
        </div>
      </footer>
      <BottomNav />
    </>
  );
}
