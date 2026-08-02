import { shopifyClient } from './shopify-client';

interface CartCreateResponse {
  cartCreate: {
    cart: { id: string; checkoutUrl: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
}

/**
 * Creates a new Shopify cart containing a single line item and
 * returns its hosted checkout URL. No cart state is persisted
 * anywhere (localStorage, cookies, etc.) between calls — each "Buy
 * Now" click creates a fresh, disposable cart. A real persistent cart
 * is a legitimate feature for a production storefront, but is out of
 * scope here on purpose.
 */
export async function createCartCheckoutUrl(variantId: string, quantity: number = 1): Promise<string> {
  const mutation = `
    mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await shopifyClient.request<CartCreateResponse>(mutation, {
    variables: {
      lines: [{ merchandiseId: variantId, quantity }],
    },
  });

  if (response.errors) {
    throw new Error(`Shopify cart creation failed: ${JSON.stringify(response.errors)}`);
  }

  if (!response.data) {
    throw new Error('Shopify did not return any data for cart creation');
  }

  const { cart, userErrors } = response.data.cartCreate;

  if (userErrors.length > 0) {
    throw new Error(`Shopify cart creation failed: ${userErrors.map((e) => e.message).join(', ')}`);
  }

  if (!cart) {
    throw new Error('Shopify did not return a cart');
  }

  return cart.checkoutUrl;
}
