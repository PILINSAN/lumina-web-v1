import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import logoMark from "@/assets/lumina-logo-mark.png";

const CYCLE_MS = 2600;
const FILL_START_MS = 1350;
const FILL_DURATION_MS = 350;
const HOLD_END_MS = 2150;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function cosineEase(t: number): number {
  const c = clamp01(t);
  return 0.5 - 0.5 * Math.cos(Math.PI * c);
}

function scrollToTopInstant() {
  if (typeof window === "undefined") return;
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  } catch {
    window.scrollTo(0, 0);
  }
}

interface StrokeSpec {
  id: string;
  d: string;
  delayMs: number;
  durationMs: number;
}

const OUTLINE_STROKES: StrokeSpec[] = [
  { id: "mark-outer", d: "M 14 14 H 52 V 54 H 14 Z", delayMs: 0, durationMs: 1150 },
  { id: "mark-chevron", d: "M 19 20 L 33 46 L 47 20", delayMs: 45, durationMs: 1150 },
  { id: "mark-arc", d: "M 17 31 Q 33 43 49 31", delayMs: 90, durationMs: 1150 },
  { id: "divider-rule", d: "M 66 43 H 214", delayMs: 135, durationMs: 1150 },
  { id: "accent-bar", d: "M 14 59 H 52", delayMs: 180, durationMs: 1150 },
];

