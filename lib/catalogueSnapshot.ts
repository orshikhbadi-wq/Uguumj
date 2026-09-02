import snapshot from "../data/catalogue-snapshot.json";
import catalogueImages from "../data/catalogue-images.json";
import type { ProductVariant, OrderSettings } from "./storeOrdering";
import type { StoreProduct } from "./googleSheetsStore";

type SourceRecord = Record<string, unknown>;
const text = (value: unknown) => value == null ? "" : String(value);
const number = (value: unknown) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
const active = (row: SourceRecord) => !row.status || text(row.status).toLowerCase() === "active";

export function readCatalogueSnapshot() {
  const categories = snapshot.categories.filter(active).map((row: SourceRecord) => ({
    id: text(row.category_id), nameMn: text(row.name_mn), nameEn: text(row.name_en), sortOrder: number(row.sort_order) ?? 0,
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const variants: ProductVariant[] = snapshot.variants.map((row: SourceRecord) => ({
    variant_id:text(row.variant_id),product_id:text(row.product_id),sku:text(row.sku),variant_name_mn:text(row.variant_name_mn),
    order_unit_type:text(row.order_unit_type) as ProductVariant['order_unit_type'],order_unit_label_mn:text(row.order_unit_label_mn),package_type_mn:text(row.package_type_mn),
    units_per_order_unit:number(row.units_per_order_unit),weight:text(row.weight),weight_unit:text(row.weight_unit),
    price:number(row.price),sale_price:number(row.sale_price),stock_quantity:number(row.stock_quantity),stock_unit:text(row.stock_unit),status:text(row.status),notes:text(row.notes),
  }));
  const rawSettings=Object.fromEntries(snapshot.settings.map(row=>[row.setting_key,row.setting_value]));
  const settings:OrderSettings={minimum_order_amount:Number(rawSettings.minimum_order_amount),minimum_order_operator:text(rawSettings.minimum_order_operator),minimum_order_scope:text(rawSettings.minimum_order_scope)};
  const products: StoreProduct[] = snapshot.products.filter(active).map((row: SourceRecord) => {
    const category = categories.find((item) => item.id === row.category_id);
    return {
      variants:variants.filter(v=>v.product_id===row.product_id && v.status==="ACTIVE"),
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
  return { products, categories, settings, source: "google-sheets-snapshot", capturedAt: snapshot.capturedAt, orderingEnabled: false };
}
