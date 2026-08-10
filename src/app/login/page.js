"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

export default function LoginPage() {
  const { t } = useLang();
  const { refreshUser, refreshCart } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      await refreshUser();
      await refreshCart();
      router.push("/");
      router.refresh();
    } else {
      setError(t("invalidCredentials"));
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold mb-1 text-center" style={{ color: "var(--color-ink)" }}>{t("login")}</h1>
      <p className="text-xs text-center mb-6" style={{ color: "var(--color-ink-soft)" }}>{t("demoAccountNote")}</p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg px-3 py-2.5 border text-sm"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        />
        <input
          type="password"
          required
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg px-3 py-2.5 border text-sm"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        />
        {error && <p className="text-xs" style={{ color: "var(--color-accent)" }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg py-2.5 font-semibold text-sm text-white disabled:opacity-60"
          style={{ background: "var(--color-accent)" }}
        >
          {loading ? "..." : t("login")}
        </button>
      </form>

      <p className="text-sm text-center mt-4" style={{ color: "var(--color-ink-soft)" }}>
        {t("noAccount")}{" "}
        <Link href="/register" className="font-semibold" style={{ color: "var(--color-brand)" }}>
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
