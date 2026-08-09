"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";

export default function CategoryGrid({ categories }) {
  const { field } = useLang();
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/products?category=${c.slug}`}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:shadow-md transition-shadow text-center"
          style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
        >
          <span className="text-2xl">{c.icon}</span>
          <span className="text-xs font-medium" style={{ color: "var(--color-ink)" }}>
            {field(c, "name")}
          </span>
        </Link>
      ))}
    </div>
  );
}
