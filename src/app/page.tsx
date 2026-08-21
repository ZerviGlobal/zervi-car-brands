import Link from "next/link";
import Image from "next/image";
import { carBrands, carBrandsByCategory } from "@/data/car-brands";
import { BrandCard } from "@/components/brand-card";

export default function Home() {
  const featured = carBrands.slice(0, 12);
  const byCategory = carBrandsByCategory();
  const categories = Object.keys(byCategory).sort((a, b) => byCategory[b].length - byCategory[a].length);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Explore 300+ Car Logos &amp; Their Backstories
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A complete encyclopedia of car brand logos, histories, and metadata.
            Browse {carBrands.length} brands by category, era, and origin.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/car-brands/"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Browse all brands
            </Link>
            <Link
              href="/quizzes/"
              className="rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Take a quiz
            </Link>
          </div>
        </div>
      </section>

      {/* Featured brands */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Featured brands
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The most recognizable car logos and their stories.
            </p>
          </div>
          <Link href="/car-brands/" className="text-sm font-medium text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {featured.map((b) => (
            <BrandCard key={b.slug} brand={b} />
          ))}
        </div>
      </section>

      {/* Browse by category */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Browse by category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length} categories across {carBrands.length} brands.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 9).map((cat) => (
              <Link
                key={cat}
                href="/car-brands/"
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
              >
                <div>
                  <p className="font-semibold text-foreground">{cat}</p>
                  <p className="text-xs text-muted-foreground">
                    {byCategory[cat].length} brand{byCategory[cat].length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