export function LuminaSplashLoader() {
  const prefersReducedMotion = useReducedMotion();

  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [lengths, setLengths] = useState<Record<string, number>>({});

  const [visible, setVisible] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pageHidden, setPageHidden] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Asegura iniciar siempre arriba del todo al montar
  useEffect(() => {
    scrollToTopInstant();
  }, []);

  // Asegura quedar arriba cuando el loader termina y se oculta
  useEffect(() => {
    if (!visible) {
      scrollToTopInstant();
    }
  }, [visible]);

  useEffect(() => {
    const measured: Record<string, number> = {};
    for (const spec of OUTLINE_STROKES) {
      const el = pathRefs.current[spec.id];
      if (el && typeof el.getTotalLength === "function") {
        measured[spec.id] = Math.max(1, el.getTotalLength());
      } else {
        measured[spec.id] = 140;
      }
    }
    setLengths(measured);
  }, []);

  useEffect(() => {
    let active = true;
    const img = new Image();
    img.src = logoMark;
    img.decode?.()
      .then(() => {
        if (active) setLogoLoaded(true);
      })
      .catch(() => {
        // Se apoya en onLoad / onError del <img>
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncVisibility = () => setPageHidden(document.hidden);
    const handlePageHide = () => setPageHidden(true);
    const handlePageShow = () => {
      setPageHidden(document.hidden);
      scrollToTopInstant();
    };

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
  }, []);

  useEffect(() => {
    if (!visible) {
      stopRaf();
      return;
    }

    if (prefersReducedMotion) {
      stopRaf();
      elapsedRef.current = FILL_START_MS + FILL_DURATION_MS;
      setElapsedMs(FILL_START_MS + FILL_DURATION_MS);
      const timer = window.setTimeout(() => setVisible(false), 500);
      return () => window.clearTimeout(timer);
    }

    if (pageHidden) {
      stopRaf();
      return;
    }

    const step = (now: number) => {
      if (lastFrameRef.current !== null) {
        const dt = Math.min(100, Math.max(0, now - lastFrameRef.current));
        const nextElapsed = elapsedRef.current + dt;

        if (nextElapsed >= CYCLE_MS) {
          elapsedRef.current = CYCLE_MS;
          setElapsedMs(CYCLE_MS);
          stopRaf();
          setVisible(false);
          return;
        }

        elapsedRef.current = nextElapsed;
        setElapsedMs(nextElapsed);
      }

      lastFrameRef.current = now;
      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => stopRaf();
  }, [visible, pageHidden, prefersReducedMotion, stopRaf]);

  const visualState = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        outlineOpacity: 0,
        fillOpacity: 1,
        textOutlineOpacity: 0,
        textFillOpacity: 1,
        groupOpacity: 1,
        strokeOffsets: Object.fromEntries(OUTLINE_STROKES.map((s) => [s.id, 0])),
      };
    }

    const t = elapsedMs;

    const offsets: Record<string, number> = {};
    for (const spec of OUTLINE_STROKES) {
      const totalLen = lengths[spec.id] ?? 140;
      const localProgress = (t - spec.delayMs) / spec.durationMs;
      const eased = cosineEase(localProgress);
      offsets[spec.id] = totalLen * (1 - eased);
    }

    const textDrawProgress = cosineEase((t - 60) / 1100);

    const fillEase =
      t <= FILL_START_MS
        ? 0
        : t >= FILL_START_MS + FILL_DURATION_MS
          ? 1
          : cosineEase((t - FILL_START_MS) / FILL_DURATION_MS);

    let groupOpacity = 1;
    if (t > HOLD_END_MS) {
      const fadeProgress = cosineEase((t - HOLD_END_MS) / (CYCLE_MS - HOLD_END_MS));
      groupOpacity = 1 - fadeProgress;
    }

    return {
      outlineOpacity: 1 - fillEase,
      fillOpacity: fillEase,
      textOutlineOpacity: textDrawProgress * (1 - fillEase),
      textFillOpacity: Math.max(fillEase, textDrawProgress * 0.25 * (1 - fillEase)),
      groupOpacity,
      strokeOffsets: offsets,
    };
  }, [elapsedMs, lengths, prefersReducedMotion]);

  const showRasterFill = logoLoaded && !logoError;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="lumina-splash-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Cargando logotipo LUMINA"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
          style={{ backgroundColor: "#182b35" }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-6 select-none"
        >
          <div
            style={{ opacity: visualState.groupOpacity }}
            className="flex w-full items-center justify-center"
          >
            <svg
              viewBox="8 8 214 60"
              className="h-auto w-[84vw] max-w-[620px] sm:w-[58vw]"
              role="img"
              aria-label="Logotipo completo LUMINA"
            >
              <g style={{ opacity: visualState.fillOpacity }}>
                {showRasterFill ? (
                  <image
                    href={logoMark}
                    x="14"
                    y="14"
                    width="40"
                    height="44"
                    preserveAspectRatio="xMidYMid meet"
                  />
                ) : (
                  <g fill="#faf6f9" fillOpacity="0.16" stroke="#f5edde" strokeWidth="1.2">
                    <rect x="14" y="14" width="38" height="40" rx="6" />
                    <path d="M 19 20 L 33 46 L 47 20" fill="none" />
                  </g>
                )}
              </g>

              <text
                x="66"
                y="36"
                fill="#faf6f9"
                fillOpacity={visualState.textFillOpacity}
                stroke="#f5edde"
                strokeWidth="0.35"
                strokeOpacity={visualState.textOutlineOpacity}
                className="font-display text-[21px] tracking-[0.22em] uppercase"
              >
                LUMINA
              </text>

              <text
                x="67"
                y="54"
                fill="#f5edde"
                fillOpacity={visualState.fillOpacity * 0.85 + visualState.textOutlineOpacity * 0.35}
                className="font-sans text-[5.6px] tracking-[0.22em] uppercase"
              >
                BIENESTAR Y CUIDADO FACIAL
              </text>

              <g
                style={{ opacity: visualState.outlineOpacity }}
                fill="none"
                stroke="#f5edde"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {OUTLINE_STROKES.map((spec) => {
                  const totalLen = lengths[spec.id] ?? 140;
                  const dashOffset = visualState.strokeOffsets[spec.id] ?? totalLen;
                  return (
                    <path
                      key={spec.id}
                      ref={(el) => {
                        pathRefs.current[spec.id] = el;
                      }}
                      d={spec.d}
                      strokeDasharray={totalLen}
                      strokeDashoffset={dashOffset}
                    />
                  );
                })}
              </g>
            </svg>

            <img
              src={logoMark}
              alt=""
              aria-hidden="true"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoError(true)}
              className="hidden"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}