export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProductImage {
  url: string;
  altText: string | null;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage: ShopifyProductImage | null;
  priceRange: {
    minVariantPrice: ShopifyMoney;
  };
  variants: ShopifyProductVariant[];
}
