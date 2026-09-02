import { readCatalogueSnapshot } from "../../../../lib/catalogueSnapshot";

export async function GET() {
  return Response.json(readCatalogueSnapshot(), { headers: { "Cache-Control": "no-store" } });
}
