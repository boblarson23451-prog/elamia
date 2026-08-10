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
      `SELECT p.*, v.store_name as vendor_store_name, v.store_slug as vendor_store_slug
       FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE p.is_active = 1 AND p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price
       ORDER BY (CAST(p.compare_at_price AS FLOAT) - p.price) / p.compare_at_price DESC LIMIT 10`
    )
    .all();

  const newArrivals = db
    .prepare(
      `SELECT p.*, v.store_name as vendor_store_name, v.store_slug as vendor_store_slug
       FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE p.is_active = 1 ORDER BY p.created_at DESC LIMIT 10`
    )
    .all();

  const bestSelling = db
    .prepare(
      `SELECT p.*, v.store_name as vendor_store_name, v.store_slug as vendor_store_slug
       FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE p.is_active = 1 ORDER BY p.sold_count DESC LIMIT 10`
    )
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
