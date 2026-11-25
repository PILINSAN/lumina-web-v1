import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { getGroup } from "@/data/products";
import { productsQueryOptions } from "@/lib/shopify";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

type FilterId = "todos" | "facial" | "bienestar";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "facial", label: "Cuidado facial" },
  { id: "bienestar", label: "Bienestar" },
];

const OUT_MS = 360;
const IN_MS = 640;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface Item {
  el: HTMLDivElement;
  dx: number;
  dy: number;
  rot: number;
}

const matches = (f: FilterId, handle: string) => f === "todos" || getGroup(handle) === f;

/** Deterministic rotation per card: alternating sign, 10 to 14 degrees. */
const rotationFor = (i: number) => (i % 2 === 0 ? 1 : -1) * (10 + ((i * 3) % 5));

export function BentoCatalog() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);

  const [filter, setFilter] = useState<FilterId>("todos");
  const [announce, setAnnounce] = useState("");
  const [interacted, setInteracted] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const raf = useRef(0);
  const run = useRef(0);
  const target = useRef<FilterId>("todos");
  const animating = useRef(false);
  const currentE = useRef(0);

  const visible = useMemo(
    () => products.map((p, i) => ({ p, i })).filter(({ p }) => matches(filter, p.node.handle)),
    [products, filter],
  );

  const measure = (): Item[] => {
    const grid = gridRef.current;
    if (!grid) return [];
    const cx = grid.clientWidth / 2;
    const cy = grid.clientHeight / 2;
    const items: Item[] = [];
    nodes.current.forEach((el) => {
      const ex = el.offsetLeft + el.offsetWidth / 2;
      const ey = el.offsetTop + el.offsetHeight / 2;
      items.push({ el, dx: (ex - cx) * 0.7, dy: (ey - cy) * 0.7, rot: Number(el.dataset.rot ?? 0) });
    });
    return items;
  };

  /** e = 0 is the resting state, e = 1 is fully scattered. */
  const apply = (items: Item[], e: number) => {
    currentE.current = e;
    for (const { el, dx, dy, rot } of items) {
      el.style.willChange = "transform, opacity";
      el.style.transform = `translate3d(${dx * e}px, ${dy * e}px, 0) rotate(${rot * e}deg) scale(${1 - 0.28 * e})`;
      el.style.opacity = String(1 - e);
    }
  };

  const reset = () => {
    nodes.current.forEach((el) => {
      el.style.transform = "";
      el.style.opacity = "";
      el.style.willChange = "";
    });
    currentE.current = 0;
  };

  const stop = () => {
    cancelAnimationFrame(raf.current);
    run.current += 1;
  };

  const select = (next: FilterId) => {
    if (next === target.current) return;
    target.current = next;
    stop();
    const id = run.current;

    const count = products.filter((p) => matches(next, p.node.handle)).length;
    const label = FILTERS.find((f) => f.id === next)?.label ?? "";
    setAnnounce(`${count} ${count === 1 ? "producto" : "productos"}: ${label}`);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      flushSync(() => {
        setInteracted(true);
        setFilter(next);
      });
      reset();
      animating.current = false;
      return;
    }

    animating.current = true;
    setInteracted(true);

    const startE = currentE.current;
    const outItems = measure();
    const t0 = performance.now();

    const stepOut = () => {
      if (id !== run.current) return;
      const t = Math.min(1, (performance.now() - t0) / OUT_MS);
      apply(outItems, startE + (1 - startE) * easeOut(t));
      if (t < 1) {
        raf.current = requestAnimationFrame(stepOut);
        return;
      }
      // Phase 2: swap the set, place incoming cards scattered, then regroup.
      flushSync(() => setFilter(next));
      const inItems = measure();
      apply(inItems, 1);
      const t1 = performance.now();
      const stepIn = () => {
        if (id !== run.current) return;
        const u = Math.min(1, (performance.now() - t1) / IN_MS);
        if (u < 1) {
          apply(inItems, 1 - easeOut(u));
          raf.current = requestAnimationFrame(stepIn);
        } else {
          reset(); // exact resting geometry, full opacity
          animating.current = false;
        }
      };
      raf.current = requestAnimationFrame(stepIn);
    };
    raf.current = requestAnimationFrame(stepOut);
  };

  // Width changes: snap to the final state of the latest selection.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let lastWidth = grid.clientWidth;
    const onResize = () => {
      const w = grid.clientWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      if (!animating.current) return;
      stop();
      animating.current = false;
      flushSync(() => setFilter(target.current));
      reset();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(grid);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="catalogo" className="relative scroll-mt-24 px-4 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="eyebrow mb-6 flex items-center gap-4 text-primary">
              <span className="h-px w-12 bg-accent" />
              La colección
            </p>
            <h2 className="font-display text-[clamp(3rem,7vw,6.5rem)] text-foreground">
              Fórmulas curadas,
              <br />
              <span className="italic text-gradient-sand">un solo ritual.</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="max-w-sm text-sm leading-relaxed text-muted-foreground"
          >
            Selección curada para tu piel y tu equilibrio diario. Cada pedido se confirma
            contigo por WhatsApp y se paga en efectivo al recibir.
          </motion.p>
        </div>

        {products.length > 0 && (
          <div role="group" aria-label="Filtrar productos" className="mb-8 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const pressed = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => select(f.id)}
                  className={cn(
                    "eyebrow h-11 rounded-full border px-6 transition-colors duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    pressed
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-secondary",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        <p role="status" aria-live="polite" className="sr-only">
          {announce}
        </p>

        {products.length === 0 ? (
          <div className="glass rounded-[2rem] p-16 text-center">
            <p className="font-display text-4xl text-foreground">No hay productos disponibles</p>
            <p className="mt-3 text-sm text-muted-foreground">Pronto tendremos novedades para ti.</p>
          </div>
        ) : (
          <div ref={gridRef} className="relative grid grid-cols-1 gap-5 lg:grid-cols-2">
            {visible.map(({ p, i }) => (
              <div
                key={p.node.id}
                ref={(el) => {
                  if (el) nodes.current.set(p.node.id, el);
                  else nodes.current.delete(p.node.id);
                }}
                data-rot={rotationFor(i)}
                className="h-full"
                style={{ transformOrigin: "50% 50%" }}
              >
                <ProductCard product={p} index={i} instant={interacted} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}