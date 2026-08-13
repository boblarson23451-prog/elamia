"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { LEGAL_DOCS, renderTemplate, hasIncompleteFields, COMPANY_FALLBACK } from "@/lib/legal-content";
import { useEffect, useState } from "react";

const ORDER = ["mentions-legales", "cgv", "retours", "confidentialite"];

export default function LegalPage() {
  const { slug } = useParams();
  const { lang } = useLang();
  const [company, setCompany] = useState(COMPANY_FALLBACK);

  useEffect(() => {
    fetch("/api/legal").then((r) => r.json()).then((d) => d.company && setCompany(d.company)).catch(() => {});
  }, []);

  const doc = LEGAL_DOCS[slug];

  if (!doc) return notFound();

  const title = lang === "ar" ? doc.title_ar : doc.title_fr;
  const incomplete = hasIncompleteFields(company);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="flex flex-wrap gap-2 mb-8 text-xs">
        {ORDER.map((s) => (
          <Link
            key={s}
            href={`/legal/${s}`}
            className="px-3 py-1.5 rounded-lg border"
            style={{
              background: s === slug ? "var(--color-brand)" : "var(--color-paper)",
              color: s === slug ? "#fff" : "var(--color-ink)",
              borderColor: "var(--color-line)",
            }}
          >
            {lang === "ar" ? LEGAL_DOCS[s].title_ar : LEGAL_DOCS[s].title_fr}
          </Link>
        ))}
      </nav>

      <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
        {title}
      </h1>
      <p className="text-xs mb-8" style={{ color: "var(--color-ink-soft)" }}>
        {lang === "ar" ? "آخر تحديث" : "Dernière mise à jour"} : {doc.updated}
      </p>

      {incomplete && (
        <div
          className="rounded-xl p-4 mb-8 text-sm"
          style={{ background: "#FEF3C7", border: "1px solid var(--color-gold)", color: "#7C4A03" }}
        >
          <strong>{lang === "ar" ? "وثيقة غير مكتملة" : "Document incomplet"}</strong>
          <p className="mt-1">
            {lang === "ar"
              ? "لم تُملأ بعد المعلومات القانونية الإجبارية (السجل التجاري، رقم التعريف الجبائي، العنوان...). يجب استكمالها ومراجعتها من طرف محامٍ قبل النشر."
              : "Les informations légales obligatoires (registre de commerce, NIF, adresse…) ne sont pas encore renseignées. Elles doivent être complétées et le texte revu par un avocat avant publication."}
          </p>
        </div>
      )}

      <article className="flex flex-col gap-7">
        {doc.sections.map((sec, i) => (
          <section key={i}>
            <h2 className="text-base font-bold mb-2" style={{ color: "var(--color-ink)" }}>
              {lang === "ar" ? sec.h_ar : sec.h_fr}
            </h2>
            <div
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: "var(--color-ink-soft)" }}
            >
              {renderTemplate(lang === "ar" ? sec.body_ar : sec.body_fr, company)}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}
