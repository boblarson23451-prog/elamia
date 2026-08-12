"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/context/LangContext";
import ProductForm from "@/components/ProductForm";
import VariantEditor from "@/components/VariantEditor";

const API = "/api/admin/products";

export default function EditProductPage() {
  const { t } = useLang();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | error | denied

  const load = useCallback(() => {
    setState("loading");
    // Fetch just this product. The previous version pulled the whole product
    // list and searched it client-side; if that request failed (expired
    // session, network blip) the page sat on a blank "..." forever, which
    // looked like the form and image uploader had disappeared.
    fetch(`${API}/${id}`)
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) { setState("denied"); return; }
        if (!r.ok) { setState("error"); return; }
        const d = await r.json();
        if (!d.product) { setState("error"); return; }
        setProduct(d.product);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (state === "loading") {
    return <div className="py-16 text-center text-sm" style={{ color: "var(--color-ink-soft)" }}>…</div>;
  }

  if (state === "denied") {
    return (
      <div className="py-16 text-center">
        <p className="mb-4" style={{ color: "var(--color-ink)" }}>{t("sessionExpired")}</p>
        <Link href="/login" className="inline-block rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          {t("login")}
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="py-16 text-center">
        <p className="mb-4" style={{ color: "var(--color-accent)" }}>{t("loadFailed")}</p>
        <button onClick={load} className="rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("edit")}</h1>
      <ProductForm productId={id} initial={product} apiBase={API} redirectPath="/admin/products" />
      <div className="mt-8">
        <VariantEditor productId={id} apiBase={API} />
      </div>
    </div>
  );
}
