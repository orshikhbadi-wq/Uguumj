/* eslint-disable @typescript-eslint/no-explicit-any */
import { env } from "cloudflare:workers";

type RuntimeEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
};

const runtime = env as unknown as RuntimeEnv;
const DEFAULT_ADMIN_EMAIL = "orshikhbadi@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "UguumjAdmin2026!";

const CONTENT_DEFAULTS: Record<string, { mn: Record<string, string>; en: Record<string, string> }> = {
  hero: {
    mn: {
      eyebrow: "2000 оноос хойш",
      title: "Сэтгэлд хүрсэн амт.",
      subtitle: "Өдөр бүрийн амт, итгэлтэй чанар.",
      description: "Өгөөмж Архад ХХК — Монголын нарийн боов, хүнсний үйлдвэрлэлийн ууган байгууллагуудын нэг.",
    },
    en: {
      eyebrow: "Since 2000",
      title: "Taste that reaches the heart.",
      subtitle: "Everyday taste, trusted quality.",
      description: "Uguumj Arkhad LLC — a Mongolian bakery and food manufacturing institution.",
    },
  },
  history: {
    mn: {
      title: "Хорин таван жилийн",
      title_accent: "тууштай хөдөлмөр",
      para1: "Өгөөмж Архад ХХК нь дөрвөн хүний бүрэлдэхүүнтэй өрхийн үйлдвэрлэлээс эхэлж, өнөөдөр талх, нарийн боовны үйлдвэрлэл, борлуулалтын чиглэлээр 25 жил ажиллаж байна.",
      para2: "Бид уламжлалт амтыг орчин үеийн үйлдвэрлэлийн стандарттай хослуулж, хэрэглэгч бүрийн өдөр тутмын амьдралд итгэлтэй сонголт хүргэхийг зорьдог.",
      stat1_value: "25+",
      stat1_label: "Жилийн туршлага",
      stat2_value: "2000",
      stat2_label: "Үүсгэн байгуулагдсан он",
    },
    en: {
      title: "Over two decades of",
      title_accent: "quiet dedication",
      para1: "Founded as a four-person household production, Uguumj Arkhad has spent 25 years in bread, pastry production, and sales.",
      para2: "We pair familiar taste with modern manufacturing standards to deliver a trusted choice for everyday life.",
      stat1_value: "25+",
      stat1_label: "Years of experience",
      stat2_value: "2000",
      stat2_label: "Year founded",
    },
  },
  craftsmanship: {
    mn: { eyebrow: "Үйлдвэрлэлийн үйл явц", title: "Хэмжээ өссөн ч", title_accent: "чанар буурахгүй", quote: "Технологи бидэнд олон хүнд хүрэх боломж өгдөг. Харин гарын ур дүй амтыг хадгалдаг." },
    en: { eyebrow: "The process", title: "Scale without", title_accent: "compromise", quote: "Technology helps us serve the nation; craft ensures we serve it well." },
  },
  products: {
    mn: { title: "Өдөр тутмын амьдралд зориулсан", title_accent: "амтын сонголт", intro: "Талх, нарийн боов, жигнэмэгийн бүтээгдэхүүнүүдээ тогтвортой чанар, танил сайхан амтаар үйлдвэрлэдэг." },
    en: { title: "A repertoire built for", title_accent: "daily life", intro: "From breads to delicate pastries, our product line is made for consistency and taste." },
  },
  manufacturing: {
    mn: { eyebrow: "Үйлдвэрлэл", title: "Тогтвортой чанарын", title_accent: "нарийн ажиллагаа", body: "Орчин үеийн тоног төхөөрөмж, цэвэр орчин, хариуцлагатай багийн ажиллагаа нь бүтээгдэхүүн бүрийн чанарыг баталгаажуулдаг." },
    en: { eyebrow: "Facilities", title: "The quiet hum of", title_accent: "precision", body: "Modern equipment, a clean environment, and a responsible team protect the quality of every product." },
  },
  safety: {
    mn: { eyebrow: "Чанарын стандарт", title: "Тууштай", title_accent: "итгэл", body: "Бид түүхий эдээс эхлээд бэлэн бүтээгдэхүүн хүртэлх бүхий л шатанд чанар, аюулгүй байдлыг эрхэмлэдэг." },
    en: { eyebrow: "Standards", title: "Uncompromising", title_accent: "integrity", body: "From ingredients to finished products, we protect quality and safety at every step." },
  },
  people: {
    mn: { title: "Өгөөмж Архадын ард буй", title_accent: "хүмүүс", quote: "Үйлдвэрийн амт, чанарыг өдөр бүр бий болгодог хүмүүс бол бидний хамгийн том үнэ цэнэ.", attribution: "— Өгөөмж Архадын хамт олон" },
    en: { title: "The hands behind", title_accent: "the heritage", quote: "The people who show up every day are the heart of our quality.", attribution: "— The Uguumj Arkhad team" },
  },
  partners: {
    mn: { eyebrow: "Түншлэл", title: "Хамтын үнэ цэнэ,", title_accent: "хамтын өсөлт", body: "Бид дэлгүүр, сүлжээ дэлгүүр, кафе, ресторан, зочид буудал болон байгууллагын харилцагчдад найдвартай нийлүүлэлт хүргэдэг." },
    en: { eyebrow: "Partnerships", title: "Shared values,", title_accent: "shared success", body: "We supply retailers, cafes, restaurants, hotels, and institutions with dependable products." },
  },
  future: {
    mn: { divider_quote: "Сэтгэлд хүрсэн амт.", title: "Маргаашийг", title_accent: "өнөөдрөөс", body: "Монгол амт, уламжлал дээрээ тулгуурлан илүү олон хэрэглэгчид хүрэхийн төлөө хөгжсөөр байна.", location: "Улаанбаатар хот, Монгол Улс", email: "Info@uguumjarkhad.mn", phone: "7270-9999" },
    en: { divider_quote: "Taste that reaches the heart.", title: "Preparing for", title_accent: "tomorrow", body: "Rooted in Mongolian heritage, we continue to grow with purpose.", location: "Ulaanbaatar, Mongolia", email: "Info@uguumjarkhad.mn", phone: "7270-9999" },
  },
  reba: {
    mn: { eyebrow: "Нэрийн дэлгүүр", intro: "Өгөөмж Архад ХХК-ийн нэрийн дэлгүүр, Reba Vintage Cafe.", address: "Нарны гүүрний баруун талд", phone: "7270-9999", email: "Info@uguumjarkhad.mn", coming: "Мэдээлэл удахгүй нэмэгдэнэ." },
    en: { eyebrow: "Brand store", intro: "The brand store and Reba Vintage Cafe by Uguumj Arkhad LLC.", address: "West side of Narnii bridge", phone: "7270-9999", email: "Info@uguumjarkhad.mn", coming: "More information coming soon." },
  },
};

