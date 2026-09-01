# Uguumj online store — Google Sheets connection

The `/wholesale` page is the Uguumj online store. The store API is ready to use the existing Google Sheet:

- Spreadsheet: `Uguumj Online Store Database`
- Default spreadsheet ID: `1aSXR7LSSiw-grl9ALPXhsX8DWLMUaNPKgNn6hrpxY_E`
- Product source: `01_Products` and `02_Categories`
- Checkout writes: `03_Customers`, `04_Orders`, `05_Order_Items`, `06_Inventory`, `07_Payments`

## Production connection

1. In the Google Cloud project used for the website, enable the **Google Sheets API**.
2. Create a dedicated service account for the store backend. Do not use a personal Google account credential.
3. Share `Uguumj Online Store Database` with the service account email as **Editor**. Do not make the sheet public.
4. Add the complete service-account JSON as the hosting secret `GOOGLE_SERVICE_ACCOUNT_JSON`.
5. `GOOGLE_SHEET_ID` is optional. If omitted, the code uses the spreadsheet ID above.
6. Redeploy the site and open `/wholesale`. The data-source label should change from `Prototype data` to `Google Sheets database`.

Never commit the service-account JSON to GitHub. The credential belongs only in the hosting secret manager.

## Security behavior

Checkout never trusts price, product name, SKU, or totals supplied by the browser. The server re-reads the product row from Google Sheets, validates current stock, calculates the trusted price/total, and then writes the order.

Order creation uses one Google Sheets `spreadsheets.batchUpdate` request to update product stock and append customer, order-item, inventory, order, and payment rows together. Cell values are written as typed values instead of formulas, which prevents spreadsheet-formula injection from customer text.

The Sheets version is intended for prototype/early sales volume. Google Sheets does not provide database-grade row locking for simultaneous checkout requests. The planned migration to Cloud SQL PostgreSQL should happen before high-concurrency production sales.

The application never stores card numbers, CVV, PINs, online-banking passwords, or similar payment credentials. `07_Payments` stores only order/payment-provider references, amount, currency, and status.
