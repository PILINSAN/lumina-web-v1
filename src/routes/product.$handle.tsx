import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Banknote, Check, Loader2, MessageCircle, Plus, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
      <p className="font-display text-4xl text-foreground sm:text-5xl">Producto no encontrado</p>
      <Link to="/" hash="catalogo" className="eyebrow text-primary underline underline-offset-8">
        Volver al catálogo
      </Link>
    </div>
  ),
  component: ProductPage,
});

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQueryOptions(handle));
  const { add, isLoading } = useAddToCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  if (!product) return null;

  const editorial = getEditorial(product.node.handle);
  const name = displayName(product);
  const images = product.node.images.edges.map((e) => e.node);
  const price = product.node.priceRange.minVariantPrice;
  const available = product.node.variants.edges.some((v) => v.node.availableForSale);
  const descriptionHtml = stripEmojis(product.node.descriptionHtml ?? "");

  const handleAddClick = async () => {
    if (!available || isLoading) return;
    await add(product);
    setAddedFeedback(true);
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setAddedFeedback(false);
      feedbackTimerRef.current = null;
    }, 1500);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-8 md:pt-32">
      <Link
        to="/"
        hash="catalogo"
        className="group eyebrow inline-flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-1" />
        Catálogo
      </Link>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="glass rounded-[2.5rem] p-3"
        >
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-secondary">
            {images[0] && (
              <img
                src={images[0].url}
                alt={images[0].altText ?? name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.02]"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((img) => (
                <div
                  key={img.url}
                  className="lumina-card-interactive aspect-square overflow-hidden rounded-2xl bg-secondary"
                >
                  <img src={img.url} alt={img.altText ?? name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
        >
          <p className="eyebrow text-primary">{editorial?.category ?? "Bienestar"}</p>
          <h1 className="mt-3 font-display text-3xl leading-[1.05] text-foreground sm:text-4xl lg:text-5xl">
            {name}
          </h1>
          {editorial?.summary && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {editorial.summary}
            </p>
          )}

          <div className="glass mt-8 rounded-[2rem] p-6 sm:p-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow text-muted-foreground">Precio contraentrega</p>
                <p className="mt-2 font-display text-4xl leading-none text-primary sm:text-5xl">
                  {formatCOP(price.amount)}
                  <span className="ml-2 font-sans text-xs tracking-widest text-muted-foreground">COP</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!available || isLoading}
              onClick={handleAddClick}
              className="btn-shine mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-sage text-xs font-medium uppercase tracking-[0.22em] text-primary-foreground shadow-lift transition-all duration-200 ease-out hover:shadow-glow active:scale-x-[1.02] active:scale-y-[0.96] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : addedFeedback ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {!available ? "Agotado" : addedFeedback ? "Agregado a tu pedido" : "Agregar a mi pedido"}
            </button>

            <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-primary" />
                Envío a toda Colombia
              </li>
              <li className="flex items-center gap-2">
                <Banknote className="h-4 w-4 shrink-0 text-primary" />
                Pagas al recibir
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                Confirmación por WhatsApp
              </li>
            </ul>
          </div>

          {descriptionHtml && (
            <div className="mt-10">
              <p className="eyebrow mb-4 text-primary">Detalles</p>
              <div className="prose-lumina" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}