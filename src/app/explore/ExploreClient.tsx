"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AREAS, CATEGORIES, PRICE_MAX, PRICE_MIN } from "@/lib/constants";
import { SalonCard, type SalonCardData } from "@/components/SalonCard";
import { FilterIcon, StarIcon } from "@/components/Icons";

type Props = { salons: SalonCardData[] };

export function ExploreClient({ salons }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const initialAreas = params.getAll("area").filter(Boolean);
  const [areas, setAreas] = useState<string[]>(initialAreas);
  const [type, setType] = useState(params.get("category") || "ALL");
  const [minPrice, setMinPrice] = useState(Number(params.get("minPrice") || PRICE_MIN));
  const [maxPrice, setMaxPrice] = useState(Number(params.get("maxPrice") || PRICE_MAX));
  const [rating4, setRating4] = useState(params.get("minRating") === "4");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const q = params.get("q") || "";

  const filtered = useMemo(() => {
    return salons.filter((s) => {
      if (type !== "ALL" && s.category !== type) return false;
      if (areas.length && !areas.includes(s.quettaArea)) return false;
      if (rating4 && s.rating < 4) return false;
      const prices = s.services.map((sv) => sv.pricePkr);
      const start = prices.length ? Math.min(...prices) : 0;
      if (start < minPrice || start > maxPrice) return false;
      if (q) {
        const hay = `${s.name} ${s.quettaArea} ${s.address} ${s.services
          .map((sv) => sv.name)
          .join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [salons, type, areas, rating4, minPrice, maxPrice, q]);

  function toggleArea(a: string) {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function selectAllAreas() {
    setAreas([...AREAS]);
  }

  function clearAllAreas() {
    setAreas([]);
  }

  function resetFilters() {
    setAreas([]);
    setType("ALL");
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setRating4(false);
    router.replace("/explore");
  }

  function apply() {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    areas.forEach((a) => sp.append("area", a));
    if (type !== "ALL") sp.set("category", type);
    if (minPrice !== PRICE_MIN) sp.set("minPrice", String(minPrice));
    if (maxPrice !== PRICE_MAX) sp.set("maxPrice", String(maxPrice));
    if (rating4) sp.set("minRating", "4");
    router.replace(`/explore?${sp.toString()}`);
    setMobileFilterOpen(false);
  }

  const activeFilterCount =
    (areas.length ? 1 : 0) +
    (type !== "ALL" ? 1 : 0) +
    (rating4 ? 1 : 0) +
    (minPrice > PRICE_MIN || maxPrice < PRICE_MAX ? 1 : 0);

  const filterContent = (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h2 className="font-display text-xl font-bold text-white">Search & Filter</h2>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-gold hover:underline cursor-pointer"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Quetta Area Filter */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white/70">
            Quetta Neighborhood ({areas.length || "All"})
          </label>
          <div className="flex gap-2 text-[11px] text-white/50">
            <button type="button" onClick={selectAllAreas} className="hover:text-gold underline cursor-pointer">
              All
            </button>
            <span>·</span>
            <button type="button" onClick={clearAllAreas} className="hover:text-gold underline cursor-pointer">
              None
            </button>
          </div>
        </div>

        <div className="mt-2.5 max-h-56 space-y-1 overflow-y-auto pr-1 text-sm no-scrollbar">
          {AREAS.map((a) => {
            const isChecked = areas.includes(a);
            return (
              <label
                key={a}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                  isChecked ? "bg-white/15 text-white font-semibold" : "hover:bg-white/5 text-white/70"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleArea(a)}
                    className="rounded text-white focus:ring-white bg-white/10 border-white/20"
                  />
                  <span>{a}</span>
                </span>
                {isChecked && <span className="text-[10px] text-gold font-bold">✓</span>}
              </label>
            );
          })}
        </div>
      </div>

      {/* Salon Type Filter */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-white/70">
          Salon Category
        </label>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((c) => {
            const active = type === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setType(c.id)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold text-center transition-all cursor-pointer ${
                  active
                    ? "bg-white text-black shadow-md"
                    : "bg-[#1C1C24] border border-white/10 hover:bg-white/10 text-white/70"
                }`}
              >
                {c.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex justify-between text-xs">
          <label className="font-bold uppercase tracking-wider text-white/70">
            Starting Price
          </label>
          <span className="font-semibold text-gold">
            Rs. {minPrice.toLocaleString()} – {maxPrice.toLocaleString()} PKR
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between text-[11px] text-white/50 mb-1">
              <span>Min: Rs. {minPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={200}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 200))}
              className="w-full accent-white"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-white/50 mb-1">
              <span>Max: Rs. {maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 200))}
              className="w-full accent-white"
            />
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#1C1C24] p-3 text-xs font-medium text-white">
          <input
            type="checkbox"
            checked={rating4}
            onChange={(e) => setRating4(e.target.checked)}
            className="rounded text-gold focus:ring-gold bg-white/10 border-white/20"
          />
          <span className="flex items-center gap-1.5">
            <StarIcon className="h-3.5 w-3.5 text-gold fill-gold" />
            <span>Top Rated (4.0★ and above)</span>
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={apply}
        className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-black shadow-lg hover:bg-white/90 transition-all cursor-pointer"
      >
        Apply Filters
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Mobile Sticky Filter Trigger */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#16161D] p-3.5 lg:hidden shadow-lg">
        <div>
          <p className="text-xs font-bold text-white">
            {filtered.length} Quetta Salons Available
          </p>
          {q && <p className="text-[11px] text-white/50 truncate">Query: &quot;{q}&quot;</p>}
        </div>
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-black shadow-md cursor-pointer"
        >
          <FilterIcon className="h-4 w-4" />
          <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-md lg:hidden animate-in fade-in">
          <div className="ml-auto flex h-full w-[85%] max-w-sm flex-col bg-[#16161D] border-l border-white/10 p-5 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
              <h3 className="font-display text-xl font-bold text-white">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 text-white grid place-items-center text-sm font-bold hover:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        <aside className="hidden h-fit rounded-3xl border border-white/10 bg-[#16161D] p-5 shadow-xl lg:block lg:sticky lg:top-24">
          {filterContent}
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Verified Salons in Quetta
              </h1>
              <p className="text-xs text-white/60">
                Showing {filtered.length} of {salons.length} registered salons
                {q ? ` for "${q}"` : ""}
              </p>
            </div>

            {/* Active filters pill display */}
            <div className="flex flex-wrap gap-1.5">
              {areas.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold text-white"
                >
                  {a}
                  <button onClick={() => toggleArea(a)} className="hover:text-gold cursor-pointer">
                    ×
                  </button>
                </span>
              ))}
              {type !== "ALL" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold text-white">
                  {type}
                  <button onClick={() => setType("ALL")} className="hover:text-gold cursor-pointer">
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((s) => (
              <SalonCard key={s.slug} salon={s} />
            ))}
          </div>

          {!filtered.length && (
            <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-[#16161D] p-10 text-center text-white">
              <p className="font-display text-2xl text-white">No salons found</p>
              <p className="mt-2 text-sm text-white/60">
                No salons in Quetta match the selected areas or price filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-white/90 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
