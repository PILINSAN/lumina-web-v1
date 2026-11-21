import { motion } from "framer-motion";
import { Banknote, MessageCircle, MousePointerClick } from "lucide-react";

import { brand, whatsappLink } from "@/data/brand";

const steps = [
  {
    icon: MousePointerClick,
    title: "Eliges tu producto en la web",
    body: "Agrega a tu pedido las fórmulas que quieras y completa tus datos de entrega en un minuto.",
  },
  {
    icon: MessageCircle,
    title: "Confirmamos tu dirección por WhatsApp",
    body: "Te escribimos para validar la dirección y el horario. Sin llamadas largas, sin formularios extra.",
  },
  {
    icon: Banknote,
    title: "Pagas en efectivo al recibir en casa",
    body: "Recibes tu pedido en cualquier ciudad de Colombia y pagas al mensajero. Nada por adelantado.",
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function OrderSteps() {
  return (
    <section id="como-funciona" className="relative scroll-mt-24 px-4 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow mb-6 text-primary">Pago contraentrega</p>
          <h2 className="font-display text-[clamp(3rem,7vw,6rem)] text-foreground">
            Cómo funciona <span className="italic text-gradient-sand">tu pedido</span>
          </h2>
        </motion.div>

        <div className="relative mt-20">
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, delay: 0.3, ease: EASE }}
            className="absolute left-[16%] right-[16%] top-[3.25rem] hidden h-px origin-left bg-accent md:block"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 70, rotateX: 12 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.2, delay: 0.2 + i * 0.18, ease: EASE }}
                whileHover={{ y: -8 }}
                className="glass relative flex flex-col rounded-[2rem] p-8 md:p-10"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-sage text-primary-foreground shadow-soft">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-7xl italic text-gradient-sand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-10 font-display text-3xl leading-[1.05] text-foreground">{step.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4, ease: EASE }}
          className="mt-16 flex flex-col items-center gap-4 text-center"
        >
          <a
            href={whatsappLink("Hola LUMINA, quiero hacer un pedido con pago contraentrega.")}
            target="_blank"
            rel="noopener noreferrer"
            className="glass inline-flex h-14 items-center gap-3 rounded-full px-8 text-sm text-foreground transition-transform hover:scale-[1.03]"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
            Escríbenos al {brand.whatsappDisplay}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
