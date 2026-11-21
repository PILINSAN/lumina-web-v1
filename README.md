<div align="center">

# ✨ LUMINA — Storefront v1 (Colombia)

<img src="./src/assets/lumina-logo-full.png" alt="LUMINA Logo" width="260" />

**Experiencia de compra ágil para Colombia con catálogo de Shopify y pedidos contraentrega (COD) por WhatsApp.**

<br />

<a href="https://tanstack-start-ts.lumina-colombia.workers.dev">
  <img src="https://img.shields.io/badge/🛒_Abrir_Tienda_en_Vivo-Cloudflare_Workers-0f172a?style=for-the-badge" alt="Abrir tienda en vivo" />
</a>
<a href="https://github.com/PILINSAN/lumina-web-v1">
  <img src="https://img.shields.io/badge/📦_Versión-v1.0_Estable-1e293b?style=for-the-badge" alt="Versión v1" />
</a>

</div>

---

## 🔗 Acceso directo

- 🌐 **Tienda en vivo:** [https://tanstack-start-ts.lumina-colombia.workers.dev](https://tanstack-start-ts.lumina-colombia.workers.dev)
- 💬 **Flujo de compra:** Carrito sincronizado + pedido contraentrega (**COP**) directo a **WhatsApp**.

---

## 🛠️ Stack tecnológico (v1)

| Capa | Tecnología | Rol en el proyecto |
| :--- | :--- | :--- |
| ⚡ **Framework & SSR** | **TanStack Start + Nitro** | Renderizado, rutas y ejecución de la aplicación |
| ☁️ **Hosting / Edge** | **Cloudflare Workers** (`lumina-colombia`) | Despliegue en la nube disponible 24/7 |
| 🛍️ **Catálogo** | **Shopify Storefront API** | Productos, precios y sincronización de tienda |
| 🎨 **Interfaz** | **React + TypeScript + Tailwind CSS** | Componentes, diseño visual y experiencia de usuario |

---

## 🔒 Seguridad y despliegue

- 🔐 **Variables de entorno protegidas:** Los archivos `.env` y `.env.*` están ignorados por Git (`.gitignore`) y se cargan directamente en **Cloudflare** (*Workers & Pages* → `tanstack-start-ts` → *Settings* → *Variables and Secrets*).
- 🚀 **Comando de despliegue:** `npx nitro deploy --prebuilt`.
- 🧭 **Hoja de ruta:** Esta `v1` reúne la base funcional de lanzamiento; los rediseños de interfaz y la integración con WhatsApp Business API se trabajan en la `v2`.
