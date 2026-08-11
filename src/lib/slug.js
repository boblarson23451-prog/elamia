/**
 * URL-safe slug generation.
 *
 * Accented Latin characters are transliterated rather than stripped: an
 * earlier version deleted them outright, turning "Robe été fleurie" into
 * "robe-t-fleurie" and "Haltères réglables" into "haltres-rglables". Slugs
 * containing raw accents also 404'd, because the stored slug and the encoded
 * URL didn't match.
 *
 * Names with no Latin characters at all (e.g. pure Arabic) would otherwise
 * produce an empty slug, so those fall back to a readable prefix plus a
 * random suffix.
 */
export function slugify(text, fallbackPrefix = "produit") {
  const base = String(text || "")
    .normalize("NFD")                    // split accented chars into letter + mark
    .replace(/[\u0300-\u036f]/g, "")     // drop the marks: é -> e, è -> e, î -> i
    .replace(/[œ]/g, "oe")
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "-")               // d'hiver -> d-hiver, not dhiver
    .replace(/[^a-z0-9\s-]/g, "")        // keep ASCII only — URLs stay portable
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base) return base;
  return `${fallbackPrefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Returns a slug guaranteed not to collide with an existing one. */
export function uniqueSlug(db, text, fallbackPrefix = "produit") {
  let slug = slugify(text, fallbackPrefix);
  const exists = db.prepare("SELECT id FROM products WHERE slug = ?");
  let candidate = slug;
  let n = 2;
  while (exists.get(candidate)) {
    candidate = `${slug}-${n++}`;
    if (n > 500) { candidate = `${slug}-${Math.random().toString(36).slice(2, 8)}`; break; }
  }
  return candidate;
}
