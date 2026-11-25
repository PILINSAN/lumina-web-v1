/**
 * Centralized product catalog.
 *
 * Prices, stock, images and variant IDs come live from Shopify (Storefront API).
 * This file only holds the editorial layer for each Shopify product handle:
 * display name, category and short copy. New Shopify products appear automatically;
 * an entry here is optional and only polishes how a product is presented.
 * Add a new entry here (keyed by the Shopify handle) to control how a product appears.
 */

export type ProductGroup = "facial" | "bienestar";

export interface ProductEditorial {
  handle: string;
  name: string;
  category: string;
  summary: string;
  badge?: string;
  group: ProductGroup;
}

export const productCatalog: ProductEditorial[] = [
  {
    handle: "dr-melaxin-peel-shot",
    name: "Dr. Melaxin Peel Shot",
    category: "Cuidado facial",
    summary: "Cuidado facial y renovación de la piel.",
    badge: "Ritual de piel",
    group: "facial",
  },
  {
    handle: "suplemento-berberine-apoyo-al-bienestar",
    name: "Suplemento Berberine Bienestar",
    category: "Equilibrio metabólico",
    summary: "Apoyo metabólico y equilibrio diario.",
    group: "bienestar",
  },
  {
    handle: "suplemento-drenador-lynfatico",
    name: "Suplemento Drenador Linfático",
    category: "Drenaje y ligereza",
    summary: "Reducción de retención de líquidos y ligereza.",
    group: "bienestar",
  },
  {
    handle: "natures-lymphatic-dranage-x2",
    name: "Natures Lymphatic Drainage X2",
    category: "Fórmula en gotas",
    summary: "Fórmula líquida concentrada en gotas.",
    badge: "Pack x2",
    group: "bienestar",
  },
];

export function getEditorial(handle: string): ProductEditorial | undefined {
  return productCatalog.find((p) => p.handle === handle);
}

/** Products without an editorial entry fall back to "bienestar". */
export function getGroup(handle: string): ProductGroup {
  return getEditorial(handle)?.group ?? "bienestar";
}