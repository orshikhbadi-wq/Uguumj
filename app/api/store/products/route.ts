import { googleSheetsConfigured, readStoreProducts } from "../../../../lib/googleSheetsStore";

export async function GET() {
  if (!googleSheetsConfigured()) {
    return Response.json({ products: [], error: "Store data is temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const products = await readStoreProducts();
    return Response.json({ products: products ?? [], source: "google-sheets" });
  } catch (error) {
    void error;
    return Response.json({ products: [], source: "google-sheets-error", error: "Store data is temporarily unavailable" }, { status: 503 });
  }
}
