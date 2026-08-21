import Link from "next/link";
import Image from "next/image";
import { reviews } from "@/data/reviews";

export const metadata = {
  title: "Reviews — Car Logo & Brand Reviews",
  description: "In-depth reviews of car logos and brand identities.",
};

export default function ReviewsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Reviews</h1>
        <p className="mt-2 text-muted-foreground">{reviews.length} in-depth reviews of car logos and brand identities.</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <Link
            key={r.slug}
            href={"/reviews/" + r.slug}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/30 hover:shadow-md"
          >
            {r.thumb ? (
              <div className="relative h-40 w-full bg-muted/40">
                <Image src={r.thumb} alt={r.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform group-hover:scale-105" />
              </div>
            ) : (
              <div className="h-40 w-full bg-muted/40" />
            )}
            <div className="p-4">
              <p className="line-clamp-2 font-semibold text-foreground">{r.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">{r.blockCount} sections · {r.imageCount} images</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
