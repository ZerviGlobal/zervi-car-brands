"use client";

import { useMemo, useState } from "react";
import { tireBrands } from "@/data/tire-brands";
import { BrandCard } from "@/components/brand-card";

export default function TireBrandsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tireBrands;
    return tireBrands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.metaDescription.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof tireBrands>();
    for (const b of filtered) {
      const first = /^\d/.test(b.name) ? "0-9" : b.name.charAt(0).toUpperCase();
      if (!map.has(first)) map.set(first, []);
      map.get(first)!.push(b);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Tire Brands
        </h1>
        <p className="mt-2 text-muted-foreground">
          {tireBrands.length} tire brands with logos and histories.
        </p>
      </header>

      <div className="mb-6">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tire brands…"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 pl-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> tire brands
      </p>

      <div className="space-y-10">
        {grouped.map(([letter, brands]) => (
          <section key={letter}>
            <h2 className="mb-4 text-2xl font-bold text-foreground">{letter}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {brands.map((b) => (
                <BrandCard key={b.slug} brand={b} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
