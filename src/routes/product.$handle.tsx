import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Banknote, Loader2, MessageCircle, Plus, Truck } from "lucide-react";

import { getEditorial } from "@/data/products";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatCOP, stripEmojis } from "@/lib/format";
import { displayName, productQueryOptions } from "@/lib/shopify";

export const Route = createFileRoute("/product/$handle")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQueryOptions(params.handle));
    if (!product) throw notFound();
    return {
      name: displayName(product),
      summary: getEditorial(product.node.handle)?.summary ?? stripEmojis(product.node.description).slice(0, 150),
      image: product.node.images.edges[0]?.node.url,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Producto no disponible | LUMINA" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} | LUMINA`;
    const meta = [
      { title },
      { name: "description", content: loaderData.summary },
      { property: "og:title", content: title },
      { property: "og:description", content: loaderData.summary },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData.image) {
      meta.push({ property: "og:image", content: loaderData.image });
      meta.push({ name: "twitter:image", content: loaderData.image });
    }
    return { meta };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-5xl text-foreground">Producto no encontrado</p>
      <Link to="/" hash="catalogo" className="eyebrow text-primary underline underline-offset-8">
        Volver al catálogo
      </Link>
    </div>
  ),
  component: ProductPage,
});

const EASE = [0.16, 1, 0.3, 1] as const;

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQueryOptions(handle));
  const { add, isLoading } = useAddToCart();
  if (!product) return null;

  const editorial = getEditorial(product.node.handle);
  const name = displayName(product);
  const images = product.node.images.edges.map((e) => e.node);
  const price = product.node.priceRange.minVariantPrice;
  const available = product.node.variants.edges.some((v) => v.node.availableForSale);
  const descriptionHtml = stripEmojis(product.node.descriptionHtml ?? "");

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-8">
      <Link to="/" hash="catalogo" className="eyebrow inline-flex items-center gap-2 text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Catálogo
      </Link>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
          className="glass rounded-[2.5rem] p-3 lg:sticky lg:top-28 lg:self-start"
        >
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-secondary">
            {images[0] && <img src={images[0].url} alt={images[0].altText ?? name} className="h-full w-full object-cover" />}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((img) => (
                <div key={img.url} className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                  <img src={img.url} alt={img.altText ?? name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.15, ease: EASE }}
        >
          <p className="eyebrow text-primary">{editorial?.category ?? "Bienestar"}</p>
          <h1 className="mt-5 font-display text-[clamp(3rem,6vw,5.5rem)] text-foreground">{name}</h1>
          {editorial?.summary && <p className="mt-6 text-lg text-muted-foreground">{editorial.summary}</p>}

          <div className="glass mt-10 rounded-[2rem] p-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow text-muted-foreground">Precio contraentrega</p>
                <p className="mt-2 font-display text-5xl text-primary">
                  {formatCOP(price.amount)}
                  <span className="ml-2 font-sans text-xs tracking-widest text-muted-foreground">COP</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={!available || isLoading}
              onClick={() => add(product)}
              className="btn-shine mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-sage text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground shadow-lift transition-shadow hover:shadow-glow disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {available ? "Agregar a mi pedido" : "Agotado"}
            </button>
            <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />Envío a toda Colombia</li>
              <li className="flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" />Pagas al recibir</li>
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" />Confirmación por WhatsApp</li>
            </ul>
          </div>

          {descriptionHtml && (
            <div className="mt-12">
              <p className="eyebrow mb-5 text-primary">Detalles</p>
              <div className="prose-lumina" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
