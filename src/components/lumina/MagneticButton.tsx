import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
}

/** Anchor that is pulled toward the cursor and carries a moving shine. */
export function MagneticButton({ href, children, className, strength = 0.35 }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "btn-shine inline-flex h-16 items-center gap-4 rounded-full bg-gradient-sage pl-9 pr-3 text-[0.78rem] font-medium uppercase tracking-[0.24em] text-primary-foreground shadow-lift transition-shadow duration-500 hover:shadow-glow",
        className,
      )}
    >
      {children}
    </motion.a>
  );
}