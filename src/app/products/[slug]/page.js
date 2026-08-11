import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Section from "@/components/Section";
import ProductGrid from "@/components/ProductGrid";
import ProductDetailClient from "@/components/ProductDetailClient";
import { getVariants } from "@/lib/variants";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const product = db
    .prepare(
      `SELECT p.*, c.slug as category_slug, c.name_ar as category_name_ar, c.name_fr as category_name_fr,
              v.store_name as vendor_store_name, v.store_slug as vendor_store_slug
       FROM products p JOIN categories c ON c.id = p.category_id
       LEFT JOIN vendors v ON v.id = p.vendor_id
       WHERE p.slug = ? AND p.is_active = 1`
    )
    .get(slug);

  if (!product) notFound();

  const related = db
    .prepare(`SELECT * FROM products WHERE category_id = ? AND id != ? AND is_active = 1 LIMIT 5`)
    .all(product.category_id, product.id);

  const variants = getVariants(product.id);

  return (
    <div>
      <ProductDetailClient product={product} variants={variants} />
      {related.length > 0 && (
        <Section titleKey="relatedProducts">
          <ProductGrid products={related} />
        </Section>
      )}
    </div>
  );
}
