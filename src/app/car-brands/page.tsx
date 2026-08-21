"use client";

import { useMemo, useState } from "react";
import {
  carBrands,
  carBrandCategories,
  carBrandLetters,
  CAR_BRAND_COUNT,
} from "@/data/car-brands";
import type { CarBrand } from "@/types/car-brand";
import { BrandCard } from "@/components/brand-card";

const ALL = "All";
const ALL_LETTERS = "All";

export default function CarBrandsPage() {
  const categories = useMemo(() => carBrandCategories(), []);
  const letters = useMemo(() => carBrandLetters(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [letter, setLetter] = useState(ALL_LETTERS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return carBrands.filter((b) => {
      if (category !== ALL && b.category !== category) return false;
      if (letter !== ALL_LETTERS) {
        if (letter === "0-9") {
          if (!/^\d/.test(b.name)) return false;
        } else if (b.name.charAt(0).toUpperCase() !== letter) return false;
      }
      if (q) {
        if (
          !b.name.toLowerCase().includes(q) &&
          !b.category.toLowerCase().includes(q) &&
          !b.metaDescription.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [query, category, letter]);

  const grouped = useMemo(() => {
    const map = new Map<string, CarBrand[]>();
    for (const b of filtered) {
      const first = /^\d/.test(b.name) ? "0-9" : b.name.charAt(0).toUpperCase();
      if (!map.has(first)) map.set(first, []);
      map.get(first)!.push(b);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const resetFilters = () => {
    setQuery("");
    setCategory(ALL);
    setLetter(ALL_LETTERS);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Car Brands A-Z ({CAR_BRAND_COUNT})
        </h1>
        <p className="mt-2 text-muted-foreground">
          {CAR_BRAND_COUNT} car brands across {categories.length} categories.
        </p>
      </header>

      <div className="mb-6">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brands, categories, descriptions…"
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

      <div className="mb-4 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setLetter(ALL_LETTERS)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            letter === ALL_LETTERS
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          }`}
        >
          All
        </button>
        {letters.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLetter(l)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              letter === l
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory(ALL)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            category === ALL
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          }`}
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === c
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          brand{filtered.length === 1 ? "" : "s"}
          {letter !== ALL_LETTERS && ` starting with "${letter}"`}
          {category !== ALL && ` in ${category}`}
          {query && ` matching "${query}"`}
        </p>
        {(query || category !== ALL || letter !== ALL_LETTERS) && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-accent hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">No brands match your filters.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 text-sm font-medium text-accent hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([ltr, brands]) => (
            <section key={ltr}>
              <h2 className="mb-4 text-2xl font-bold text-foreground">{ltr}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {brands.map((b) => (
                  <BrandCard key={b.slug} brand={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

