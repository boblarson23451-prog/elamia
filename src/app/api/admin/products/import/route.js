import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";


/** Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

const NUM = (v, fallback = null) => {
  if (v === undefined || v === null || String(v).trim() === "") return fallback;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

export async function POST(req) {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const { csv, dryRun = false, priceMultiplier = 1 } = await req.json();
  if (!csv || !String(csv).trim()) {
    return NextResponse.json({ error: "empty_csv" }, { status: 400 });
  }

  const rows = parseCsv(String(csv));
  if (rows.length < 2) {
    return NextResponse.json({ error: "no_data_rows" }, { status: 400 });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const required = ["name_fr", "price"];
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length) {
    return NextResponse.json({ error: "missing_columns", missing, found: header }, { status: 400 });
  }

  const categories = db.prepare("SELECT id, slug, name_fr, name_ar FROM categories").all();
  const catBySlug = new Map(categories.map((c) => [c.slug.toLowerCase(), c.id]));
  const catByName = new Map(categories.map((c) => [c.name_fr.toLowerCase(), c.id]));
  const defaultCat = categories[0]?.id;

  const results = { created: 0, skipped: 0, errors: [], preview: [] };
  const insert = db.prepare(`
    INSERT INTO products
      (slug, name_ar, name_fr, description_ar, description_fr, price, compare_at_price,
       category_id, image_seed, image_urls, supplier_ref, weight_grams, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const parsed = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const get = (key) => {
      const idx = header.indexOf(key);
      return idx === -1 ? "" : (cells[idx] ?? "").trim();
    };

    const name_fr = get("name_fr");
    const basePrice = NUM(get("price"));
    if (!name_fr || basePrice == null) {
      results.errors.push({ line: i + 1, reason: "missing name_fr or price" });
      continue;
    }

    const catRaw = get("category").toLowerCase();
    const category_id = catBySlug.get(catRaw) || catByName.get(catRaw) || defaultCat;
    if (!category_id) {
      results.errors.push({ line: i + 1, reason: "no category available" });
      continue;
    }

    const mult = Number(priceMultiplier) || 1;
    const price = Math.round(basePrice * mult);
    const baseCompare = NUM(get("compare_at_price"));
    // The multiplier must apply to the struck-through price too, otherwise a
    // converted price can end up ABOVE its own "original" price.
    const compare_at_price = baseCompare == null ? null : Math.round(baseCompare * mult);

    parsed.push({
      name_fr,
      name_ar: get("name_ar") || name_fr,
      description_fr: get("description_fr"),
      description_ar: get("description_ar") || get("description_fr"),
      price,
      compare_at_price,
      category_id,
      image_urls: get("image_urls") || get("image_url") || null,
      supplier_ref: get("supplier_ref") || null,
      weight_grams: NUM(get("weight_grams"), 500),
      stock: NUM(get("stock"), 50),
      line: i + 1,
    });
  }

  results.preview = parsed.slice(0, 5);
  results.parsedCount = parsed.length;

  if (dryRun) return NextResponse.json(results);

  const run = db.transaction(() => {
    for (const p of parsed) {
      const slug = uniqueSlug(db, p.name_fr || p.name_ar);
      try {
        insert.run(
          slug, p.name_ar, p.name_fr, p.description_ar, p.description_fr,
          p.price, p.compare_at_price, p.category_id, slug,
          p.image_urls, p.supplier_ref, p.weight_grams, p.stock
        );
        results.created++;
      } catch (err) {
        results.skipped++;
        results.errors.push({ line: p.line, reason: String(err.message).slice(0, 120) });
      }
    }
  });
  run();

  return NextResponse.json(results);
}
