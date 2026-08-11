"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLang } from "@/context/LangContext";
import ProductForm from "@/components/ProductForm";
import VariantEditor from "@/components/VariantEditor";

export default function VendorEditProductPage() {
  const { t } = useLang();
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch("/api/vendor/products")
      .then((r) => r.json())
      .then((d) => {
        const p = (d.products || []).find((x) => String(x.id) === String(id));
        setProduct(p || null);
      });
  }, [id]);

  if (!product) return <div>...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("edit")}</h1>
      <ProductForm productId={id} initial={product} apiBase="/api/vendor/products" redirectPath="/vendor/products" />
      <div className="mt-8">
        <VariantEditor productId={id} apiBase="/api/vendor/products" />
      </div>
    </div>
  );
}
