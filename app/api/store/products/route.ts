import { googleSheetsConfigured, PROTOTYPE_PRODUCTS, readStoreProducts } from "../../../../lib/googleSheetsStore";

export async function GET() {
  if (!googleSheetsConfigured()) {
    return Response.json({ products: PROTOTYPE_PRODUCTS, source: "prototype" });
  }

  try {
    const products = await readStoreProducts();
    return Response.json({ products: products ?? [], source: "google-sheets" });
  } catch (error) {
    console.error("store products", error);
    return Response.json({ products: [], source: "google-sheets-error", error: "Store data is temporarily unavailable" }, { status: 503 });
  }
}
