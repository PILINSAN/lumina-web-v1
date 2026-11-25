import { Link } from "@tanstack/react-router";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";

import logoMark from "@/assets/lumina-logo-mark.png";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function SiteHeader() {
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastYRef.current;
    const delta = latest - previous;
    lastYRef.current = latest;

    setScrolled(latest > 40);

    if (prefersReducedMotion) {
      setHidden(false);
      return;
    }

    if (latest <= 60) {
      setHidden(false);
    } else if (delta > 6) {
      setHidden(true);
    } else if (delta < -6) {
      setHidden(false);
    }
  });

  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const setOpen = useCartStore((s) => s.setOpen);

  return (
    <motion.header
      initial={prefersReducedMotion ? { y: 0, opacity: 1 } : { y: -40, opacity: 0 }}
      animate={{
        y: hidden ? -96 : 0,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={cn(
        "fixed inset-x-0 top-0 z-40 px-4 pt-4 md:px-8",
        hidden && "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full px-5 transition-all duration-500 md:px-7",
          scrolled ? "glass-strong" : "border border-transparent",
        )}
      >
        <Link to="/" className="group flex items-center gap-3" aria-label="LUMINA inicio">
          <img
            src={logoMark}
            alt=""
            className="logo-blend h-9 w-auto transition-transform duration-200 ease-out group-hover:scale-105"
          />
          <span className="font-display text-2xl tracking-[0.32em] text-foreground">LUMINA</span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <Link
            to="/"
            hash="catalogo"
            className="eyebrow text-foreground/70 transition-colors duration-200 hover:text-primary"
          >
            Catálogo
          </Link>
          <Link
            to="/"
            hash="como-funciona"
            className="eyebrow text-foreground/70 transition-colors duration-200 hover:text-primary"
          >
            Cómo funciona
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir carrito"
          className="glass relative flex h-11 items-center gap-2 rounded-full px-4 text-sm text-foreground transition-all duration-150 ease-out hover:scale-[1.03] active:scale-x-[1.03] active:scale-y-[0.95]"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Carrito</span>
          {totalItems > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.7rem] font-semibold text-accent-foreground">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </motion.header>
  );
}