import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

// DATA_DIR can be pointed at a mounted persistent volume (e.g. /data on
// Railway) via the DATA_DIR env var. Without a persistent volume the SQLite
// file lives on the container's ephemeral disk and is DESTROYED on every
// deploy or restart — see README "Going live".
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
if (!fs.existsSync(/*turbopackIgnore: true*/ DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "elalamia.sqlite");

// Reuse a single connection across hot reloads in dev
const globalForDb = globalThis;
export const db = globalForDb.__elalamia_db || new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") globalForDb.__elalamia_db = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  wilaya TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  store_name TEXT NOT NULL,
  store_slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  wilaya TEXT,
  phone TEXT,
  logo_seed TEXT NOT NULL DEFAULT 'store-default',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🛍️',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_ar TEXT NOT NULL DEFAULT '',
  description_fr TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  compare_at_price INTEGER,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  vendor_id INTEGER REFERENCES vendors(id),
  image_seed TEXT NOT NULL,
  image_urls TEXT,
  supplier_ref TEXT,
  option1_name_fr TEXT,
  option1_name_ar TEXT,
  option2_name_fr TEXT,
  option2_name_ar TEXT,
  weight_grams INTEGER NOT NULL DEFAULT 500,
  stock INTEGER NOT NULL DEFAULT 50,
  rating REAL NOT NULL DEFAULT 4.5,
  sold_count INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  v1_fr TEXT,
  v1_ar TEXT,
  v2_fr TEXT,
  v2_ar TEXT,
  sku TEXT,
  price INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  weight_grams INTEGER,
  image_url TEXT,
  swatch TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  variant_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  address TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  shipping_carrier TEXT NOT NULL DEFAULT 'ems',
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  delivery_type TEXT NOT NULL DEFAULT 'home',
  pickup_point_id TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  chargily_checkout_id TEXT,
  sofizpay_transaction_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  vendor_id INTEGER REFERENCES vendors(id),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL
);
`);

// Lightweight migration: add columns that may be missing on a DB created by an earlier version of this app.
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}
ensureColumn("products", "vendor_id", "vendor_id INTEGER REFERENCES vendors(id)");
ensureColumn("orders", "sofizpay_transaction_id", "sofizpay_transaction_id TEXT");
ensureColumn("order_items", "vendor_id", "vendor_id INTEGER REFERENCES vendors(id)");
ensureColumn("orders", "payment_status", "payment_status TEXT NOT NULL DEFAULT 'unpaid'");
ensureColumn("orders", "chargily_checkout_id", "chargily_checkout_id TEXT");
ensureColumn("products", "weight_grams", "weight_grams INTEGER NOT NULL DEFAULT 500");
ensureColumn("orders", "shipping_carrier", "shipping_carrier TEXT NOT NULL DEFAULT 'ems'");
ensureColumn("orders", "shipping_cost", "shipping_cost INTEGER NOT NULL DEFAULT 0");
ensureColumn("orders", "delivery_type", "delivery_type TEXT NOT NULL DEFAULT 'home'");
ensureColumn("orders", "pickup_point_id", "pickup_point_id TEXT");
ensureColumn("orders", "subtotal", "subtotal INTEGER NOT NULL DEFAULT 0");
ensureColumn("products", "image_urls", "image_urls TEXT");
ensureColumn("products", "option1_name_fr", "option1_name_fr TEXT");
ensureColumn("products", "option1_name_ar", "option1_name_ar TEXT");
ensureColumn("products", "option2_name_fr", "option2_name_fr TEXT");
ensureColumn("products", "option2_name_ar", "option2_name_ar TEXT");
ensureColumn("cart_items", "variant_id", "variant_id INTEGER REFERENCES product_variants(id)");
ensureColumn("order_items", "variant_id", "variant_id INTEGER");
ensureColumn("order_items", "variant_label_fr", "variant_label_fr TEXT");
ensureColumn("order_items", "variant_label_ar", "variant_label_ar TEXT");

/* cart_items originally carried UNIQUE(user_id, product_id), which makes it
 * impossible to hold the same product in two variants (e.g. a shirt in M and
 * in L). SQLite can't drop a constraint in place, so rebuild the table once.
 * Note NULLs are distinct in SQLite UNIQUE constraints, so the replacement is
 * an expression index over COALESCE(variant_id, 0) — otherwise rows with no
 * variant could duplicate freely. */
function rebuildCartItemsIfNeeded() {
  const ddl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='cart_items'").get()?.sql || "";
  if (!/UNIQUE\s*\(\s*user_id\s*,\s*product_id\s*\)/i.test(ddl)) return;

  db.transaction(() => {
    db.exec(`
      CREATE TABLE cart_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        variant_id INTEGER REFERENCES product_variants(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO cart_items_new (id, user_id, product_id, variant_id, quantity, created_at)
        SELECT id, user_id, product_id, variant_id, quantity, created_at FROM cart_items;
      DROP TABLE cart_items;
      ALTER TABLE cart_items_new RENAME TO cart_items;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique
        ON cart_items(user_id, product_id, COALESCE(variant_id, 0));
    `);
  })();
}
try {
  rebuildCartItemsIfNeeded();
} catch (err) {
  console.warn("[ELALAMIA] cart_items rebuild skipped:", err.message);
}

// Fresh databases get the index directly (the rebuild above is a no-op there).
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique ON cart_items(user_id, product_id, COALESCE(variant_id, 0));");
ensureColumn("products", "supplier_ref", "supplier_ref TEXT");

/** True while `next build` is collecting page data. Build workers import this
 * module in parallel; letting them all seed/provision races on UNIQUE
 * constraints and fails the build. Nothing needs writing at build time. */
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

function seedIfEmpty() {
  const { count } = db.prepare("SELECT COUNT(*) as count FROM categories").get();
  if (count > 0) return;

  const insertCategory = db.prepare(
    "INSERT INTO categories (slug, name_ar, name_fr, icon, sort_order) VALUES (?, ?, ?, ?, ?)"
  );
  const categories = [
    ["electronique", "إلكترونيات", "Électronique", "📱", 1],
    ["mode-homme", "أزياء رجالية", "Mode Homme", "👔", 2],
    ["mode-femme", "أزياء نسائية", "Mode Femme", "👗", 3],
    ["maison", "المنزل والديكور", "Maison & Déco", "🏠", 4],
    ["beaute", "الجمال والعناية", "Beauté & Soins", "💄", 5],
    ["enfants", "أطفال وألعاب", "Enfants & Jouets", "🧸", 6],
    ["sport", "رياضة وترفيه", "Sport & Loisirs", "⚽", 7],
    ["cuisine", "أدوات المطبخ", "Cuisine", "🍳", 8],
    ["auto", "السيارات", "Auto & Moto", "🚗", 9],
    ["telephonie", "هواتف واكسسوارات", "Téléphonie", "📲", 10],
  ];
  const catIds = {};
  for (const c of categories) {
    const info = insertCategory.run(...c);
    catIds[c[0]] = info.lastInsertRowid;
  }

  const insertProduct = db.prepare(`
    INSERT INTO products
      (slug, name_ar, name_fr, description_ar, description_fr, price, compare_at_price, category_id, image_seed, weight_grams, stock, rating, sold_count)
    VALUES (@slug, @name_ar, @name_fr, @description_ar, @description_fr, @price, @compare_at_price, @category_id, @image_seed, @weight_grams, @stock, @rating, @sold_count)
  `);

  const products = [
    { slug: "ecouteurs-bluetooth-tws", name_ar: "سماعات بلوتوث لاسلكية TWS", name_fr: "Écouteurs Bluetooth sans fil TWS", description_ar: "صوت نقي، بطارية تدوم طويلاً، مقاومة للعرق، مناسبة للرياضة والاستخدام اليومي.", description_fr: "Son clair, longue autonomie, résistants à la transpiration. Parfaits pour le sport et le quotidien.", price: 2490, compare_at_price: 4900, category_id: catIds["telephonie"], image_seed: "earbuds-elalamia", weight_grams: 120, stock: 120, rating: 4.6, sold_count: 842 },
    { slug: "montre-connectee-sport", name_ar: "ساعة ذكية رياضية", name_fr: "Montre connectée sport", description_ar: "تتبع النشاط البدني، معدل ضربات القلب، إشعارات الهاتف، شاشة لمس ملونة.", description_fr: "Suivi d'activité, fréquence cardiaque, notifications, écran tactile couleur.", price: 3990, compare_at_price: 7500, category_id: catIds["telephonie"], image_seed: "smartwatch-elalamia", weight_grams: 150, stock: 75, rating: 4.4, sold_count: 511 },
    { slug: "coque-silicone-universelle", name_ar: "غطاء سيليكون لهاتف", name_fr: "Coque silicone universelle", description_ar: "حماية كاملة ضد الصدمات، مقاس متوفر لأغلب الهواتف.", description_fr: "Protection anti-choc complète, disponible pour la plupart des modèles.", price: 590, compare_at_price: 1200, category_id: catIds["telephonie"], image_seed: "phonecase-elalamia", weight_grams: 60, stock: 300, rating: 4.2, sold_count: 1290 },
    { slug: "veste-homme-hiver", name_ar: "سترة شتوية رجالية", name_fr: "Veste homme hiver", description_ar: "قماش سميك مقاوم للماء، بطانة دافئة، مقاسات من M إلى XXL.", description_fr: "Tissu épais déperlant, doublure chaude, tailles du M au XXL.", price: 4500, compare_at_price: 8900, category_id: catIds["mode-homme"], image_seed: "jacket-men-elalamia", weight_grams: 1200, stock: 60, rating: 4.5, sold_count: 233 },
    { slug: "chemise-homme-classique", name_ar: "قميص رجالي كلاسيكي", name_fr: "Chemise homme classique", description_ar: "قطن ناعم، قصة عصرية، مناسبة للعمل والمناسبات.", description_fr: "Coton doux, coupe moderne, idéale au bureau comme en soirée.", price: 1990, compare_at_price: 3400, category_id: catIds["mode-homme"], image_seed: "shirt-men-elalamia", weight_grams: 350, stock: 140, rating: 4.3, sold_count: 402 },
    { slug: "robe-femme-ete", name_ar: "فستان صيفي نسائي", name_fr: "Robe femme été", description_ar: "قماش خفيف ومريح، تصميم أنيق يناسب جميع المناسبات.", description_fr: "Tissu léger et confortable, design élégant pour toutes les occasions.", price: 2790, compare_at_price: 5200, category_id: catIds["mode-femme"], image_seed: "dress-women-elalamia", weight_grams: 400, stock: 90, rating: 4.7, sold_count: 678 },
    { slug: "sac-a-main-femme", name_ar: "حقيبة يد نسائية", name_fr: "Sac à main femme", description_ar: "جلد صناعي فاخر، مساحة واسعة، تصميم عصري أنيق.", description_fr: "Simili-cuir premium, grand espace, design tendance.", price: 2290, compare_at_price: 4100, category_id: catIds["mode-femme"], image_seed: "handbag-elalamia", weight_grams: 700, stock: 110, rating: 4.5, sold_count: 355 },
    { slug: "foulard-hijab-soie", name_ar: "حجاب حرير فاخر", name_fr: "Hijab soie premium", description_ar: "خامة حريرية ناعمة، ألوان متعددة، لا يحتاج إبرة.", description_fr: "Matière soyeuse et douce, plusieurs coloris, sans épingle nécessaire.", price: 990, compare_at_price: 1800, category_id: catIds["mode-femme"], image_seed: "hijab-elalamia", weight_grams: 120, stock: 200, rating: 4.8, sold_count: 950 },
    { slug: "set-casseroles-antiadhesif", name_ar: "طقم قدور غير لاصقة", name_fr: "Set de casseroles antiadhésives", description_ar: "طقم من 5 قطع، سطح غير لاصق، مناسب لجميع أنواع المواقد.", description_fr: "Set de 5 pièces, revêtement antiadhésif, compatible tous feux.", price: 5900, compare_at_price: 11000, category_id: catIds["cuisine"], image_seed: "cookware-elalamia", weight_grams: 4500, stock: 45, rating: 4.6, sold_count: 289 },
    { slug: "mixeur-electrique", name_ar: "خلاط كهربائي متعدد الاستخدامات", name_fr: "Mixeur électrique multifonction", description_ar: "قوة 500 واط، عدة سرعات، سهل التنظيف.", description_fr: "Puissance 500W, plusieurs vitesses, facile à nettoyer.", price: 3400, compare_at_price: 6200, category_id: catIds["cuisine"], image_seed: "blender-elalamia", weight_grams: 2200, stock: 55, rating: 4.4, sold_count: 198 },
    { slug: "tapis-salon-moderne", name_ar: "سجادة صالون عصرية", name_fr: "Tapis salon moderne", description_ar: "نسيج كثيف مريح، تصميم عصري يناسب جميع الديكورات.", description_fr: "Tissage dense et confortable, design moderne pour tous les intérieurs.", price: 4200, compare_at_price: 7800, category_id: catIds["maison"], image_seed: "rug-elalamia", weight_grams: 6000, stock: 40, rating: 4.5, sold_count: 165 },
    { slug: "lampe-led-chevet", name_ar: "مصباح LED للسرير", name_fr: "Lampe LED de chevet", description_ar: "إضاءة قابلة للتعديل، شحن USB، تصميم أنيق.", description_fr: "Luminosité réglable, rechargeable USB, design élégant.", price: 1590, compare_at_price: 2900, category_id: catIds["maison"], image_seed: "lamp-elalamia", weight_grams: 550, stock: 130, rating: 4.3, sold_count: 421 },
    { slug: "creme-visage-hydratante", name_ar: "كريم مرطب للوجه", name_fr: "Crème visage hydratante", description_ar: "تركيبة غنية بالفيتامينات، مناسبة لجميع أنواع البشرة.", description_fr: "Formule riche en vitamines, adaptée à tous types de peau.", price: 1290, compare_at_price: 2300, category_id: catIds["beaute"], image_seed: "cream-elalamia", weight_grams: 200, stock: 180, rating: 4.6, sold_count: 733 },
    { slug: "palette-maquillage-pro", name_ar: "باليت مكياج احترافية", name_fr: "Palette maquillage pro", description_ar: "ألوان غنية قابلة للمزج، تدوم طويلاً طوال اليوم.", description_fr: "Couleurs riches et fondantes, tenue longue durée.", price: 2100, compare_at_price: 3900, category_id: catIds["beaute"], image_seed: "makeup-elalamia", weight_grams: 350, stock: 95, rating: 4.5, sold_count: 512 },
    { slug: "peluche-enfant-geante", name_ar: "دمية محشوة كبيرة للأطفال", name_fr: "Peluche géante enfant", description_ar: "قماش ناعم وآمن، حجم كبير، هدية مثالية للأطفال.", description_fr: "Tissu doux et sûr, grande taille, cadeau idéal pour enfants.", price: 1990, compare_at_price: 3600, category_id: catIds["enfants"], image_seed: "plush-elalamia", weight_grams: 900, stock: 70, rating: 4.7, sold_count: 340 },
    { slug: "circuit-voiture-jouet", name_ar: "مسار سيارات لعبة للأطفال", name_fr: "Circuit voiture jouet", description_ar: "تجميع سهل، حركة سريعة، متعة مضمونة للأطفال.", description_fr: "Montage facile, action rapide, plaisir garanti pour les enfants.", price: 2890, compare_at_price: 5100, category_id: catIds["enfants"], image_seed: "toycar-elalamia", weight_grams: 1500, stock: 65, rating: 4.4, sold_count: 210 },
    { slug: "tapis-yoga-antiderapant", name_ar: "سجادة يوغا مانعة للانزلاق", name_fr: "Tapis de yoga antidérapant", description_ar: "سماكة مريحة، خامة مانعة للانزلاق، مناسبة لكل التمارين.", description_fr: "Épaisseur confortable, matière antidérapante, adapté à tous les exercices.", price: 1890, compare_at_price: 3200, category_id: catIds["sport"], image_seed: "yogamat-elalamia", weight_grams: 1300, stock: 100, rating: 4.6, sold_count: 388 },
    { slug: "halteres-reglables-paire", name_ar: "دمبل قابل للتعديل (زوج)", name_fr: "Haltères réglables (paire)", description_ar: "وزن قابل للتعديل، مقبض مريح، مثالي للتمرين المنزلي.", description_fr: "Poids ajustable, prise confortable, idéal pour l'entraînement à la maison.", price: 4990, compare_at_price: 8500, category_id: catIds["sport"], image_seed: "dumbbells-elalamia", weight_grams: 12000, stock: 50, rating: 4.5, sold_count: 176 },
    { slug: "housse-siege-auto-universelle", name_ar: "غطاء مقاعد سيارة عالمي", name_fr: "Housse de siège auto universelle", description_ar: "خامة متينة، سهلة التركيب، تناسب أغلب السيارات.", description_fr: "Matière résistante, installation facile, compatible avec la plupart des véhicules.", price: 3200, compare_at_price: 5900, category_id: catIds["auto"], image_seed: "carseat-elalamia", weight_grams: 2500, stock: 58, rating: 4.3, sold_count: 149 },
    { slug: "support-telephone-voiture", name_ar: "حامل هاتف للسيارة", name_fr: "Support téléphone voiture", description_ar: "تثبيت قوي، تدوير 360 درجة، سهل الاستخدام.", description_fr: "Fixation solide, rotation à 360°, facile à utiliser.", price: 890, compare_at_price: 1600, category_id: catIds["auto"], image_seed: "carmount-elalamia", weight_grams: 200, stock: 220, rating: 4.4, sold_count: 890 },
    { slug: "chargeur-rapide-usb-c", name_ar: "شاحن سريع USB-C", name_fr: "Chargeur rapide USB-C", description_ar: "شحن سريع 33 واط، متوافق مع أغلب الهواتف الحديثة.", description_fr: "Charge rapide 33W, compatible avec la plupart des smartphones récents.", price: 1490, compare_at_price: 2600, category_id: catIds["electronique"], image_seed: "charger-elalamia", weight_grams: 150, stock: 250, rating: 4.7, sold_count: 1044 },
    { slug: "enceinte-bluetooth-portable", name_ar: "مكبر صوت بلوتوث محمول", name_fr: "Enceinte Bluetooth portable", description_ar: "صوت قوي وواضح، مقاومة للماء، بطارية 12 ساعة.", description_fr: "Son puissant et clair, résistante à l'eau, 12h d'autonomie.", price: 3600, compare_at_price: 6500, category_id: catIds["electronique"], image_seed: "speaker-elalamia", weight_grams: 600, stock: 85, rating: 4.6, sold_count: 467 },
    { slug: "powerbank-20000mah", name_ar: "بطارية محمولة 20000 مللي أمبير", name_fr: "Powerbank 20000mAh", description_ar: "سعة كبيرة، منفذان للشحن، تصميم رفيع.", description_fr: "Grande capacité, double port de charge, design fin.", price: 2990, compare_at_price: 5400, category_id: catIds["electronique"], image_seed: "powerbank-elalamia", weight_grams: 400, stock: 140, rating: 4.5, sold_count: 623 },
    { slug: "clavier-souris-sans-fil", name_ar: "طقم لوحة مفاتيح وفأرة لاسلكية", name_fr: "Clavier + souris sans fil", description_ar: "اتصال مستقر، تصميم مريح، بطارية تدوم طويلاً.", description_fr: "Connexion stable, design ergonomique, longue autonomie.", price: 2490, compare_at_price: 4300, category_id: catIds["electronique"], image_seed: "keyboard-elalamia", weight_grams: 800, stock: 78, rating: 4.3, sold_count: 201 },
  ];

  const insertMany = db.transaction((rows) => {
    for (const p of rows) insertProduct.run(p);
  });
  insertMany(products);

  // --- Accounts ---
  // In production we do NOT create demo accounts with a published password.
  // Instead an admin is created from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
  const isProd = process.env.NODE_ENV === "production";
  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role, wilaya) VALUES (?, ?, ?, ?, ?)"
  );

  if (isProd) {
    // Admin provisioning happens in ensureAdmin() below, which runs on EVERY
    // boot rather than only on first seed - otherwise attaching a persistent
    // volume later would leave you locked out with no way to create an admin.
    return; // no demo customer/vendor/product-assignment in production
  }

  // --- Development-only demo accounts (password: elalamia123) ---
  const passwordHash = bcrypt.hashSync("elalamia123", 10);
  insertUser.run("Admin ELALAMIA", "admin@elalamia.dz", passwordHash, "admin", "Alger");
  insertUser.run("Client Démo", "client@elalamia.dz", passwordHash, "customer", "Tlemcen");

  const vendorUserInfo = insertUser.run("Boutique Sahara", "vendeur@elalamia.dz", passwordHash, "vendor", "Oran");
  const vendorUserId = vendorUserInfo.lastInsertRowid;
  const vendorInfo = db
    .prepare(
      `INSERT INTO vendors (user_id, store_name, store_slug, description, wilaya, phone, logo_seed, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`
    )
    .run(
      vendorUserId,
      "Boutique Sahara",
      "boutique-sahara",
      "Produits électroniques et accessoires sélectionnés, envoyés directement depuis Oran.",
      "31 - Oran",
      "0555000000",
      "boutique-sahara-logo"
    );
  const demoVendorId = vendorInfo.lastInsertRowid;

  const vendorProductSlugs = ["ecouteurs-bluetooth-tws", "montre-connectee-sport", "chargeur-rapide-usb-c", "enceinte-bluetooth-portable", "powerbank-20000mah"];
  const assignVendor = db.prepare("UPDATE products SET vendor_id = ? WHERE slug = ?");
  for (const slug of vendorProductSlugs) assignVendor.run(demoVendorId, slug);
}

if (!IS_BUILD_PHASE) {
  try {
    // A single IMMEDIATE transaction serialises concurrent seeders: the first
    // takes the write lock, the rest then see count > 0 and no-op.
    db.transaction(seedIfEmpty).immediate();
  } catch (err) {
    console.warn("[ELALAMIA] seed skipped:", err.message);
  }
}


/**
 * Ensures an admin account exists, on every boot, from env vars.
 *
 *   ADMIN_EMAIL     - login email for the admin
 *   ADMIN_PASSWORD  - password (change it after first login)
 *   ADMIN_NAME      - optional display name
 *
 * If the account already exists, its password is re-synced to ADMIN_PASSWORD.
 * That makes the env var an effective password-reset lever if you ever get
 * locked out - but it also means changing the password in-app would be undone
 * on the next restart while ADMIN_PASSWORD is set to something else. Keep the
 * env var in sync, or unset it once you have a working admin and a persistent
 * database.
 */
function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const hash = bcrypt.hashSync(password, 10);

  // Atomic upsert. A check-then-insert races badly: Next.js runs many build
  // workers in parallel, each importing this module, and they collided on the
  // users.email UNIQUE constraint and failed the build. ON CONFLICT makes this
  // safe under concurrency.
  try {
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON CONFLICT(email) DO UPDATE SET
         password_hash = excluded.password_hash,
         role = 'admin'`
    ).run(process.env.ADMIN_NAME || "Admin", email, hash);
  } catch (err) {
    // Never let admin provisioning break app startup or the build.
    console.warn("[ELALAMIA] ensureAdmin skipped:", err.message);
  }
}

if (!IS_BUILD_PHASE) ensureAdmin();

// Startup diagnostic: makes it obvious in the deploy logs whether the
// database is on a persistent volume or an ephemeral container disk.
// If "seeded fresh" appears on EVERY deploy, data is NOT persisting.
if (!IS_BUILD_PHASE) {
  try {
    const counts = {
      products: db.prepare("SELECT COUNT(*) c FROM products").get().c,
      orders: db.prepare("SELECT COUNT(*) c FROM orders").get().c,
      users: db.prepare("SELECT COUNT(*) c FROM users").get().c,
    };
    console.log(
      `[ELALAMIA] db=${DB_PATH} persisted=${counts.orders > 0 || counts.users > 1 ? "likely" : "unknown"} ` +
      `products=${counts.products} orders=${counts.orders} users=${counts.users}`
    );
  } catch (err) {
    console.warn("[ELALAMIA] startup diagnostic failed:", err.message);
  }
}
