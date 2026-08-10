"use client";

import { useLang } from "@/context/LangContext";
import ProductForm from "@/components/ProductForm";

export default function VendorNewProductPage() {
  const { t } = useLang();
  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("addProduct")}</h1>
      <ProductForm apiBase="/api/vendor/products" redirectPath="/vendor/products" />
    </div>
  );
}
