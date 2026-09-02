# Prototype store snapshot

Master: Uguumj Online Store Database, spreadsheet `1aSXR7LSSiw-grl9ALPXhsX8DWLMUaNPKgNn6hrpxY_E`.

The server imports 23 products, five categories, 35 variants and the three minimum-order settings. Product photos are bundled in `public/store-products`; the original URLs and exact raw source values remain in `data/catalogue-snapshot.json`. Only catalogue data and public minimum-order settings are copied. Refresh with `python scripts/import-catalogue-snapshot.py PATH_TO_EXPORT.xlsx`, then validate and publish through Sites. This is a dated snapshot, not automatic runtime Sheets synchronization. No Google Cloud or service credentials are required.

`01_Product_Variants` exclusively owns SKU, size, price, sale price, sellable stock, ordering unit and package counts. Product-level prices never substitute missing variant prices. All 35 imported variant prices and stock quantities are currently blank, so selection remains available but Add to Cart is disabled. Multiple variants require explicit selection. A single variant is selected automatically.

Cart v2 uses variant IDs and preserves product/variant IDs, SKU, variant name, unit and packaging fields, quantity and unit price. Old product-only carts are not migrated because they cannot establish a selected variant. Saved prices and metadata are resolved again against the current snapshot. Package stock and quantities count packages; piece totals multiply quantity by the source units_per_order_unit when specified.

`08_Settings` supplies minimum_order_amount, minimum_order_operator and minimum_order_scope. The current rule is product subtotal strictly greater than 150000 MNT; delivery never contributes. The shared validator recalculates trusted variant prices, checks ACTIVE status, integer quantities, duplicate-line aggregated stock and the minimum. The prototype order API invokes this validation and still refuses all real order writes. No order, inventory or payment success is fabricated.

Future order items should use the validated CartLine variant and package metadata. Inventory must use variant_id and the source stock_unit/package_type_mn, decrementing sellable order units. Live Google access, actual writes and payment integration remain a separate production phase.
