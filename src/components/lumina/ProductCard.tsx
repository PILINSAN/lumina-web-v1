import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Loader2, Plus } from "lucide-react";
import { useRef } from "react";

import { getEditorial } from "@/data/products";
import { useAddToCart } from "@/hooks/useAddToCart";
import { formatCOP, stripEmojis } from "@/lib/format";
import { displayName, type ShopifyProduct } from "@/lib/shopify";

interface ProductCardProps {
  product: ShopifyProduct;
  index: number;
  instant?: boolean; // CAMBIO
}

/** Short fallback copy for products that have no editorial entry yet. */
function fallbackSummary(description: string): string {
  const clean = stripEmojis(description);
  return clean.length > 110 ? `${clean.slice(0, 110).trimEnd()}...` : clean;
}

export function ProductCard({ product, index, instant = false }: ProductCardProps) { // CAMBIO
  const ref = useRef<HTMLDivElement>(null);
  const { add, isLoading } = useAddToCart();
  const editorial = getEditorial(product.node.handle);
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;
  const available = product.node.variants.edges.some((v) => v.node.availableForSale);
  const name = displayName(product);
  const summary = editorial?.summary ?? fallbackSummary(product.node.description);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.article
      initial={instant ? false : { opacity: 0, y: 60 }} // CAMBIO
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.1, delay: (index % 2) * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => ref.current?.style.setProperty("--glow", "1")}
        onMouseLeave={() => ref.current?.style.setProperty("--glow", "0")}
        whileHover={{ y: -10 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="glass edge-glow group h-full rounded-[2rem] p-3 transition-shadow duration-700 hover:shadow-lift"
      >
        <div className="relative z-10 flex h-full flex-col gap-3 sm:flex-row">
          <Link
            to="/product/$handle"
            params={{ handle: product.node.handle }}
            className="relative block aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-card sm:w-[46%] sm:flex-shrink-0"
          >
            {image && (
              <img
                src={image.url}
                alt={image.altText ?? name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
            )}
            {editorial?.badge && (
              <span className="glass eyebrow absolute left-4 top-4 rounded-full px-4 py-2 text-[0.62rem] text-foreground">
                {editorial.badge}
              </span>
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-between gap-6 p-4 md:p-5">
            <div>
              <p className="eyebrow text-accent-foreground/60">
                {String(index + 1).padStart(2, "0")} / {editorial?.category ?? "Bienestar"}
              </p>
              <Link to="/product/$handle" params={{ handle: product.node.handle }} className="group/title">
                <h3 className="mt-4 font-display text-[clamp(2rem,2.8vw,2.8rem)] text-foreground transition-colors group-hover/title:text-primary">
                  {name}
                </h3>
              </Link>
              {summary && <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{summary}</p>}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="eyebrow text-muted-foreground">Contraentrega</p>
                <p className="mt-1 font-display text-3xl text-primary">
                  {formatCOP(price.amount)}
                  <span className="ml-2 font-sans text-xs tracking-widest text-muted-foreground">COP</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!available || isLoading}
                  onClick={() => add(product)}
                  className="btn-shine flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-sage px-5 text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground shadow-soft transition-shadow hover:shadow-glow disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {available ? "Agregar" : "Agotado"}
                </button>
                <Link
                  to="/product/$handle"
                  params={{ handle: product.node.handle }}
                  aria-label={`Ver ${name}`}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}