import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Banknote, MessageCircle, Truck } from "lucide-react";
import { useRef } from "react";

import heroImage from "@/assets/descargar.jpg";
import logoFull from "@/assets/lumina-logo-full.png";
import { MagneticButton } from "./MagneticButton";

const EASE = [0.16, 1, 0.3, 1] as const;

const lines = [
  { text: "La luz", italic: false },
  { text: "que nace", italic: true },
  { text: "desde adentro", italic: false },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] w-full flex-col justify-between overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.14 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease: EASE }}
        className="pointer-events-none absolute inset-0"
      >
        <motion.img
          src={heroImage}
          alt="Mujer con piel luminosa respirando entre hojas verdes al amanecer"
          style={{ y: imageY, scale: imageScale }}
          className="h-full w-full object-cover object-[70%_center]"
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-hero-veil" />
      <div className="pointer-events-none absolute inset-0 bg-background/55 md:hidden" />
      <div className="pointer-events-none absolute inset-0 bg-hero-floor" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-28 pt-24 md:px-10 md:pb-32 md:pt-28"
      >
        <motion.img
          src={logoFull}
          alt="LUMINA"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
          className="logo-blend mb-5 w-36 md:mb-6 md:w-52"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: EASE }}
          className="eyebrow mb-5 flex items-center gap-4 text-primary md:mb-6"
        >
          <span className="h-px w-12 bg-accent" />
          Salud integral y cuidado facial
        </motion.p>

        <h1 className="font-display text-[clamp(2.8rem,7.2vw,7.5rem)] text-foreground">
          {lines.map((line, i) => (
            <span key={line.text} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                initial={{ y: "110%", rotate: 3 }}
                animate={{ y: "0%", rotate: 0 }}
                transition={{ duration: 1.4, delay: 0.6 + i * 0.14, ease: EASE }}
                className={
                  line.italic
                    ? "block italic text-gradient-sand pl-[0.6em]"
                    : "block"
                }
              >
                {line.text}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.2, ease: EASE }}
          className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg"
        >
          Fórmulas de bienestar y rituales de piel seleccionados para Colombia. Lo pides hoy y
          lo pagas cuando llega a tu puerta.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.4, ease: EASE }}
          className="mt-7 flex flex-wrap items-center gap-5 md:mt-8 md:gap-6"
        >
          <MagneticButton href="#catalogo">
            Ver el catálogo
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15">
              <ArrowDown className="h-4 w-4" />
            </span>
          </MagneticButton>
          <a
            href="#como-funciona"
            className="eyebrow text-foreground/70 underline-offset-8 transition-colors hover:text-primary hover:underline"
          >
            Cómo funciona tu pedido
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.7, ease: EASE }}
        className="relative z-20 mt-auto px-4 pb-4 md:px-8 md:pb-6"
      >
        <div className="glass mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-full px-6 py-3.5 md:px-9 md:py-4">
          <BarItem icon={<Truck className="h-4 w-4" />} label="Envío a toda Colombia" />
          <span className="hidden h-4 w-px bg-border md:block" />
          <BarItem icon={<Banknote className="h-4 w-4" />} label="Pago en efectivo al recibir" />
          <span className="hidden h-4 w-px bg-border md:block" />
          <BarItem
            icon={<MessageCircle className="h-4 w-4" />}
            label="Confirmación por WhatsApp"
            className="hidden md:flex"
          />
        </div>
      </motion.div>
    </section>
  );
}

function BarItem({ icon, label, className }: { icon: React.ReactNode; label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-sm text-foreground ${className ?? ""}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {icon}
      </span>
      {label}
    </div>
  );
}