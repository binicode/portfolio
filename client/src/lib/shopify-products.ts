import { shopifyClient } from './shopify-client';
import type { ShopifyProduct } from '@/types/shopify';

const PRODUCT_FRAGMENT = `
  id
  handle
  title
  description
  featuredImage {
    url
    altText
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
  }
  variants(first: 10) {
    edges {
      node {
        id
        title
        availableForSale
        price {
          amount
          currencyCode
        }
      }
    }
  }
`;

interface ShopifyEdge<T> {
  node: T;
}

// Shape as returned directly by the GraphQL API — variants arrive
// wrapped in edges/node, which is standard GraphQL connection format.
// normalizeProduct() below flattens this into the simpler shape the
// rest of the app works with.
interface RawShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: {
    edges: ShopifyEdge<{
      id: string;
      title: string;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
    }>[];
  };
}

interface ProductsQueryResponse {
  products: { edges: ShopifyEdge<RawShopifyProduct>[] };
}

interface ProductByHandleQueryResponse {
  productByHandle: RawShopifyProduct | null;
}

function normalizeProduct(raw: RawShopifyProduct): ShopifyProduct {
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    featuredImage: raw.featuredImage,
    priceRange: raw.priceRange,
    variants: raw.variants.edges.map((edge) => edge.node),
  };
}

export async function getProducts(): Promise<ShopifyProduct[]> {
  const query = `
    query GetProducts {
      products(first: 20) {
        edges {
          node {
            ${PRODUCT_FRAGMENT}
          }
        }
      }
    }
  `;

  const response = await shopifyClient.request<ProductsQueryResponse>(query);

  if (response.errors) {
    throw new Error(`Shopify products query failed: ${JSON.stringify(response.errors)}`);
  }

  return response.data?.products.edges.map((edge) => normalizeProduct(edge.node)) ?? [];
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    query GetProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        ${PRODUCT_FRAGMENT}
      }
    }
  `;

  const response = await shopifyClient.request<ProductByHandleQueryResponse>(query, {
    variables: { handle },
  });

  if (response.errors) {
    throw new Error(`Shopify product query failed: ${JSON.stringify(response.errors)}`);
  }

  const product = response.data?.productByHandle;
  return product ? normalizeProduct(product) : null;
}
