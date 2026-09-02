import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
const snapshot = JSON.parse(await readFile(new URL('../data/catalogue-snapshot.json',import.meta.url),'utf8'));
const dataModule = code => `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(code,{mode:'transform'})).toString('base64')}`;
const adapterSource = (await readFile(new URL('../lib/catalogueSnapshot.ts',import.meta.url),'utf8')).replace('import snapshot from "../data/catalogue-snapshot.json";', `const snapshot = ${JSON.stringify(snapshot)};`);
const images = JSON.parse(await readFile(new URL('../data/catalogue-images.json',import.meta.url),'utf8'));
const adapterURL = dataModule(adapterSource.replace('import catalogueImages from "../data/catalogue-images.json";', `const catalogueImages = ${JSON.stringify(images)};`));
async function route(name) {
 const source = (await readFile(new URL(`../app/api/store/${name}/route.ts`,import.meta.url),'utf8')).replace('"../../../../lib/catalogueSnapshot"',JSON.stringify(adapterURL));
 return import(dataModule(source));
}
test('prototype returns all 23 exact source products without Google credentials', async () => {
 const {GET} = await route('products'); const response = await GET();
 assert.equal(response.status,200);
 const body = await response.json();
 assert.equal(body.products.length,23);assert.equal(body.categories.length,5);
 assert.equal(body.source,'google-sheets-snapshot');assert.equal(body.orderingEnabled,false);
 for(const product of body.products){
   const source = snapshot.products.find(x=>x.product_id===product.id);
   for(const [mapped,raw] of Object.entries({sku:'sku',nameMn:'name_mn',descriptionMn:'description_mn',weight:'weight',unit:'unit',usageMn:'usage_mn',ingredientsMn:'ingredients_mn',characteristicsMn:'characteristics_mn'})) assert.equal(product[mapped],source[raw]??'',`${product.id}.${mapped}`);
   assert.equal(product.imageUrl,images[product.id]);
   assert.ok((await readFile(new URL(`../public${product.imageUrl}`,import.meta.url))).length > 0);
   assert.equal(product.price,source.price);assert.equal(product.stockQuantity,source.stock_quantity);
   assert.equal(product.commercialDataApproved,false);
 }
});
test('prototype checkout never writes orders or creates a success confirmation',async()=>{
 const {POST}=await route('orders');const response=await POST(new Request('https://example.test/api/store/orders',{method:'POST',body:JSON.stringify({items:[{productId:'PRD-000001',quantity:1}]})}));
 assert.equal(response.status,503);const body=await response.json();assert.equal(body.code,'PROTOTYPE_ORDERING_DISABLED');assert.equal(body.orderNumber,undefined);
});
