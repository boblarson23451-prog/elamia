"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { WILAYAS } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useLang();
  const { refreshUser, refreshCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", wilaya: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError(t("fillAllFields"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      await refreshUser();
      await refreshCart();
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error === "email_taken" ? t("emailTaken") : t("fillAllFields"));
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--color-ink)" }}>{t("register")}</h1>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          required
          placeholder={t("name")}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="rounded-lg px-3 py-2.5 border text-sm"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        />
        <input
          type="email"
          required
          placeholder={t("email")}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className="rounded-lg px-3 py-2.5 border text-sm"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        />
        <input
          type="password"
          required
          placeholder={t("password")}
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          className="rounded-lg px-3 py-2.5 border text-sm"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        />
        <input
          placeholder={t("phone")}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="rounded-lg px-3 py-2.5 border text-sm"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        />
        <select
          value={form.wilaya}
          onChange={(e) => update("wilaya", e.target.value)}
          className="rounded-lg px-3 py-2.5 border text-sm"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        >
          <option value="">{t("wilaya")}</option>
          {WILAYAS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        {error && <p className="text-xs" style={{ color: "var(--color-accent)" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg py-2.5 font-semibold text-sm text-white disabled:opacity-60"
          style={{ background: "var(--color-accent)" }}
        >
          {loading ? "..." : t("register")}
        </button>
      </form>

      <p className="text-sm text-center mt-4" style={{ color: "var(--color-ink-soft)" }}>
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold" style={{ color: "var(--color-brand)" }}>
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
