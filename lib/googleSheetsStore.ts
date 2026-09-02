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
  commercialDataApproved?: boolean;
  price: number | null;
  salePrice?: number | null;
  stockQuantity: number | null;
  status: string;
  featured: boolean;
  imageUrl: string;
  imageUrls?: string[];
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
  usageMn?: string;
  usageEn?: string;
  characteristicsMn?: string;
  characteristicsEn?: string;
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

function optionalNumber(value: unknown): number | null {
  if (value == null || String(value).trim() === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  return ["true", "yes", "1", "on"].includes(text(value).toLowerCase());
}

function effectivePrice(product: StoreProduct) {
  if ((product.price ?? 0) <= 0) return 0;
  return product.salePrice && product.salePrice > 0 ? product.salePrice : (product.price ?? 0);
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
      price: optionalNumber(item.price),
      salePrice: salePriceRaw ? num(item.sale_price) : null,
      stockQuantity: optionalNumber(item.stock_quantity),
      status: text(item.status) || "active",
      featured: bool(item.featured),
      imageUrl: text(item.image_url),
      shortDescriptionMn: text(item.short_description_mn),
      shortDescriptionEn: text(item.short_description_en),
      ingredientsMn: text(item.ingredients_mn),
      ingredientsEn: text(item.ingredients_en),
      allergensMn: text(item.allergens_mn),
      allergensEn: text(item.allergens_en),
      nutritionMn: text(item.nutrition_mn),
      nutritionEn: text(item.nutrition_en),
      storageMn: text(item.storage_mn),
      storageEn: text(item.storage_en),
      packageMn: text(item.package_mn),
      packageEn: text(item.package_en),
      usageMn: text(item.usage_mn),
      usageEn: text(item.usage_en),
      characteristicsMn: text(item.characteristics_mn),
      characteristicsEn: text(item.characteristics_en),
      weight: text(item.weight),
      unit: text(item.unit),
    };
    return { product, sheetRowIndex: index + 1, stockColumnIndex: headers.indexOf("stock_quantity") } satisfies ProductRecord;
  }).filter((record): record is ProductRecord => record !== null);
}

export async function readStoreCategories() {
  const rows = await readValues("'02_Categories'!A1:Z1000");
  const headers = rows[0] || [];
  return rows.slice(1).map((row) => {
    const item = rowRecord(headers, row);
    return { id: text(item.category_id), nameMn: text(item.name_mn), nameEn: text(item.name_en), status: text(item.status).toLowerCase(), sortOrder: num(item.sort_order) };
  }).filter((item) => item.id && (!item.status || item.status === "active")).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function readStoreProducts(): Promise<StoreProduct[] | null> {
  if (!googleSheetsConfigured()) return null;
  const records = await readProductRecords();
  return records.map((record) => record.product);
}

function compactId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function makeOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `UG-${date}-${suffix}`;
}

function extendedValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return { numberValue: value };
  if (typeof value === "boolean") return { boolValue: value };
  return { stringValue: value == null ? "" : String(value) };
}

function appendCells(sheetId: number, rows: unknown[][]) {
  return {
    appendCells: {
      sheetId,
      rows: rows.map((row) => ({ values: row.map((value) => ({ userEnteredValue: extendedValue(value) })) })),
      fields: "userEnteredValue",
    },
  };
}

async function storeSheetIds(): Promise<SheetIds> {
  if (sheetIdCache) return sheetIdCache;
  const response = await sheetsRequest("?fields=sheets.properties(sheetId,title)");
  const payload = await response.json() as { sheets?: Array<{ properties?: { sheetId?: number; title?: string } }> };
  const found = new Map<string, number>();
  for (const sheet of payload.sheets ?? []) {
    if (sheet.properties?.title && typeof sheet.properties.sheetId === "number") found.set(sheet.properties.title, sheet.properties.sheetId);
  }
  const required = ["01_Products", "03_Customers", "04_Orders", "05_Order_Items", "06_Inventory", "07_Payments"] as const;
  for (const title of required) if (!found.has(title)) throw new Error(`Required Google Sheet tab is missing: ${title}`);
  sheetIdCache = Object.fromEntries(required.map((title) => [title, found.get(title)!])) as SheetIds;
  return sheetIdCache;
}

export class StoreCheckoutError extends Error {
  constructor(message: string, public code: "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK" | "INVALID_PRICE", public availableStock?: number) {
    super(message);
    this.name = "StoreCheckoutError";
  }
}

