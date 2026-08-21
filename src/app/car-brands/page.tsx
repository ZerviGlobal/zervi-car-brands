import { carBrands, carBrandsByCategory, carBrandCategories } from "@/data/car-brands";
import { BrandCard } from "@/components/brand-card";

export const metadata = {
  title: "Car Brands — All Car Logos & Brand Stories",
  description: "Browse the complete list of car brand logos, categories, and histories.",
};

export default function CarBrandsPage() {
  const byCategory = carBrandsByCategory();
  const categories = Object.keys(byCategory).sort((a, b) => byCategory[b].length - byCategory[a].length);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Car Brands
        </h1>
        <p className="mt-2 text-muted-foreground">
          {carBrands.length} car brands across {categories.length} categories.
        </p>
      </header>

      {categories.map((cat) => (
        <section key={cat} className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            {cat}
            <span className="text-sm font-normal text-muted-foreground">
              ({byCategory[cat].length})
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {byCategory[cat].map((b) => (
              <BrandCard key={b.slug} brand={b} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
