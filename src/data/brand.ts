/** Central brand configuration. */
export const brand = {
  name: "LUMINA",
  tagline: "Salud integral, bienestar y cuidado facial",
  /** WhatsApp number in international format, without "+" or spaces. */
  whatsapp: "573011740941",
  whatsappDisplay: "+57 301 174 0941",
  shipping: "Envío a toda Colombia",
  payment: "Pago en efectivo al recibir",
} as const;

export function whatsappLink(message: string): string {
  return `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;
}