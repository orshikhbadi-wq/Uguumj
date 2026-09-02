import { env } from "cloudflare:workers";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const runtime = env as unknown as {
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  GOOGLE_SHEET_ID?: string;
};

export type StoreProduct = {
  id: string;
  sku: string;
  nameMn: string;
  nameEn: string;
  categoryId: string;
  categoryNameMn?: string;
  categoryNameEn?: string;
  descriptionMn: string;
  descriptionEn: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  status: string;
  featured: boolean;
  imageUrl: string;
  shortDescriptionMn?: string;
  shortDescriptionEn?: string;
  ingredientsMn?: string;
  ingredientsEn?: string;
  allergensMn?: string;
  allergensEn?: string;
  nutritionMn?: string;
  nutritionEn?: string;
  storageMn?: string;
  storageEn?: string;
  packageMn?: string;
  packageEn?: string;
  weight: string;
  unit: string;
};

export type StoreCheckoutInput = {
  customer: {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    cityDistrict: string;
    deliveryAddress: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  deliveryFee?: number;
  discount?: number;
  paymentMethod: string;
  deliveryMethod: string;
  notes?: string;
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

type ProductRecord = {
  product: StoreProduct;
  sheetRowIndex: number;
  stockColumnIndex: number;
};

type SheetIds = Record<"01_Products" | "03_Customers" | "04_Orders" | "05_Order_Items" | "06_Inventory" | "07_Payments", number>;

let tokenCache: { value: string; expiresAt: number } | null = null;
let sheetIdCache: SheetIds | null = null;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function parsePrivateKey(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function serviceAccount(): ServiceAccount | null {
  const raw = runtime.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

export function googleSheetsConfigured() {
  return Boolean(serviceAccount() && runtime.GOOGLE_SHEET_ID?.trim());
}

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.value;

  const account = serviceAccount();
  if (!account) throw new Error("Google Sheets service account is not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = textToBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = textToBase64Url(JSON.stringify({
    iss: account.client_email,
    scope: SHEETS_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    parsePrivateKey(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const assertion = `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed (${response.status})`);
  const payload = await response.json() as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("Google OAuth returned no access token");

  tokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(300, payload.expires_in ?? 3600) * 1000,
  };
  return payload.access_token;
}

function spreadsheetId() {
  const id = runtime.GOOGLE_SHEET_ID?.trim();
  if (!id) throw new Error("Google Sheet ID is not configured");
  return id;
}

async function sheetsRequest(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google Sheets API failed (${response.status})${detail ? `: ${detail.slice(0, 220)}` : ""}`);
  }
  return response;
}

async function readValues(range: string) {
  const encodedRange = encodeURIComponent(range);
  const response = await sheetsRequest(`/values/${encodedRange}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);
  const payload = await response.json() as { values?: unknown[][] };
  return payload.values ?? [];
}

function rowRecord(headers: unknown[], row: unknown[]) {
  const record: Record<string, unknown> = {};
  headers.forEach((header, index) => {
    if (typeof header === "string") record[header] = row[index];
  });
  return record;
}

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function num(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  return ["true", "yes", "1", "on"].includes(text(value).toLowerCase());
}

function effectivePrice(product: StoreProduct) {
  return product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
}

async function readProductRecords() {
  const [productRows, categoryRows] = await Promise.all([
    readValues("'01_Products'!A1:AZ10000"),
    readValues("'02_Categories'!A1:H500"),
  ]);
  if (productRows.length < 2) return [] as ProductRecord[];

  const categoryMap = new Map<string, { mn: string; en: string }>();
  if (categoryRows.length > 1) {
    const categoryHeaders = categoryRows[0];
    for (const row of categoryRows.slice(1)) {
      const item = rowRecord(categoryHeaders, row);
      const id = text(item.category_id);
      if (!id || text(item.status).toLowerCase() === "archived") continue;
      categoryMap.set(id, { mn: text(item.name_mn), en: text(item.name_en) });
    }
  }

  const headers = productRows[0];
  return productRows.slice(1).map((row, index) => {
    const item = rowRecord(headers, row);
    const status = text(item.status).toLowerCase();
    if (!text(item.product_id) || (status && status !== "active")) return null;
    const categoryId = text(item.category_id);
    const category = categoryMap.get(categoryId);
    const salePriceRaw = text(item.sale_price);
    const product: StoreProduct = {
      id: text(item.product_id),
      sku: text(item.sku),
      nameMn: text(item.name_mn),
      nameEn: text(item.name_en),
      categoryId,
      categoryNameMn: category?.mn,
      categoryNameEn: category?.en,
      descriptionMn: text(item.description_mn),
      descriptionEn: text(item.description_en),
      price: num(item.price),
      salePrice: salePriceRaw ? num(item.sale_price) : null,
      stockQuantity: Math.max(0, num(item.stock_quantity)),
      status: text(item.status) || "active",
      featured: bool(item.featured),
      imageUrl: text(item.image_url),
      shortDescriptionMn: tex