"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";

export default function CategoryNav() {
  const { field } = useLang();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  if (categories.length === 0) return null;

  return (
    <nav
      className="border-b overflow-x-auto"
      style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
    >
      <div className="max-w-6xl mx-auto px-4 flex gap-5 py-2.5 text-sm whitespace-nowrap">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-ink)" }}
          >
            <span>{c.icon}</span>
            <span>{field(c, "name")}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
