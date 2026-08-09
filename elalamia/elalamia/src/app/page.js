import { db } from "@/lib/db";
import Hero from "@/components/Hero";
import Section from "@/components/Section";
import ProductGrid from "@/components/ProductGrid";
import CategoryGrid from "@/components/CategoryGrid";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const categories = db.prepare("SELECT * FROM categories ORDER BY sort_order ASC").all();

  const deals = db
    .prepare(
      `SELECT * FROM products WHERE is_active = 1 AND compare_at_price IS NOT NULL AND compare_at_price > price
       ORDER BY (CAST(compare_at_price AS FLOAT) - price) / compare_at_price DESC LIMIT 10`
    )
    .all();

  const newArrivals = db
    .prepare("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10")
    .all();

  const bestSelling = db
    .prepare("SELECT * FROM products WHERE is_active = 1 ORDER BY sold_count DESC LIMIT 10")
    .all();

  return (
    <div>
      <Hero />

      <Section titleKey="categoriesTitle">
        <CategoryGrid categories={categories} />
      </Section>

      <Section titleKey="dealsTitle">
        <ProductGrid products={deals} />
      </Section>

      <Section titleKey="bestSelling">
        <ProductGrid products={bestSelling} />
      </Section>

      <Section titleKey="newArrivals">
        <ProductGrid products={newArrivals} />
      </Section>
    </div>
  );
}
