import path from "path";
import fs from "fs";
import crypto from "crypto";

/**
 * Local file storage for product images.
 *
 * Files are written to UPLOADS_DIR, which lives inside DATA_DIR — the same
 * place as the SQLite database. That means:
 *
 *   ⚠️ WITHOUT A PERSISTENT VOLUME, UPLOADED IMAGES ARE DELETED ON EVERY
 *   DEPLOY, exactly like the database. Attach a Railway volume mounted at
 *   /data and set DATA_DIR=/data before relying on this in production.
 *
 * For a catalogue of any real size, object storage (Cloudinary, S3, Bunny)
 * is the better long-term answer: it survives redeploys, serves via CDN, and
 * doesn't grow your server disk. This local option exists so you can start
 * without signing up for anything.
 */

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB per image

/** Allowed types, mapped to the extension we will actually write. */
const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** Magic-byte signatures, so a renamed .exe can't pose as an image. */
function sniffType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.slice(0, 3).toString("ascii") === "GIF") return "image/gif";
  return null;
}

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Validates and stores one uploaded image.
 * @returns {{ ok: true, url: string, filename: string } | { ok: false, error: string }}
 */
export function saveImage(buffer, declaredType) {
  if (!buffer || buffer.length === 0) return { ok: false, error: "empty_file" };
  if (buffer.length > MAX_UPLOAD_BYTES) return { ok: false, error: "file_too_large" };

  // Trust the file's own bytes over the browser-declared MIME type.
  const sniffed = sniffType(buffer);
  if (!sniffed || !ALLOWED[sniffed]) return { ok: false, error: "unsupported_type" };
  if (declaredType && ALLOWED[declaredType] && declaredType !== sniffed) {
    return { ok: false, error: "type_mismatch" };
  }

  ensureUploadsDir();
  // We generate the filename ourselves — never derived from user input, so
  // path traversal ("../../etc/passwd") is impossible by construction.
  const filename = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}${ALLOWED[sniffed]}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

  return { ok: true, filename, url: `/api/uploads/${filename}` };
}

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Reads a stored image, refusing anything that escapes the uploads folder. */
export function readImage(filename) {
  if (!/^[A-Za-z0-9_-]+\.(jpg|png|webp|gif)$/.test(filename)) return null;

  const full = path.join(UPLOADS_DIR, filename);
  // Belt and braces: confirm the resolved path is still inside UPLOADS_DIR.
  if (!path.resolve(full).startsWith(path.resolve(UPLOADS_DIR) + path.sep)) return null;
  if (!fs.existsSync(full)) return null;

  return {
    buffer: fs.readFileSync(full),
    contentType: CONTENT_TYPES[path.extname(filename).toLowerCase()] || "application/octet-stream",
  };
}
