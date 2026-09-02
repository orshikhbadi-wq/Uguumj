import snapshot from "../data/catalogue-snapshot.json";
import catalogueImages from "../data/catalogue-images.json";
import type { StoreProduct } from "./googleSheetsStore";

type SourceRecord = Record<string, unknown>;
const text = (value: unknown) => value == null ? "" : String(value);
const number = (value: unknown) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
const active = (row: SourceRecord) => !row.status || text(row.status).toLowerCase() === "active";

export function readCatalogueSnapshot() {
  const categories = snapshot.categories.filter(active).map((row: SourceRecord) => ({
    id: text(row.category_id), nameMn: text(row.name_mn), nameEn: text(row.name_en), sortOrder: number(row.sort_order) ?? 0,
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const products: StoreProduct[] = snapshot.products.filter(active).map((row: SourceRecord) => {
    const category = categories.find((item) => item.id === row.category_id);
    return {
      id: text(row.product_id), sku: text(row.sku), nameMn: text(row.name_mn), nameEn: text(row.name_en),
      categoryId: text(row.category_id), categoryNameMn: category?.nameMn, categoryNameEn: category?.nameEn,
      descriptionMn: text(row.description_mn), descriptionEn: text(row.description_en),
      shortDescriptionMn: text(row.short_description_mn), shortDescriptionEn: text(row.short_description_en),
      price: number(row.price), salePrice: number(row.sale_price), stockQuantity: number(row.stock_quantity),
      commercialDataApproved: snapshot.commercialDataApproved,
      status: text(row.status), featured: ["true", "1", "yes"].includes(text(row.featured).toLowerCase()),
      imageUrl: (catalogueImages as Record<string, string>)[text(row.product_id)] || "", weight: text(row.weight), unit: text(row.unit),
      usageMn: text(row.usage_mn), usageEn: text(row.usage_en),
      ingredientsMn: text(row.ingredients_mn), ingredientsEn: text(row.ingredients_en),
      characteristicsMn: text(row.characteristics_mn), characteristicsEn: text(row.characteristics_en),
      allergensMn: text(row.allergens_mn), allergensEn: text(row.allergens_en),
      nutritionMn: text(row.nutrition_mn), nutritionEn: text(row.nutrition_en),
      storageMn: text(row.storage_mn), storageEn: text(row.storage_en),
      packageMn: text(row.package_mn), packageEn: text(row.package_en),
    };
  });
  return { products, categories, source: "google-sheets-snapshot", capturedAt: snapshot.capturedAt, orderingEnabled: false };
}
