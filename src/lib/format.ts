/** Formats a Shopify money amount as Colombian pesos, e.g. "59900.0" -> "$59.900". */
export function formatCOP(amount: string | number): string {
  const value = typeof amount === "number" ? amount : parseFloat(amount);
  if (!Number.isFinite(value)) return "$0";
  return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

const EMOJI_PATTERN =
  /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u200D\uFE0F\u20E3]/gu;

/** Removes every emoji from text coming from the store (the brand uses none). */
export function stripEmojis(text: string): string {
  return text.replace(EMOJI_PATTERN, "").replace(/[ \t]{2,}/g, " ").trim();
}
