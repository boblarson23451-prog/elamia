"use client";

export default function ProductImage({ seed, alt, className }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://picsum.photos/seed/${encodeURIComponent(seed)}/600/600`}
      alt={alt}
      loading="lazy"
      className={className}
    />
  );
}
