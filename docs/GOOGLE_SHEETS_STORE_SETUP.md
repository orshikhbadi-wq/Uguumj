# Prototype catalogue: Google Sheets snapshot

The master is the existing **Uguumj Online Store Database**, spreadsheet ID `1aSXR7LSSiw-grl9ALPXhsX8DWLMUaNPKgNn6hrpxY_E`.

The prototype imports only `01_Products` and `02_Categories` into `data/catalogue-snapshot.json`. It contains 23 source records and five categories. The original values, multiple codes/weights, image URLs, captured timestamp, and workbook SHA-256 are retained. No customer, order, payment, or inventory history is copied into the public catalogue.

`/store` and `/api/store/products` read this snapshot server-side. No Google Cloud project, API key, service account, or runtime credential is required. The snapshot is a dated copy, not live synchronization. To refresh it, export the same workbook, run `python scripts/import-catalogue-snapshot.py PATH_TO_EXPORT.xlsx`, validate, build, and publish through Sites. Never replace it with invented products.

## Unapproved commercial data

The exported workbook contains numeric prices and stock quantities even though the user explicitly says official commercial data is not approved yet. Those original values are preserved. At the user’s request, the prototype now displays these exact numeric values despite their unapproved status. The prototype now allows local cart interaction when the source price and stock are positive; `commercialDataApproved: false` still documents that those values are unapproved. Checkout remains disabled server-side. Variant selectors are informational: no per-variant prices or inventory are invented, and unequal SKU/weight counts remain unpaired. Missing values retain the pending labels. Product photos are bundled in `public/store-products`, mapped by product ID in `data/catalogue-images.json`; the original source URLs remain in the untouched snapshot. The prototype order endpoint always rejects ordering; it cannot write orders or report payment success.

## Later production phase

The existing Google API adapter is retained for future work but is not imported by either active prototype store API route. Only after prototype approval should authenticated runtime access, real order writes, inventory concurrency, schema validation, and payments be integrated. Do not request server credentials as a prerequisite for this prototype.
