"use client";

import { useState } from "react";

/** Parses the stored comma/newline-separated image URL list. */
export function parseImageUrls(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[\n,]+/)
    .map((u) => u.trim())
    // Accept both absolute URLs (supplier/CDN links) and site-relative paths
    // like /api/uploads/xxx.webp. An earlier version only allowed http(s),
    // which silently discarded every image uploaded from the admin - the file
    // saved fine, but the product page always fell back to the placeholder.
    .filter((u) => /^(https?:\/\/|\/)/i.test(u));
}

/**
 * Renders a product image. Prefers a real supplier/CDN image URL; falls back
 * to a deterministic placeholder if none is set or the URL fails to load
 * (common when hotlinking a CDN that blocks external referers).
 */
export default function ProductImage({ seed, urls, alt, className }) {
  const list = parseImageUrls(urls);
  const [failed, setFailed] = useState(false);
  const src =
    !failed && list.length > 0
      ? list[0]
      : `https://picsum.photos/seed/${encodeURIComponent(seed || "elalamia")}/600/600`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
