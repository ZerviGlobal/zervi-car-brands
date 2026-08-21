import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { carBrands, carBrandBySlug } from "@/data/car-brands";
import { BrandCard } from "@/components/brand-card";

export interface BrandContentBlock {
  tag: string;
  text: string;
}

export interface BrandContentImage {
  src: string;
  localPath: string | null;
  alt: string;
}

export interface BrandContent {
  slug: string;
  name: string;
  h1: string;
  contentBlocks: BrandContentBlock[];
  images: BrandContentImage[];
  facts: Record<string, string>;
}

// Read a brand's extracted content file (available at build time in the repo)
function loadBrandContent(slug: string): BrandContent | null {
  const p = join(
    process.cwd(),
    "docs/research/car-brand-content",
    slug + ".json"
  );
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as BrandContent;
  } catch {
    return null;
  }
}

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

  const content = loadBrandContent(slug);
  const related = carBrands
    .filter((b) => b.category === brand.category && b.slug !== brand.slug)
    .slice(0, 6);

  const facts: { label: string; value: string }[] = [];
  if (brand.founded) facts.push({ label: "Founded", value: brand.founded });
  if (brand.founders) facts.push({ label: "Founders", value: brand.founders });
  if (brand.headquarters) facts.push({ label: "Headquarters", value: brand.headquarters });
  if (brand.keyModels) facts.push({ label: "Key Models", value: brand.keyModels });
  if (brand.officialSite) facts.push({ label: "Official Site", value: brand.officialSite });
  if (brand.years) facts.push({ label: "Years", value: brand.years });
  if (brand.category) facts.push({ label: "Category", value: brand.category });
  // Facts extracted from the page (may be richer)
  if (content?.facts) {
    for (const [k, v] of Object.entries(content.facts)) {
      if (k && v && !facts.some((f) => f.label === k)) {
        facts.push({ label: k, value: v });
      }
    }
  }

  // Render content blocks as a timeline:
  // - H2 -> section heading
  // - H3 -> year heading (timeline marker), followed by the images for that year
  // - P  -> paragraph
  // Images are in document order; we consume them after year headings.
  const blocks = content?.contentBlocks ?? [];
  const imgs = content?.images ?? [];
  let imgIdx = 0;

  const renderBlocks = () =>
    blocks.map((b, i) => {
      const tag = b.tag;
      if (tag === "h2") {
        return (
          <h2 key={i} className="mt-10 mb-3 text-2xl font-bold tracking-tight text-foreground">
            {b.text}
          </h2>
        );
      }
      if (tag === "h3") {
        // consume following images for this year
        const yearImgs = [];
        while (imgIdx < imgs.length) {
          const im = imgs[imgIdx];
          // stop if we've hit a new heading region — we can't know precisely,
          // but the extraction captures imgs in document order after each h3,
          // so consume the next 1-2 images (year + description images)
          if (yearImgs.length >= 2) break;
          yearImgs.push(im);
          imgIdx++;
        }
        return (
          <div key={i} className="mt-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
              {b.text}
            </h3>
            {yearImgs.map((im, j) =>
              im.localPath ? (
                <div key={j} className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="relative h-40 sm:h-52">
                    <Image
                      src={im.localPath}
                      alt={im.alt || b.text}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-contain"
                    />
                  </div>
                </div>
              ) : null
            )}
          </div>
        );
      }
      if (tag === "p") {
        return (
          <p key={i} className="mt-3 text-base leading-relaxed text-foreground/90">
            {b.text}
          </p>
        );
      }
      return null;
    });

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

      {/* Full history / logo timeline */}
      {blocks.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {brand.name} Logo History
          </h2>
          <div className="mt-2">{renderBlocks()}</div>
        </section>
      )}

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
