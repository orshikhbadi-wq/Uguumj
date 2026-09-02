# Uguumj prototype store — server configuration

Canonical route: `/store`. `/wholesale` redirects to `/store`, preserving cart or checkout view.

The only permitted store database is the existing `Uguumj Online Store Database`.
No spreadsheet is created by this application. No sample catalogue or successful demo checkout fallback exists.

## Required hosting configuration

- `GOOGLE_SHEET_ID`: required environment variable containing the ID of the existing spreadsheet. Confirm it against the actual connected document; no default ID is assumed.
- `GOOGLE_SERVICE_ACCOUNT_JSON`: required secret containing the service account JSON with `client_email` and `private_key`.

Use the Sites server-side secret/environment configuration, never source files, frontend variables, or Git.
Share only the existing spreadsheet with the dedicated service account as Editor. Do not make it public or grant broad Drive access. Enable Google Sheets API for the service account project. The application requests only the spreadsheets OAuth scope.

No real credentials are supplied in this repository. A ChatGPT Google Drive connection does not by itself configure the website's runtime credentials.

## Verification before opening checkout

The current deployment can show the store interface without credentials. Its catalogue and checkout APIs return controlled errors until both values are configured. This is not evidence that the database is connected.

After configuration, verify the actual headers and column mapping against all eight tabs, read products/categories/settings, and run one clearly identified test order. Confirm customer, order, order items, inventory movements, payment, and stock directly in Sheets. Do not claim that test has happened without those checks.

The current adapter must still be reconciled with the real sheet schema before enabling sales. In particular its legacy write column order needs checking, settings need wiring, customer matching needs verification, and simultaneous checkouts require serialization to avoid lost stock updates. A single Sheets batch write is not a lock around the preceding stock read. This prototype is not ready for customer sales merely because its interface is published.

## Security

Google credentials are used only in `lib/googleSheetsStore.ts`, imported by server API routes. They are not returned to clients. Order writes use typed string cells for customer text rather than formula values. Checkout prices are read server-side; connection failures never generate an order number or success confirmation. QPay is not configured and no payment is marked paid.

## Optional product detail columns

The product reader supports `short_description_mn/en`, `description_mn/en`, `ingredients_mn/en`, `allergens_mn/en`, `nutrition_mn/en`, `storage_mn/en`, `package_mn/en`, and `weight`. Add the actual values to the existing product tab after access is configured. No fields or rows have been remotely added as part of this change. Empty accordion sections are hidden.

Product columns are read by header name through AZ. Stock writes locate `stock_quantity` by header rather than column position. Order item writes locate all eight required fields by header and abort before writing if those fields are missing. Selected quantities and unit-price snapshots are preserved.