const PRODUCT_DEFAULTS = [
  { slug: "bity-seed", name_mn: "Bity Seed", name_en: "Bity Seed", category: "Жигнэмэг", description_mn: "Үр, овьёос, гүнжидийн үртэй жигнэмэг.", image_url: "/assets/products-pastry-DzYn-Waa.jpg", featured: true, published: true },
  { slug: "bity-fit", name_mn: "Bity Fit", name_en: "Bity Fit", category: "Жигнэмэг", description_mn: "Өдөр тутмын амтлах мөчид зориулсан сонголт.", image_url: "/assets/products-texture-Def4-lGY.jpg", featured: true, published: true },
  { slug: "shar-tost", name_mn: "Шар тост", name_en: "Golden Toast", category: "Талх", description_mn: "Өглөөний цай болон өдөр тутмын хэрэглээнд тохиромжтой талх.", image_url: "/assets/products-bread-827gvz_9.jpg", featured: true, published: true },
];

function getDb(): D1Database {
  if (!runtime.DB) throw new Error("D1 binding DB is unavailable");
  return runtime.DB;
}

async function ensureSchema() {
  const db = getDb();
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS cms_records (id TEXT PRIMARY KEY, entity TEXT NOT NULL, slug TEXT, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sort_order INTEGER DEFAULT 0, published INTEGER DEFAULT 1)"),
    db.prepare("CREATE INDEX IF NOT EXISTS cms_records_entity_idx ON cms_records(entity, sort_order, updated_at)"),
    db.prepare("CREATE TABLE IF NOT EXISTS cms_content (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS cms_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admin_users (email TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at TEXT NOT NULL)"),
  ]);
}

