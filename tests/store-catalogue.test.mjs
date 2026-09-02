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

test('unpriced product detail retains source fields and disables purchasing controls', async () => {
  const ts = await import('typescript');
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const source = await readFile(new URL('../app/store/ProductDetail.tsx', import.meta.url), 'utf8');
  let code = ts.transpileModule(source, {compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  code = code.replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replaceAll('"react"',JSON.stringify(import.meta.resolve('react')));
  const { default: ProductDetail } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const html = renderToStaticMarkup(React.createElement(ProductDetail, {
    product:{id:'test', nameMn:'Туршилт', nameEn:'Test', sku:'CODE-1\nCODE-2', weight:'1 кг\n0.5 кг', usageMn:'Usage', ingredientsMn:'Ingredients', characteristicsMn:'Characteristics', price:null, stockQuantity:null},
    lang:'mn',inCart:0,onClose(){},onAdd(){},
  }));
  for (const label of ['Бүтээгдэхүүний код:','Бүтээгдэхүүний жин:','Хэрэглээ:','БҮТЭЭГДЭХҮҮНИЙ ОРЦ','БҮТЭЭГДЭХҮҮНИЙ ОНЦЛОГ','Үнэ удахгүй','Нөөцийн мэдээлэл удахгүй']) assert.ok(html.includes(label), label);
  assert.equal((html.match(/<details(?: open="")?>/g)||[]).length, 3);
  assert.equal((html.match(/<details open="">/g)||[]).length, 1);
  assert.equal((html.match(/disabled=""/g)||[]).length, 4);
  assert.ok(html.includes('CODE-1')); assert.ok(html.includes('CODE-2'));
  assert.ok(html.includes('object-fit:contain'));
  const priced = renderToStaticMarkup(React.createElement(ProductDetail, {product:{id:'priced',nameMn:'Үнэтэй',sku:'SKU',weight:'1 кг',price:9455,salePrice:8469,stockQuantity:3,commercialDataApproved:false},lang:'mn',inCart:0,onClose(){},onAdd(){}}));
  assert.ok(priced.includes('8,469₮')); assert.ok(priced.includes('<del>9,455₮</del>'));
  assert.ok(priced.includes('max="3"'));
  assert.equal((priced.match(/disabled=""/g)||[]).length,1);
  const unequal = renderToStaticMarkup(React.createElement(ProductDetail, {product:{id:'variant',nameMn:'Variants',sku:'A; B; C; D',weight:'Small; Medium; Large',price:100,stockQuantity:2},lang:'mn',inCart:0,onClose(){},onAdd(){}}));
  assert.equal((unequal.match(/type="radio"/g)||[]).length,4);
  for(const weight of ['Small','Medium','Large']) assert.ok(unequal.includes(weight));
});
