import { describe, expect, it } from "vitest";

import { formatCOP, stripEmojis } from "@/lib/format";

describe("formatCOP", () => {
  it("formats Shopify amounts as Colombian pesos without decimals", () => {
    expect(formatCOP("59900.0")).toBe("$59.900");
    expect(formatCOP(64900)).toBe("$64.900");
  });
});

describe("stripEmojis", () => {
  it("removes emojis from store copy (the brand uses none)", () => {
    expect(stripEmojis("Beneficios Principales🧡 Disminuye ✨ zonas")).toBe("Beneficios Principales Disminuye zonas");
  });
});