async function seedDefaults() {
  const db = getDb();
  const marker = await db.prepare("SELECT value FROM cms_settings WHERE key = 'seed_version'").first<{ value: string }>();
  if (marker) return;
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db.prepare("INSERT OR IGNORE INTO cms_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("company_name", JSON.stringify("Өгөөмж Архад ХХК"), now),
    db.prepare("INSERT OR IGNORE INTO cms_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("phone", JSON.stringify("7270-9999"), now),
    db.prepare("INSERT OR IGNORE INTO cms_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("email", JSON.stringify("Info@uguumjarkhad.mn"), now),
    db.prepare("INSERT OR IGNORE INTO cms_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("address_mn", JSON.stringify("Улаанбаатар хот, Монгол Улс"), now),
    db.prepare("INSERT OR IGNORE INTO cms_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("address_en", JSON.stringify("Ulaanbaatar, Mongolia"), now),
    db.prepare("INSERT OR IGNORE INTO cms_settings (key, value, updated_at) VALUES (?, ?, ?)").bind("seed_version", JSON.stringify("1"), now),
  ];
  for (const [key, value] of Object.entries(CONTENT_DEFAULTS)) {
    statements.push(db.prepare("INSERT OR IGNORE INTO cms_content (key, data, updated_at) VALUES (?, ?, ?)").bind(key, JSON.stringify(value), now));
  }
  for (const product of PRODUCT_DEFAULTS) {
    statements.push(db.prepare("INSERT OR IGNORE INTO cms_records (id, entity, slug, data, created_at, updated_at, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), "products", product.slug, JSON.stringify(product), now, now, 0, 1));
  }
  await db.batch(statements);
}

async function prepare() {
  await ensureSchema();
  await seedDefaults();
}

function response(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}

function error(message: string, status = 400) {
  return response({ error: message }, status);
}

async function bodyJson(request: Request): Promise<Record<string, any>> {
  try { return (await request.json()) as Record<string, any>; } catch { return {}; }
}

async function hash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function currentAdmin(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const row = await getDb().prepare("SELECT email, expires_at FROM admin_sessions WHERE token_hash = ?").bind(await hash(token)).first<{ email: string; expires_at: string }>();
  if (!row || new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row.email;
}

async function requireAdmin(request: Request) {
  const email = await currentAdmin(request);
  return email ? null : error("Admin authentication required", 401);
}

function record(row: any) {
  let data: Record<string, any> = {};
  try { data = JSON.parse(row.data); } catch { /* keep empty */ }
  return { ...data, id: row.id, slug: row.slug ?? data.slug ?? null, created_at: row.created_at, updated_at: row.updated_at, published: Boolean(row.published) };
}

async function listRecords(entity: string, searchParams: URLSearchParams, includeUnpublished: boolean) {
  const rows = await getDb().prepare("SELECT * FROM cms_records WHERE entity = ? ORDER BY sort_order ASC, updated_at DESC").bind(entity).all();
  let items = (rows.results ?? []).map(record);
  if (!includeUnpublished) items = items.filter((item) => item.published !== false);
  const featured = searchParams.get("featured");
  if (featured === "true") items = items.filter((item) => item.featured === true || item.featured === "true");
  const query = (searchParams.get("search") ?? "").toLowerCase().trim();
  if (query) items = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
  return items;
}

async function getRecord(entity: string, idOrSlug: string) {
  const row = await getDb().prepare("SELECT * FROM cms_records WHERE entity = ? AND (id = ? OR slug = ?) LIMIT 1").bind(entity, idOrSlug, idOrSlug).first();
  return row ? record(row) : null;
}

async function saveRecord(entity: string, id: string | null, payload: Record<string, any>) {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = id ? await db.prepare("SELECT * FROM cms_records WHERE entity = ? AND id = ?").bind(entity, id).first() : null;
  const finalId = id ?? crypto.randomUUID();
  const existingData = existing ? record(existing) : {};
  const merged = { ...existingData, ...payload, id: undefined, created_at: undefined, updated_at: undefined };
  delete merged.id; delete merged.created_at; delete merged.updated_at;
  const slug = String(merged.slug ?? existing?.slug ?? finalId);
  const published = merged.published === false ? 0 : 1;
  const sortOrder = Number(merged.sort_order ?? 0);
  if (existing) {
    await db.prepare("UPDATE cms_records SET slug = ?, data = ?, updated_at = ?, sort_order = ?, published = ? WHERE entity = ? AND id = ?").bind(slug, JSON.stringify(merged), now, sortOrder, published, entity, finalId).run();
  } else {
    await db.prepare("INSERT INTO cms_records (id, entity, slug, data, created_at, updated_at, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(finalId, entity, slug, JSON.stringify(merged), now, now, sortOrder, published).run();
  }
  return getRecord(entity, finalId);
}

function entityFromPath(parts: string[]) {
  return parts[0] ?? "";
}

async function handleAuth(parts: string[], request: Request) {
  const action = parts[2] ?? "";
  if (action === "login" && request.method === "POST") {
    const { email, password } = await bodyJson(request);
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const user = await getDb().prepare("SELECT * FROM admin_users WHERE email = ?").bind(normalizedEmail).first<{ email: string; password_hash: string }>();
    if (!user) {
      if (normalizedEmail !== DEFAULT_ADMIN_EMAIL || password !== DEFAULT_ADMIN_PASSWORD) return error("Имэйл эсвэл нууц үг буруу байна.", 401);
      const now = new Date().toISOString();
      await getDb().prepare("INSERT INTO admin_users (email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)").bind(normalizedEmail, await hash(DEFAULT_ADMIN_PASSWORD), now, now).run();
    } else if ((await hash(String(password ?? ""))) !== user.password_hash) return error("Имэйл эсвэл нууц үг буруу байна.", 401);
    const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    await getDb().prepare("INSERT INTO admin_sessions (token_hash, email, expires_at) VALUES (?, ?, ?)").bind(await hash(token), normalizedEmail, expires).run();
    return response({ token, user: { email: normalizedEmail } });
  }
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (action === "me" && request.method === "GET") return response({ user: { email: await currentAdmin(request) } });
  if (action === "change-password" && request.method === "POST") {
    const { currentPassword, newPassword } = await bodyJson(request);
    const email = await currentAdmin(request);
    const user = await getDb().prepare("SELECT password_hash FROM admin_users WHERE email = ?").bind(email).first<{ password_hash: string }>();
    if (!user || (await hash(String(currentPassword ?? ""))) !== user.password_hash) return error("Одоогийн нууц үг буруу байна.", 400);
    if (String(newPassword ?? "").length < 8) return error("Шинэ нууц үг дор хаяж 8 тэмдэгттэй байна.", 400);
    await getDb().prepare("UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE email = ?").bind(await hash(String(newPassword)), new Date().toISOString(), email).run();
    return response({ ok: true });
  }
  return error("Auth endpoint not found", 404);
}

async function handleStorage(parts: string[], request: Request) {
  if (!runtime.BUCKET) return error("R2 storage is not configured", 503);
  if (parts[1] === "uploads" && parts[2] === "request-url" && request.method === "POST") {
    const denied = await requireAdmin(request); if (denied) return denied;
    const { name, contentType } = await bodyJson(request);
    const safeName = String(name ?? "upload").replace(/[^a-zA-Z0-9._-]/g, "-");
    const key = `uploads/${crypto.randomUUID()}-${safeName}`;
    const uploadURL = new URL(`/api/storage/upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(String(contentType ?? "application/octet-stream"))}`, request.url).toString();
    return response({ uploadURL, objectPath: `/objects/${key}` });
  }
  if (parts[1] === "upload" && request.method === "PUT") {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return error("Missing upload key");
    await runtime.BUCKET.put(key, request.body, { httpMetadata: { contentType: new URL(request.url).searchParams.get("contentType") ?? "application/octet-stream" } });
    return response({ ok: true });
  }
  if (parts[1] === "objects" && request.method === "GET") {
    const key = parts.slice(2).join("/");
    const object = await runtime.BUCKET.get(key);
    if (!object) return error("File not found", 404);
    return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable", ETag: object.httpEtag } });
  }
  return error("Storage endpoint not found", 404);
}

async function handleRequest(request: Request, rawParts: string[]) {
  await prepare();
  const parts = rawParts.filter(Boolean);
  if (parts[0] === "storage") return handleStorage(parts, request);
  if (parts[0] === "admin" && parts[1] === "auth") return handleAuth(parts, request);
  if (parts[0] === "admin") {
    const denied = await requireAdmin(request); if (denied) return denied;
  }
  const admin = parts[0] === "admin";
  const cleanParts = admin ? parts.slice(1) : parts;
  const entity = entityFromPath(cleanParts);
  const id = cleanParts[1] && !cleanParts[1].includes("?") ? cleanParts[1] : null;
  const query = new URL(request.url).searchParams;

  if (entity === "content") {
    if (request.method === "GET" && !id) {
      const rows = await getDb().prepare("SELECT key, data FROM cms_content ORDER BY key").all();
      return response((rows.results ?? []).map((row: any) => ({ key: row.key, content: JSON.parse(row.data) })));
    }
    if (request.method === "GET" && id) {
      const row = await getDb().prepare("SELECT data FROM cms_content WHERE key = ?").bind(id).first<{ data: string }>();
      return response({ content: row ? JSON.parse(row.data) : CONTENT_DEFAULTS[id] ?? { mn: {}, en: {} } });
    }
    if (admin && request.method === "PUT" && id) {
      const payload = await bodyJson(request);
      const content = payload.content ?? payload;
      await getDb().prepare("INSERT INTO cms_content (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").bind(id, JSON.stringify(content), new Date().toISOString()).run();
      return response({ key: id, content });
    }
  }

  if (entity === "site-settings") {
    const rows = await getDb().prepare("SELECT key, value FROM cms_settings WHERE key != 'seed_version' ORDER BY key").all();
    const values = Object.fromEntries((rows.results ?? []).map((row: any) => [row.key, JSON.parse(row.value)]));
    return response(values);
  }
  if (admin && entity === "settings") {
    if (request.method === "GET") {
      const rows = await getDb().prepare("SELECT key, value FROM cms_settings WHERE key != 'seed_version' ORDER BY key").all();
      return response(Object.fromEntries((rows.results ?? []).map((row: any) => [row.key, JSON.parse(row.value)])));
    }
    if (request.method === "PATCH") {
      const payload = await bodyJson(request); const now = new Date().toISOString();
      await getDb().batch(Object.entries(payload).map(([key, value]) => getDb().prepare("INSERT INTO cms_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind(key, JSON.stringify(value), now)));
      return response(payload);
    }
  }

  if (entity === "storage" && admin) return response([]);
  if (request.method === "GET") {
    if (id) {
      const item = await getRecord(entity, id);
      return item ? response(item) : error("Not found", 404);
    }
    return response(await listRecords(entity, query, admin));
  }
  if (admin && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
    if (cleanParts[2] === "duplicate" && id) {
      const source = await getRecord(entity, id); if (!source) return error("Not found", 404);
      const copy = { ...source, slug: `${source.slug ?? id}-copy`, name_mn: source.name_mn ? `${source.name_mn} (хуулбар)` : undefined };
      delete copy.id; return response(await saveRecord(entity, null, copy), 201);
    }
    const payload = await bodyJson(request);
    return response(await saveRecord(entity, id, payload), id ? 200 : 201);
  }
  if (admin && request.method === "DELETE" && id) {
    const item = await getRecord(entity, id);
    await getDb().prepare("DELETE FROM cms_records WHERE entity = ? AND id = ?").bind(entity, id).run();
    if (entity === "media" && item?.objectPath?.startsWith("/objects/") && runtime.BUCKET) await runtime.BUCKET.delete(item.objectPath.slice("/objects/".length));
    return response({ ok: true });
  }
  if (!admin && request.method === "POST" && entity === "contact-messages") return response(await saveRecord(entity, null, await bodyJson(request)), 201);
  if (!admin && request.method === "POST" && entity === "wholesale-requests") return response(await saveRecord(entity, null, await bodyJson(request)), 201);
  if (!admin && entity === "careers" && id && cleanParts[2] === "apply" && request.method === "POST") {
    const form = await request.formData(); const data: Record<string, any> = { career_id: id };
    for (const [key, value] of form.entries()) data[key] = typeof value === "string" ? value : value.name;
    return response(await saveRecord("applications", null, data), 201);
  }
  return error("Endpoint not found", 404);
}

export async function GET(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  try { return await handleRequest(request, (await context.params).path ?? []); } catch (cause) { console.error(cause); return error("Server error", 500); }
}

export async function POST(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  try { return await handleRequest(request, (await context.params).path ?? []); } catch (cause) { console.error(cause); return error("Server error", 500); }
}

export async function PUT(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  try { return await handleRequest(request, (await context.params).path ?? []); } catch (cause) { console.error(cause); return error("Server error", 500); }
}

export async function PATCH(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  try { return await handleRequest(request, (await context.params).path ?? []); } catch (cause) { console.error(cause); return error("Server error", 500); }
}

export async function DELETE(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  try { return await handleRequest(request, (await context.params).path ?? []); } catch (cause) { console.error(cause); return error("Server error", 500); }
}
