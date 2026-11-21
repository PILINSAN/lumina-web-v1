import { queryOptions } from "@tanstack/react-query";
import { toast } from "sonner";

import { getEditorial, productCatalog } from "@/data/products";

export const SHOPIFY_API_VERSION = "2026-10";
export const SHOPIFY_STORE_PERMANENT_DOMAIN =
  import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "0uayg1-zn.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
// Storefront tokens are public by design (read-only storefront access).
export const SHOPIFY_STOREFRONT_TOKEN =
  import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || "d9f184500d62b016b052897d7634f760";

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    descriptionHtml?: string;
    handle: string;
    priceRange: { minVariantPrice: Money };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: Money;
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
  };
}

const PRODUCT_FIELDS = `
  id
  title
  description
  handle
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 5) { edges { node { url altText } } }
  variants(first: 10) {
    edges {
      node {
        id
        title
        price { amount currencyCode }
        availableForSale
        selectedOptions { name value }
      }
    }
  }
  options { name values }
`;

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges { node { ${PRODUCT_FIELDS} } }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FIELDS} descriptionHtml }
  }
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    toast.error("Shopify: se requiere un plan activo", {
      description:
        "El acceso a la tienda necesita un plan de Shopify activo. Revisa tu cuenta en admin.shopify.com.",
    });
    return;
  }

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = await response.json();
  if (data.errors) {
    throw new Error(
      `Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }
  return data;
}

/** Products in the order defined by the central catalog; unknown products go last. */
export async function fetchProducts(): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: 50 });
  const edges: ShopifyProduct[] = data?.data?.products?.edges ?? [];
  const order = (handle: string) => {
    const i = productCatalog.findIndex((p) => p.handle === handle);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...edges].sort((a, b) => order(a.node.handle) - order(b.node.handle));
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const product = data?.data?.product;
  return product ? { node: product } : null;
}

export const productsQueryOptions = queryOptions({
  queryKey: ["shopify", "products"],
  queryFn: fetchProducts,
  staleTime: 60_000,
});

export const productQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["shopify", "product", handle],
    queryFn: () => fetchProductByHandle(handle),
    staleTime: 60_000,
  });

export function displayName(product: ShopifyProduct): string {
  return getEditorial(product.node.handle)?.name ?? product.node.title;
}

/* ---------------- Cart (Storefront API) ---------------- */

export const CART_QUERY = `
  query cart($id: ID!) { cart(id: $id) { id totalQuantity } }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
      warnings { code message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
      warnings { code message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id }
      userErrors { field message }
      warnings { code message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id }
      userErrors { field message }
    }
  }
`;

type UserError = { field: string[] | null; message: string };

export function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(userErrors: UserError[]): boolean {
  return userErrors.some(
    (e) =>
      e.message.toLowerCase().includes("cart not found") ||
      e.message.toLowerCase().includes("does not exist"),
  );
}

type CartWarning = { code: string; message: string };

/** Shopify accepts the line but drops it to 0 units when inventory can't be fulfilled online. */
function hasStockWarning(warnings: CartWarning[] | undefined): boolean {
  return (warnings ?? []).some((w) => w.code === "MERCHANDISE_OUT_OF_STOCK" || w.code === "MERCHANDISE_NOT_ENOUGH_STOCK");
}

type LineEdge = { node: { id: string; merchandise: { id: string } } };

export async function createShopifyCart(
  variantId: string,
  quantity: number,
): Promise<{ cartId: string; checkoutUrl: string; lineId: string } | { outOfStock: true } | null> {
  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: { buyerIdentity: { countryCode: "CO" }, lines: [{ quantity, merchandiseId: variantId }] },
  });
  if (hasStockWarning(data?.data?.cartCreate?.warnings)) return { outOfStock: true };
  if (data?.data?.cartCreate?.userErrors?.length > 0) {
    console.error("Cart creation failed:", data.data.cartCreate.userErrors);
    return null;
  }
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  const lineId = cart.lines.edges[0]?.node?.id;
  if (!lineId) return null;
  return { cartId: cart.id, checkoutUrl: formatCheckoutUrl(cart.checkoutUrl), lineId };
}

export async function addLineToShopifyCart(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<{ success: boolean; lineId?: string | undefined; cartNotFound?: boolean; outOfStock?: boolean }> {
  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ quantity, merchandiseId: variantId }],
  });
  if (hasStockWarning(data?.data?.cartLinesAdd?.warnings)) return { success: false, outOfStock: true };
  const userErrors: UserError[] = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Add line failed:", userErrors);
    return { success: false };
  }
  const lines: LineEdge[] = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
  const newLine = lines.find((l) => l.node.merchandise.id === variantId);
  return { success: true, lineId: newLine?.node?.id };
}

export async function updateShopifyCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<{ success: boolean; cartNotFound?: boolean; outOfStock?: boolean }> {
  const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  if (hasStockWarning(data?.data?.cartLinesUpdate?.warnings)) return { success: false, outOfStock: true };
  const userErrors: UserError[] = data?.data?.cartLinesUpdate?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Update line failed:", userErrors);
    return { success: false };
  }
  return { success: true };
}

export async function removeLineFromShopifyCart(
  cartId: string,
  lineId: string,
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });
  const userErrors: UserError[] = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Remove line failed:", userErrors);
    return { success: false };
  }
  return { success: true };
}