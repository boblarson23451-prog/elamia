"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/LangContext";

const TEMPLATE = `name_fr,name_ar,price,compare_at_price,category,weight_grams,stock,image_urls,supplier_ref,description_fr,description_ar
Robe été fleurie,فستان صيفي مزهر,2900,4900,mode-femme,400,25,https://exemple.com/1.jpg|https://exemple.com/2.jpg,1047929587876,Tissu léger et fluide,قماش خفيف وانسيابي`;

export default function ImportProductsPage() {
  const { t } = useLang();
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [multiplier, setMultiplier] = useState("1");

  const send = async (dryRun) => {
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        csv: csv.replace(/\|/g, "\n"),
        dryRun,
        priceMultiplier: parseFloat(multiplier) || 1,
      }),
    });
    const data = await res.json();
    setResult({ ...data, dryRun, httpOk: res.ok });
    setBusy(false);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
  };

  const box = { borderColor: "var(--color-line)", background: "var(--color-paper)" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-ink)" }}>Import CSV</h1>
        <Link href="/admin/products" className="text-sm font-semibold" style={{ color: "var(--color-brand)" }}>
          ← {t("manageProducts")}
        </Link>
      </div>

      <div className="rounded-xl border p-4 mb-4 text-sm" style={box}>
        <p className="font-semibold mb-1">Colonnes</p>
        <p style={{ color: "var(--color-ink-soft)" }}>
          Obligatoires : <code>name_fr</code>, <code>price</code>. Optionnelles : <code>name_ar</code>,{" "}
          <code>compare_at_price</code>, <code>category</code>, <code>weight_grams</code>, <code>stock</code>,{" "}
          <code>image_urls</code>, <code>supplier_ref</code>, <code>description_fr</code>, <code>description_ar</code>.
        </p>
        <p className="mt-2" style={{ color: "var(--color-ink-soft)" }}>
          Plusieurs images : séparez les URLs par <code>|</code>. Le poids sert au calcul des frais de livraison —
          renseignez-le, sinon 500 g est appliqué par défaut.
        </p>
        <button
          onClick={() => setCsv(TEMPLATE)}
          className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border"
          style={{ borderColor: "var(--color-brand)", color: "var(--color-brand)" }}
        >
          Charger un exemple
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label className="text-sm font-medium block mb-1">Fichier CSV</label>
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Multiplicateur de prix</label>
          <input
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="rounded-lg px-3 py-2 border text-sm w-32"
            style={box}
            placeholder="1"
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>
            ex. 26 pour convertir des prix en CNY vers DA
          </p>
        </div>
      </div>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={12}
        placeholder="Collez votre CSV ici…"
        className="w-full rounded-lg px-3 py-2.5 border text-xs font-mono"
        style={box}
      />

      <div className="flex gap-3 mt-3">
        <button
          onClick={() => send(true)}
          disabled={busy || !csv.trim()}
          className="rounded-lg px-5 py-2.5 font-semibold text-sm border disabled:opacity-50"
          style={{ borderColor: "var(--color-brand)", color: "var(--color-brand)" }}
        >
          {busy ? "..." : "Vérifier (sans importer)"}
        </button>
        <button
          onClick={() => send(false)}
          disabled={busy || !csv.trim()}
          className="rounded-lg px-5 py-2.5 font-semibold text-sm text-white disabled:opacity-50"
          style={{ background: "var(--color-accent)" }}
        >
          {busy ? "..." : "Importer"}
        </button>
      </div>

      {result && (
        <div className="rounded-xl border p-4 mt-4 text-sm" style={box}>
          {!result.httpOk ? (
            <p style={{ color: "var(--color-accent)" }}>
              Erreur : {result.error}
              {result.missing && ` — colonnes manquantes : ${result.missing.join(", ")}`}
            </p>
          ) : (
            <>
              <p className="font-semibold mb-2">
                {result.dryRun
                  ? `${result.parsedCount} produit(s) prêts à importer`
                  : `✓ ${result.created} produit(s) importés`}
              </p>
              {result.errors?.length > 0 && (
                <div className="mb-2">
                  <p style={{ color: "var(--color-accent)" }}>{result.errors.length} ligne(s) ignorée(s) :</p>
                  <ul className="text-xs list-disc ps-5" style={{ color: "var(--color-ink-soft)" }}>
                    {result.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>Ligne {e.line} — {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.dryRun && result.preview?.length > 0 && (
                <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                  <p className="font-semibold mb-1">Aperçu :</p>
                  {result.preview.map((p, i) => (
                    <div key={i}>• {p.name_fr} — {p.price} DA — {p.weight_grams} g</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
