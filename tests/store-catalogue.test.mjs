import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

// Synthetic API fixtures only: never used by the deployed catalogue.
test('Sheets rows preserve missing commercial values and multiline product information', async () => {
  let source = await readFile(new URL('../lib/googleSheetsStore.ts', import.meta.url), 'utf8');
  source = source.replace('import { env } from "cloudflare:workers";', `const env = {GOOGLE_SHEET_ID:'test-sheet',GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify({client_email:'test@example.invalid',private_key:'test-only'})};`);
  const start = source.indexOf('async function accessToken()');
  const end = source.indexOf('function spreadsheetId()', start);
  source = source.slice(0, start) + 'async function accessToken(){ return "test-only"; }\n' + source.slice(end);
  const adapter = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source, {mode:'transform'})).toString('base64')}`);
  const originalFetch = globalThis.fetch;
  let approved = false;
  globalThis.fetch = async (url) => {
    const range = decodeURIComponent(String(url));
    if (range.includes('01_Products')) return Response.json({values:[
      ['product_id','sku','name_mn','name_en','category_id','price','stock_quantity','status','weight','usage_mn','ingredients_mn','characteristics_mn','image_url'],
      ['TEST-1','CODE-1\nCODE-2','Туршилт','Test','CAT',approved ? 5000 : '', approved ? 8 : '', 'active','1 кг\n0.5 кг','Usage','Ingredients','Characteristics','https://example.invalid/product.jpg'],
    ]});
    if (range.includes('02_Categories')) return Response.json({values:[['category_id','name_mn','name_en','status','sort_order'],['CAT','Ангилал','Category','active',2],['EMPTY','Хоосон','Empty','active',1],['HIDDEN','Нууц','Hidden','inactive',0]]});
    throw new Error('Unexpected request');
  };
  try {
    const products = await adapter.readStoreProducts();
    assert.equal(products.length, 1);
    const product = products[0];
    assert.equal(product.price, null);
    assert.equal(product.stockQuantity, null);
    assert.equal(product.sku, 'CODE-1\nCODE-2');
    assert.equal(product.weight, '1 кг\n0.5 кг');
    assert.equal(product.usageMn, 'Usage');
    assert.equal(product.ingredientsMn, 'Ingredients');
    assert.equal(product.characteristicsMn, 'Characteristics');
    assert.equal(product.imageUrl, 'https://example.invalid/product.jpg');
    assert.deepEqual((await adapter.readStoreCategories()).map(x=>x.id), ['EMPTY','CAT']);
    approved = true;
    const refreshed = (await adapter.readStoreProducts())[0];
    assert.equal(refreshed.price, 5000);
    assert.equal(refreshed.stockQuantity, 8);
  } finally { globalThis.fetch = originalFetch; }
});
