"use client";

import { useRef, useState } from "react";
import { useLang } from "@/context/LangContext";
import { compressImage, formatBytes } from "@/lib/image-compress";

/**
 * Uploads images from the user's computer and manages the ordered list of
 * image URLs for a product. Also accepts pasted external URLs, so existing
 * supplier links keep working.
 */
export default function ImageUploader({ value, onChange }) {
  const { t } = useLang();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");

  const urls = String(value || "")
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter(Boolean);

  const setUrls = (next) => onChange(next.join("\n"));

  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError("");
    setNote("");
    setBusy(true);
    setProgress(0);

    try {
      // 1) Shrink in the browser first — this is what makes uploads fast.
      setNote(t("optimising"));
      const originalBytes = files.reduce((n, f) => n + f.size, 0);
      const prepared = [];
      for (const f of files.slice(0, 10)) prepared.push(await compressImage(f));
      const finalBytes = prepared.reduce((n, f) => n + f.size, 0);
      if (finalBytes < originalBytes) {
        setNote(`${formatBytes(originalBytes)} → ${formatBytes(finalBytes)}`);
      }

      // 2) Upload with real progress. fetch() can't report upload progress,
      //    so use XHR — a silent minute-long wait is what made this feel broken.
      const fd = new FormData();
      prepared.forEach((f) => fd.append("files", f));

      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error("bad_response")); }
        };
        xhr.onerror = () => reject(new Error("network"));
        xhr.ontimeout = () => reject(new Error("timeout"));
        xhr.timeout = 120000;
        xhr.send(fd);
      });

      if (data.urls?.length) setUrls([...urls, ...data.urls]);
      if (data.errors?.length) {
        const first = data.errors[0];
        setError(
          first.error === "file_too_large" ? t("uploadTooLarge")
          : first.error === "unsupported_type" ? t("uploadBadType")
          : t("uploadFailed")
        );
      }
    } catch {
      setError(t("uploadFailed"));
    } finally {
      setBusy(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const move = (i, dir) => {
    const next = [...urls];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setUrls(next);
  };

  return (
    <div>
      <label className="text-sm font-medium block mb-1">{t("productImages")}</label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? "var(--color-accent)" : "var(--color-line)",
          background: dragging ? "rgba(221,75,46,0.05)" : "var(--color-paper)",
        }}
      >
        <p className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
          {busy ? (progress > 0 ? `${t("uploading")} ${progress}%` : t("optimising")) : t("uploadCta")}
        </p>
        {busy && (
          <div className="h-1.5 rounded-full overflow-hidden mt-2 mx-auto max-w-xs" style={{ background: "var(--color-line)" }}>
            <div
              className="h-full transition-all duration-200"
              style={{ width: `${progress}%`, background: "var(--color-accent)" }}
            />
          </div>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>
          {busy && note ? note : t("uploadHint")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {error && <p className="text-xs mt-2" style={{ color: "var(--color-accent)" }}>{error}</p>}

      {urls.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
          {urls.map((u, i) => (
            <div
              key={u + i}
              className="relative rounded-lg overflow-hidden border aspect-square group"
              style={{ borderColor: i === 0 ? "var(--color-accent)" : "var(--color-line)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {i === 0 && (
                <span
                  className="absolute top-0 start-0 text-[9px] px-1 py-0.5 text-white"
                  style={{ background: "var(--color-accent)" }}
                >
                  {t("mainImage")}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity"
                   style={{ background: "rgba(0,0,0,0.55)" }}>
                <button type="button" onClick={() => move(i, -1)} className="text-white text-xs px-1.5 py-0.5">‹</button>
                <button type="button" onClick={() => setUrls(urls.filter((_, k) => k !== i))} className="text-white text-xs px-1.5 py-0.5">✕</button>
                <button type="button" onClick={() => move(i, 1)} className="text-white text-xs px-1.5 py-0.5">›</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <details className="mt-3">
        <summary className="text-xs cursor-pointer" style={{ color: "var(--color-ink-soft)" }}>
          {t("orPasteUrls")}
        </summary>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={"https://.../photo1.jpg\nhttps://.../photo2.jpg"}
          className="w-full rounded-lg px-3 py-2.5 border text-xs font-mono mt-2"
          style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
        />
      </details>
    </div>
  );
}
