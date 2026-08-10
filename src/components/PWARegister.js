"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";

/** Registers the service worker and offers an "install app" prompt. */
export default function PWARegister() {
  const { t } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    try {
      setDismissed(localStorage.getItem("elalamia_install_dismissed") === "1");
    } catch {
      setDismissed(false);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("elalamia_install_dismissed", "1"); } catch {}
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div
      className="fixed bottom-3 inset-x-3 z-50 rounded-xl border shadow-lg p-3 flex items-center gap-3 max-w-md mx-auto"
      style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
      role="dialog"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-96.png" alt="" width={40} height={40} className="rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>{t("installTitle")}</p>
        <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{t("installDesc")}</p>
      </div>
      <button
        onClick={install}
        className="text-xs font-bold px-3 py-2 rounded-lg text-white shrink-0"
        style={{ background: "var(--color-accent)" }}
      >
        {t("install")}
      </button>
      <button onClick={dismiss} className="text-lg px-1 shrink-0" style={{ color: "var(--color-ink-soft)" }} aria-label="close">×</button>
    </div>
  );
}
