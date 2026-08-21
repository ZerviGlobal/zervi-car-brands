import Link from "next/link";

export const metadata = {
  title: "Tire Brands",
  description: "Browse the world's tire brand logos and histories.",
};

export default function tire_brandsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Tire Brands
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        Browse the world's tire brand logos and histories.
      </p>
      <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-left">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Coming soon.</strong> This section
          will be populated with content from carlogos.org. The car brand
          encyclopedia is fully built — start there.
        </p>
      </div>
      <div className="mt-8">
        <Link
          href="/car-brands/"
          className="inline-flex rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Browse car brands →
        </Link>
      </div>
    </div>
  );
}