export async function appendStoreOrder(input: StoreCheckoutInput) {
  if (!googleSheetsConfigured()) return null;

  const [records, ids, orderItemHeaders] = await Promise.all([readProductRecords(), storeSheetIds(), readValues("'05_Order_Items'!A1:AZ1")]);
  const itemHeaders = (orderItemHeaders[0] || []).map(text);
  for (const field of ["order_item_id", "order_id", "product_id", "sku", "product_name", "quantity", "unit_price", "line_total"]) {
    if (!itemHeaders.includes(field)) throw new Error("Order item schema is incomplete");
  }
  const productMap = new Map(records.map((record) => [record.product.id, record]));
  const requested = new Map<string, number>();
  for (const item of input.items) requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);

  const trustedItems = [...requested.entries()].map(([productId, quantity]) => {
    const record = productMap.get(productId);
    if (!record) throw new StoreCheckoutError("A product is no longer available", "PRODUCT_NOT_FOUND");
    if (record.stockColumnIndex < 0) throw new Error("Stock column missing");
    const price = effectivePrice(record.product);
    if (price <= 0) throw new StoreCheckoutError("A product does not have an orderable price", "INVALID_PRICE");
    if (quantity > (record.product.stockQuantity ?? 0)) throw new StoreCheckoutError("Requested quantity exceeds current stock", "OUT_OF_STOCK", record.product.stockQuantity ?? 0);
    return { record, quantity, unitPrice: price, stockAfter: (record.product.stockQuantity ?? 0) - quantity };
  });

  const now = new Date().toISOString();
  const customerId = compactId("CUS");
  const orderId = compactId("ORD");
  const paymentId = compactId("PAY");
  const number = makeOrderNumber();
  const subtotal = trustedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = Math.max(0, Number(input.deliveryFee || 0));
  const discount = Math.min(subtotal + deliveryFee, Math.max(0, Number(input.discount || 0)));
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const customerName = [input.customer.firstName, input.customer.lastName].filter(Boolean).join(" ").trim();

  const requests: Record<string, unknown>[] = trustedItems.map(({ record, stockAfter }) => ({
    updateCells: {
      range: {
        sheetId: ids["01_Products"],
        startRowIndex: record.sheetRowIndex,
        endRowIndex: record.sheetRowIndex + 1,
        startColumnIndex: record.stockColumnIndex,
        endColumnIndex: record.stockColumnIndex + 1,
      },
      rows: [{ values: [{ userEnteredValue: { numberValue: stockAfter } }] }],
      fields: "userEnteredValue",
    },
  }));

  requests.push(
    appendCells(ids["03_Customers"], [[
      customerId,
      input.customer.firstName,
      input.customer.lastName || "",
      input.customer.phone,
      input.customer.email || "",
      input.customer.cityDistrict,
      input.customer.deliveryAddress,
      now,
      now,
      "Online store checkout",
    ]]),
    appendCells(ids["04_Orders"], [[
      orderId,
      number,
      customerId,
      customerName,
      input.customer.phone,
      `${input.customer.cityDistrict} · ${input.customer.deliveryAddress}`,
      subtotal,
      deliveryFee,
      discount,
      total,
      input.paymentMethod,
      "PENDING",
      "NEW",
      input.deliveryMethod,
      now,
      now,
      input.notes || "",
    ]]),
    appendCells(ids["05_Order_Items"], trustedItems.map(({ record, quantity, unitPrice }) => {
      const values: Record<string, unknown> = {
        order_item_id: compactId("ORI"), order_id: orderId, product_id: record.product.id,
        sku: record.product.sku, product_name: record.product.nameMn || record.product.nameEn,
        quantity, unit_price: unitPrice, line_total: quantity * unitPrice,
      };
      return itemHeaders.map((header) => values[header] ?? "");
    })),
    appendCells(ids["06_Inventory"], trustedItems.map(({ record, quantity, stockAfter }) => [
      compactId("INV"),
      record.product.id,
      record.product.sku,
      "SALE",
      -quantity,
      stockAfter,
      "ORDER",
      orderId,
      now,
      `Online order ${number}`,
    ])),
    appendCells(ids["07_Payments"], [[
      paymentId,
      orderId,
      input.paymentMethod,
      "",
      total,
      "MNT",
      "PENDING",
      "",
      now,
      "Payment details are handled by the payment provider; never store card credentials here.",
    ]]),
  );

  await sheetsRequest(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests }),
  });

  return { orderId, orderNumber: number, customerId, subtotal, deliveryFee, discount, total, storage: "google-sheets" as const };
}
