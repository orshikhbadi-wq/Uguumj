import assert from 'node:assert/strict';
import test from 'node:test';
import { addCartQuantity } from '../app/store/cartQuantity.ts';
test('selected quantity is added exactly and contributes to the line total', () => {
  const cart = addCartQuantity({}, 'product', 3, 6);
  assert.equal(cart.product, 3);
  assert.equal(cart.product * 8800, 26400);
  assert.equal(addCartQuantity(cart, 'product', 2, 6).product, 5);
});
test('existing cart quantities count against the available stock', () => {
  assert.equal(addCartQuantity({ product: 4 }, 'product', 3, 6), null);
  assert.equal(addCartQuantity({ product: 4 }, 'product', 2, 6).product, 6);
});
test('zero, negative, decimal, excessive and unavailable quantities are rejected', () => {
  for (const quantity of [0, -1, 1.5, 7, Infinity, NaN]) assert.equal(addCartQuantity({}, 'product', quantity, 6), null);
  assert.equal(addCartQuantity({}, 'product', 1, 0), null);
});
