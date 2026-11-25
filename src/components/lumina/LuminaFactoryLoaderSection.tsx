import { useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import logoMark from "@/assets/lumina-logo-mark.png";
import { cn } from "@/lib/utils";

const CYCLE_MS = 5600;
const DRAW_END_MS = 3100;
const FILL_START_MS = 3100;
const FILL_DURATION_MS = 700;
const HOLD_END_MS = 5000;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function cosineEase(t: number): number {
  const c = clamp01(t);
  return 0.5 - 0.5 * Math.cos(Math.PI * c);
}

interface StrokeSpec {
  id: string;
  d: string;
  delayMs: number;
  durationMs: number;
}

const OUTLINE_STROKES: StrokeSpec[] = [
  // Contorno envolvente y trazos editoriales del emblema y wordmark LUMINA
  { id: "frame-outer", d: "M 18 14 H 142 V 62 H 18 Z", delayMs: 0, durationMs: 2650 },
  { id: "mark-diamond", d: "M 44 22 L 58 38 L 44 54 L 30 38 Z", delayMs: 90, durationMs: 2650 },
  { id: "mark-core", d: "M 44 28 L 51 38 L 44 48 L 37 38 Z", delayMs: 180, durationMs: 2650 },
  { id: "accent-arc", d: "M 26 56 Q 44 60 62 56", delayMs: 270, durationMs: 2650 },
  { id: "accent-line", d: "M 72 47 H 134", delayMs: 360, durationMs: 2650 },

  // Trazos de las letras L - U - M - I - N - A
  { id: "letter-l", d: "M 72 24 V 41 H 81", delayMs: 120, durationMs: 2200 },
  { id: "letter-u", d: "M 85 24 V 36 A 4.5 4.5 0 0 0 94 36 V 24", delayMs: 150, durationMs: 2200 },
  { id: "letter-m", d: "M 99 41 V 24 L 105 33 L 111 24 V 41", delayMs: 185, durationMs: 2200 },
  { id: "letter-i", d: "M 116 24 V 41", delayMs: 215, durationMs: 2200 },
  { id: "letter-n", d: "M 121 41 V 24 L 130 41 V 24", delayMs: 245, durationMs: 2200 },
  { id: "letter-a", d: "M 134 41 L 138.5 24 L 143 41 M 135.6 35.5 H 141.4", delayMs: 280, durationMs: 2200 },
];

export function LuminaFactoryLoaderSection() {
  const uid = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();

  const sectionRef = useRef<HTMLElement | null>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [lengths, setLengths] = useState<Record<string, number>>({});

  const [elapsedMs, setElapsedMs] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageHidden, setPageHidden] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Medir longitudes reales de cada contorno SVG
  useEffect(() => {
    const measured: Record<string, number> = {};
    for (const spec of OUTLINE_STROKES) {
      const el = pathRefs.current[spec.id];
      if (el && typeof el.getTotalLength === "function") {
        measured[spec.id] = Math.max(1, el.getTotalLength());
      } else {
        measured[spec.id] = 120;
      }
    }
    setLengths(measured);
  }, []);

  // Predecodificar imagen del logo si es posible
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.src = logoMark;
    img.decode?.()
      .then(() => {
        if (active) setLogoLoaded(true);
      })
      .catch(() => {
        // Si no decodifica aún, se apoya en onLoad / onError del <img>
      });
    return () => {
      active = false;
    };
  }, []);

  // Observar visibilidad en viewport y estado de pestaña/página
  useEffect(() => {
    const sectionEl = sectionRef.current;
    let observer: IntersectionObserver | null = null;

    if (sectionEl && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setInView(Boolean(entry?.isIntersecting));
        },
        { threshold: 0.15 },
      );
      observer.observe(sectionEl);
    }

    const syncVisibility = () => {
      setPageHidden(document.hidden);
    };

    const handlePageHide = () => setPageHidden(true);
    const handlePageShow = () => setPageHidden(document.hidden);

    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const isSuspended = manualPaused || !inView || pageHidden || Boolean(prefersReducedMotion);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
  }, []);

  const handleReplay = useCallback(() => {
    stopRaf();
    elapsedRef.current = 0;
    setElapsedMs(0);
    setManualPaused(false);
  }, [stopRaf]);

  const handleTogglePause = useCallback(() => {
    if (prefersReducedMotion) return;
    setManualPaused((prev) => !prev);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      stopRaf();
      elapsedRef.current = FILL_START_MS + FILL_DURATION_MS;
      setElapsedMs(FILL_START_MS + FILL_DURATION_MS);
      return;
    }

    if (isSuspended) {
      stopRaf();
      return;
    }

    const step = (now: number) => {
      if (lastFrameRef.current !== null) {
        const dt = Math.min(100, Math.max(0, now - lastFrameRef.current));
        elapsedRef.current = (elapsedRef.current + dt) % CYCLE_MS;
        setElapsedMs(elapsedRef.current);
      }
      lastFrameRef.current = now;
      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => stopRaf();
  }, [isSuspended, prefersReducedMotion, stopRaf]);

  const visualState = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        outlineOpacity: 0,
        fillOpacity: 1,
        groupOpacity: 1,
        strokeOffsets: Object.fromEntries(OUTLINE_STROKES.map((s) => [s.id, 0])),
      };
    }

    const t = elapsedMs;

    const offsets: Record<string, number> = {};
    for (const spec of OUTLINE_STROKES) {
      const totalLen = lengths[spec.id] ?? 120;
      const localProgress = (t - spec.delayMs) / spec.durationMs;
      const eased = cosineEase(localProgress);
      offsets[spec.id] = totalLen * (1 - eased);
    }

    // Crossfade de contorno a relleno entre 3100ms y 3800ms
    const fillEase =
      t <= FILL_START_MS
        ? 0
        : t >= FILL_START_MS + FILL_DURATION_MS
          ? 1
          : cosineEase((t - FILL_START_MS) / FILL_DURATION_MS);

    // Hold de 3800ms a 5000ms y fade out final de 5000ms a 5600ms
    let groupOpacity = 1;
    if (t > HOLD_END_MS) {
      const fadeProgress = cosineEase((t - HOLD_END_MS) / (CYCLE_MS - HOLD_END_MS));
      groupOpacity = 1 - fadeProgress;
    }

    return {
      outlineOpacity: 1 - fillEase,
      fillOpacity: fillEase,
      groupOpacity,
      strokeOffsets: offsets,
    };
  }, [elapsedMs, lengths, prefersReducedMotion]);

  const showRasterFill = logoLoaded && !logoError;
  const clipId = `lumina-loader-clip-${uid}`;

  return (
    <section
      ref={sectionRef}
      aria-label="Animación de carga del logotipo LUMINA"
      style={{ backgroundColor: "#182b35" }}
      className="relative flex min-h-[75vh] w-full items-center justify-center overflow-hidden px-6 py-24 select-none"
    >
      <div
        style={{ opacity: visualState.groupOpacity }}
        className="flex w-full max-w-[620px] flex-col items-center justify-center gap-6"
      >
        <svg
          viewBox="14 10 134 56"
          className="h-auto w-[84vw] max-w-[620px] sm:w-[58vw]"
          role="img"
          aria-label="Logotipo animado LUMINA"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="26" y="18" width="36" height="42" rx="10" />
            </clipPath>
          </defs>

          {/* Grupo de relleno (imagen del logo + tipografía cálida #faf6f9 o respaldo legible) */}
          <g style={{ opacity: visualState.fillOpacity }}>
            {showRasterFill ? (
              <image
                href={logoMark}
                x="26"
                y="18"
                width="36"
                height="42"
                preserveAspectRatio="xMidYMid meet"
                clipPath={`url(#${clipId})`}
              />
            ) : (
              <g fill="#faf6f9" fillOpacity="0.14" stroke="#f5edde" strokeWidth="1.2">
                <polygon points="44,22 58,38 44,54 30,38" />
                <polygon points="44,28 51,38 44,48 37,38" />
              </g>
            )}

            <text
              x="72"
              y="39"
              fill="#faf6f9"
              className="font-display text-[22px] tracking-[0.22em] uppercase"
            >
              LUMINA
            </text>
            <text
              x="73"
              y="53"
              fill="#f5edde"
              fillOpacity="0.78"
              className="font-sans text-[7px] tracking-[0.26em] uppercase"
            >
              BIENESTAR Y PIEL
            </text>
          </g>

          {/* Grupo de trazos / contornos */}
          <g
            style={{ opacity: visualState.outlineOpacity }}
            fill="none"
            stroke="#f5edde"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {OUTLINE_STROKES.map((spec) => {
              const totalLen = lengths[spec.id] ?? 120;
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

        {/* Imagen oculta de carga/decodificación para el estado lleno */}
        <img
          src={logoMark}
          alt=""
          aria-hidden="true"
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoError(true)}
          className="hidden"
        />
      </div>

      {/* Controles discretos abajo a la derecha */}
      <div className="absolute right-5 bottom-5 flex items-center gap-2">
        <button
          type="button"
          disabled={Boolean(prefersReducedMotion)}
          onClick={handleTogglePause}
          aria-label={manualPaused ? "Reanudar animación" : "Pausar animación"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-[#f5edde]/20 bg-[#182b35]/90 text-[#faf6f9] transition-all duration-150 ease-out hover:border-[#f5edde]/50 hover:bg-[#223b48] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5edde]",
            prefersReducedMotion && "cursor-not-allowed opacity-40",
          )}
        >
          {manualPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        <button
          type="button"
          disabled={Boolean(prefersReducedMotion)}
          onClick={handleReplay}
          aria-label="Reiniciar animación"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-[#f5edde]/20 bg-[#182b35]/90 text-[#faf6f9] transition-all duration-150 ease-out hover:border-[#f5edde]/50 hover:bg-[#223b48] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5edde]",
            prefersReducedMotion && "cursor-not-allowed opacity-40",
          )}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}