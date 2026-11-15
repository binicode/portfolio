// Run with `npm test` (Node's built-in test runner; TypeScript types are stripped natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasPriceRange, isSoldOut, sharedCurrency } from './shop-display.ts';

const variant = (amount: string, availableForSale = true) => ({
  id: amount,
  title: amount,
  availableForSale,
  price: { amount, currencyCode: 'USD' },
});

test('"From" only when variant prices differ', () => {
  assert.equal(hasPriceRange({ variants: [variant('10.00'), variant('10.0')] }), false);
  assert.equal(hasPriceRange({ variants: [variant('10.00'), variant('12.00')] }), true);
  assert.equal(hasPriceRange({ variants: [] }), false);
});

test('sold out only when every variant is unavailable', () => {
  assert.equal(isSoldOut({ variants: [variant('10.00', false), variant('12.00', false)] }), true);
  assert.equal(isSoldOut({ variants: [variant('10.00', false), variant('12.00', true)] }), false);
  assert.equal(isSoldOut({ variants: [] }), false);
});

test('one shared currency, or none', () => {
  const price = (currencyCode: string) => ({ priceRange: { minVariantPrice: { amount: '1', currencyCode } } });
  assert.equal(sharedCurrency([price('USD'), price('USD')]), 'USD');
  assert.equal(sharedCurrency([price('USD'), price('EUR')]), null);
  assert.equal(sharedCurrency([]), null);
});
