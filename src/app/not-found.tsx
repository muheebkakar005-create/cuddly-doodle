import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center space-y-4">
      <h1 className="font-display text-4xl font-bold text-white">Page not found</h1>
      <p className="text-white/60">That salon or page is not on Quetta Salon Connect.</p>
      <Link
        href="/explore"
        className="mt-4 inline-block rounded-2xl bg-white px-6 py-2.5 text-sm font-bold text-black shadow-md hover:bg-white/90 transition-all"
      >
        Explore Quetta Salons
      </Link>
    </div>
  );
}
