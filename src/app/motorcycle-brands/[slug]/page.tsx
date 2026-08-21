import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motorcycleBrands } from "@/data/motorcycle-brands";
import { BrandHistory } from "@/components/brand-history";
import { loadSectionContent } from "@/lib/section-content";

export function generateStaticParams() {
  return motorcycleBrands.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const brand = motorcycleBrands.find((b) => b.slug === p.slug);
    if (!brand) return { title: "Brand not found" };
    return { title: `${brand.name} Logo — History`, description: brand.metaDescription };
  });
}

export default async function MotorcycleBrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = motorcycleBrands.find((b) => b.slug === slug);
  if (!brand) notFound();

  const content = loadSectionContent("motorcycle-brand-content", slug);
  const facts: { label: string; value: string }[] = [];
  if (brand.founded) facts.push({ label: "Founded", value: brand.founded });
  if (brand.headquarters) facts.push({ label: "Headquarters", value: brand.headquarters });
  if (content?.facts) {
    for (const [k, v] of Object.entries(content.facts)) {
      if (k && v && !facts.some((f) => f.label === k)) facts.push({ label: k, value: v });
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/motorcycle-brands/" className="hover:text-foreground">Motorcycle Brands</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{brand.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="relative aspect-square">
            <Image src={brand.logo} alt={`${brand.name} logo`} fill sizes="280px" className="object-contain" priority />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{brand.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Motorcycle Brands</span>
          </div>
          {brand.description && (
            <p className="mt-5 text-base leading-relaxed text-foreground/90">{brand.description}</p>
          )}
          {facts.length > 0 && (
            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="rounded-lg border border-border bg-muted/30 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {content && (
        <BrandHistory brandName={brand.name} contentBlocks={content.contentBlocks} images={content.images} />
      )}
    </div>
  );
}
