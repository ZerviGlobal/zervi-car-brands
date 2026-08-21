import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reviews } from "@/data/reviews";
import { BrandHistory } from "@/components/brand-history";
import { loadSectionContent } from "@/lib/section-content";

export function generateStaticParams() {
  return reviews.map((r) => ({ slug: r.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const r = reviews.find((a) => a.slug === p.slug);
    return { title: r ? r.title : "Review not found" };
  });
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = reviews.find((r) => r.slug === slug);
  if (!review) notFound();
  const content = loadSectionContent("review-content", slug);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/reviews/" className="hover:text-foreground">Reviews</Link>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{review.h1}</h1>

      {content && (
        <div className="mt-8">
          {content.images.map((im, j) =>
            im.localPath ? (
              <div key={j} className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
                <div className="relative h-64">
                  <Image src={im.localPath} alt={im.alt || review.title} fill sizes="(max-width: 768px) 100vw, 700px" className="object-contain" />
                </div>
              </div>
            ) : null
          )}
          <BrandHistory brandName="" contentBlocks={content.contentBlocks} images={[]} />
        </div>
      )}

      <div className="mt-10">
        <Link href="/reviews/" className="text-sm font-medium text-accent hover:underline">← All reviews</Link>
      </div>
    </article>
  );
}
