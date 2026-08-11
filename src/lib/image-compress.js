/**
 * Client-side image downscaling before upload.
 *
 * Uploading raw camera/phone photos (3-8 MB) over a typical Algerian mobile
 * or ADSL upstream took ~60 seconds per image, which made the admin look
 * frozen. Product photos never need more than ~1600px, so we resize and
 * re-encode in the browser first: a 6 MB photo typically becomes 150-400 KB,
 * roughly 20x faster to send and cheaper for shoppers to download too.
 *
 * The original file is used unchanged if compression fails or would make the
 * file bigger (e.g. an already-optimised small PNG).
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export async function compressImage(file) {
  if (!file.type.startsWith("image/")) return file;
  // GIFs may be animated; re-encoding would flatten them to a single frame.
  if (file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

    // Already small enough and not huge in bytes: leave it alone.
    if (scale === 1 && file.size < 400 * 1024) {
      bitmap.close?.();
      return file;
    }

    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    // Preserve transparency for PNGs; otherwise JPEG compresses far better.
    const hasAlpha = file.type === "image/png" || file.type === "image/webp";
    const outType = hasAlpha ? "image/webp" : "image/jpeg";

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, outType, JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = outType === "image/webp" ? ".webp" : ".jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}${ext}`, { type: outType });
  } catch {
    return file; // never block an upload because compression failed
  }
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
