import { Link } from "@tanstack/react-router";

import { brand, whatsappLink } from "@/data/brand";

export function SiteFooter() {
  return (
    <footer className="px-4 pb-6 md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-sage px-8 py-16 text-primary-foreground md:px-14">
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
          <div>
            <p className="font-display text-[clamp(4rem,12vw,9rem)] tracking-[0.12em]">LUMINA</p>
            <p className="mt-4 max-w-sm text-sm text-primary-foreground/70">{brand.tagline}.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div className="flex flex-col gap-3">
              <p className="eyebrow text-accent">Tienda</p>
              <Link to="/" hash="catalogo" className="text-primary-foreground/80 hover:text-primary-foreground">
                Catálogo
              </Link>
              <Link to="/" hash="como-funciona" className="text-primary-foreground/80 hover:text-primary-foreground">
                Cómo funciona
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <p className="eyebrow text-accent">Pedidos</p>
              <a
                href={whatsappLink("Hola LUMINA, tengo una pregunta sobre mi pedido.")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                WhatsApp {brand.whatsappDisplay}
              </a>
              <span className="text-primary-foreground/80">{brand.shipping}</span>
              <span className="text-primary-foreground/80">{brand.payment}</span>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60 md:flex-row">
          <span>2026 LUMINA. Hecho en Colombia.</span>
          <span>Los suplementos no reemplazan una alimentación equilibrada ni el consejo médico.</span>
        </div>
      </div>
    </footer>
  );
}
