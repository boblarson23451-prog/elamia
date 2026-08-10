"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLang } from "@/context/LangContext";
import ProductForm from "@/components/ProductForm";

export default function EditProductPage() {
  const { t } = useLang();
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch("/api/admin/products")
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
      <ProductForm productId={id} initial={product} />
    </div>
  );
}
