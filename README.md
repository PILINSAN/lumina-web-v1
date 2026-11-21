# LUMINA — Storefront v1 (Colombia)

Tienda online de **LUMINA** para Colombia con integración a **Shopify Storefront API** y flujo de pedidos contraentrega (**COD**) por **WhatsApp**.

## Acceso rápido a la tienda

- **Tienda en vivo (Cloudflare Workers):** [https://tanstack-start-ts.lumina-colombia.workers.dev](https://tanstack-start-ts.lumina-colombia.workers.dev)
- **Repositorio de versión:** `PILINSAN/lumina-web-v1`

## Stack tecnológico (v1)

- **Framework / Servidor:** TanStack Start + Nitro
- **Despliegue:** Cloudflare Workers (`lumina-colombia`)
- **Catálogo y datos de tienda:** Shopify Storefront API
- **Flujo de compra:** Carrito sincronizado + pedido contraentrega (COP) vía WhatsApp
- **Frontend:** TypeScript, React y Tailwind CSS

## Notas de despliegue y desarrollo

- La aplicación corre como despliegue SSR/edge en **Cloudflare Workers** mediante `npx nitro deploy --prebuilt`.
- Las variables de entorno sensibles (`.env`, `.env.*`) quedan excluidas del repositorio mediante `.gitignore` y se configuran en Cloudflare (**Workers & Pages** → `tanstack-start-ts` → **Settings** → **Variables and Secrets**).
- Esta versión (`v1`) representa la base funcional de lanzamiento; las mejoras de interfaz y WhatsApp Business API se planifican para la `v2`.
