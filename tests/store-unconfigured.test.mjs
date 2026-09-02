import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

// Run the real route and storage modules with the Worker environment unconfigured.
const storage = (await readFile(new URL('../lib/googleSheetsStore.ts', import.meta.url), 'utf8'))
  .replace('import { env } from "cloudflare:workers";', 'const env = {};');
const storageUrl = `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(storage, { mode: 'transform' })).toString('base64')}`;
async function route(name) {
  const source = (await readFile(new URL(`../app/api/store/${name}/route.ts`, import.meta.url), 'utf8'))
    .replaceAll('"../../../../lib/googleSheetsStore"', JSON.stringify(storageUrl));
  return import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64')}`);
}

test('unconfigured store never supplies a fabricated catalogue', async () => {
  const { GET } = await route('products');
  const response = await GET();
  assert.equal(response.status, 503);
  assert.deepEqual((await response.json()).products, []);
});

test('valid checkout cannot succeed without Sheets storage', async () => {
  const { POST } = await route('orders');
  const response = await POST(new Request('https://example.test/api/store/orders', {
    method: 'POST', body: JSON.stringify({
      customer: { firstName: 'Test', phone: '00000000', cityDistrict: 'Test', deliveryAddress: 'Test' },
      items: [{ productId: 'PRD-BITY-SEED', quantity: 1 }], paymentMethod: 'BANK_TRANSFER', deliveryMethod: 'DELIVERY',
    }),
  }));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.orderNumber, undefined);
  assert.equal(body.storage, undefined);
});

test('malformed checkout returns a controlled error', async () => {
  const { POST } = await route('orders');
  for (const body of ['null', '{', JSON.stringify({ items: [null] })]) {
    const response = await POST(new Request('https://example.test/api/store/orders', { method: 'POST', body }));
    assert.equal(response.status, 400);
  }
});
