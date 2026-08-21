import Image from "next/image";
import Link from "next/link";
import type { CarBrand } from "@/types/car-brand";

export function BrandCard({ brand }: { brand: CarBrand }) {
  return (
    <Link
      href={`/car-brands/${brand.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/30 hover:shadow-md"
    >
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-muted/40 p-4">
        <Image
          src={brand.logo}
          alt={`${brand.name} logo`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-contain p-4 transition-transform group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="font-semibold text-foreground">{brand.name}</p>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {brand.category && (
            <span className="rounded-full bg-muted px-2 py-0.5">{brand.category}</span>
          )}
          {brand.years && <span>{brand.years}</span>}
        </div>
      </div>
    </Link>
  );
}
