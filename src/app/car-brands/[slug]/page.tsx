import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { carBrands, carBrandBySlug } from "@/data/car-brands";
import { BrandCard } from "@/components/brand-card";

export function generateStaticParams() {
  return carBrands.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const brand = carBrandBySlug(p.slug);
    if (!brand) return { title: "Brand not found" };
    return {
      title: `${brand.name} Logo — History & Meaning`,
      description: brand.metaDescription || `${brand.name} car logo, history, and brand story.`,
    };
  });
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = carBrandBySlug(slug);
  if (!brand) notFound();

  const related = carBrands
    .filter((b) => b.category === brand.category && b.slug !== brand.slug)
    .slice(0, 6);

  const facts: { label: string; value: string }[] = [
    brand.founded && { label: "Founded", value: brand.founded },
    brand.founders && { label: "Founders", value: brand.founders },
    brand.headquarters && { label: "Headquarters", value: brand.headquarters },
    brand.keyModels && { label: "Key Models", value: brand.keyModels },
    brand.officialSite && { label: "Official Site", value: brand.officialSite },
    brand.years && { label: "Years", value: brand.years },
    brand.category && { label: "Category", value: brand.category },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/car-brands/" className="hover:text-foreground">Car Brands</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{brand.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Logo */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="relative aspect-square">
            <Image
              src={brand.logo}
              alt={`${brand.name} logo`}
              fill
              sizes="280px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {brand.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {brand.category && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                {brand.category}
              </span>
            )}
            {brand.years && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {brand.years}
              </span>
            )}
          </div>

          {brand.description ? (
            <p className="mt-5 text-base leading-relaxed text-foreground/90">
              {brand.description}
            </p>
          ) : brand.metaDescription ? (
            <p className="mt-5 text-base leading-relaxed text-foreground/90">
              {brand.metaDescription}
            </p>
          ) : null}

          {facts.length > 0 && (
            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="rounded-lg border border-border bg-muted/30 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="mt-0.5 text-sm text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {brand.officialSite && (
            <a
              href={`https://${brand.officialSite.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Visit official site ↗
            </a>
          )}
        </div>
      </div>

      {/* Related brands */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Other {brand.category} brands
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {related.map((b) => (
              <BrandCard key={b.slug} brand={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
