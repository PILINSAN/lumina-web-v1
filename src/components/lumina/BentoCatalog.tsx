import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { productsQueryOptions } from "@/lib/shopify";
import { ProductCard } from "./ProductCard";

export function BentoCatalog() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);

  return (
    <section id="catalogo" className="relative scroll-mt-24 px-4 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
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
              Cuatro fórmulas,
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

        {products.length === 0 ? (
          <div className="glass rounded-[2rem] p-16 text-center">
            <p className="font-display text-4xl text-foreground">No hay productos disponibles</p>
            <p className="mt-3 text-sm text-muted-foreground">Pronto tendremos novedades para ti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {products.map((product, i) => (
              <ProductCard key={product.node.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
