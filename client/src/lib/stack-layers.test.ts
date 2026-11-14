// Run with `npm test` (Node's built-in test runner; TypeScript types are stripped natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layerOf, stackLayers } from './stack-layers.ts';

test('layerOf: specific names win (a Shopify API is a service, vector search is data)', () => {
  assert.equal(layerOf('Shopify Storefront API'), 'services');
  assert.equal(layerOf('MongoDB Atlas Vector Search'), 'data');
  assert.equal(layerOf('GraphQL'), 'api');
  assert.equal(layerOf('SSE'), 'api');
  assert.equal(layerOf('Next.js'), 'interface');
  assert.equal(layerOf('Something new'), 'services');
});

test('stackLayers: layers in stack order, languages apart, logos attached, duplicates dropped', () => {
  const { layers, languages } = stackLayers(['Stripe', 'Next.js', 'TypeScript', 'Express', 'MongoDB', 'next.js', ' ']);
  assert.deepEqual(
    layers.map((layer) => [layer.slug, layer.items.map((tech) => tech.name)]),
    [
      ['interface', ['Next.js']],
      ['api', ['Express']],
      ['data', ['MongoDB']],
      ['services', ['Stripe']],
    ],
  );
  assert.deepEqual(languages, [{ name: 'TypeScript', logo: 'typescript' }]);
  assert.equal(layers[0].items[0].logo, 'nextjs');
  assert.equal(stackLayers(['JWT', 'Zod']).layers[0].items[1].logo, undefined);
});

test('stackLayers: empty and missing layers', () => {
  assert.deepEqual(stackLayers([]), { layers: [], languages: [] });
  assert.deepEqual(
    stackLayers(['Gemini', 'Voyage AI', 'Express']).layers.map((layer) => layer.slug),
    ['api', 'services'],
  );
});
