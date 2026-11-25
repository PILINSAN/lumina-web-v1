import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { getEditorial } from "@/data/products";
import { formatCOP } from "@/lib/format";
import { displayName, productsQueryOptions } from "@/lib/shopify";

interface ProductStyleTheme {
  labelBg: string;
  bandHex: string;
  accentHex: string;
  textHex: string;
  bodyHex: number;
  capType: "dropper" | "spray";
  backdropGradient: string;
}

interface ProductCylinderSpec extends ProductStyleTheme {
  id: string;
  handle: string;
  title: string;
  category: string;
  priceText: string;
}

const CATALOG_THEMES: ReadonlyArray<ProductStyleTheme> = [
  {
    labelBg: "#FBF0E1",
    bandHex: "#3A1E0E",
    accentHex: "#E08A3C",
    textHex: "#2A1509",
    bodyHex: 0xf59536,
    capType: "spray",
    backdropGradient: "radial-gradient(circle at 50% 48%, #3c2313 0%, #1b110b 65%, #0d0805 100%)",
  },
  {
    labelBg: "#FBF1E6",
    bandHex: "#4B1418",
    accentHex: "#D97A36",
    textHex: "#2D0C0E",
    bodyHex: 0xd93829,
    capType: "dropper",
    backdropGradient: "radial-gradient(circle at 50% 48%, #223b32 0%, #101d19 65%, #080e0c 100%)",
  },
  {
    labelBg: "#F4EFE2",
    bandHex: "#153B2E",
    accentHex: "#389E7C",
    textHex: "#112E24",
    bodyHex: 0x229970,
    capType: "dropper",
    backdropGradient: "radial-gradient(circle at 50% 48%, #3a2618 0%, #1b130c 65%, #0d0906 100%)",
  },
  {
    labelBg: "#F6EFE0",
    bandHex: "#1D3A2B",
    accentHex: "#C8A97E",
    textHex: "#162C20",
    bodyHex: 0x2f875b,
    capType: "dropper",
    backdropGradient: "radial-gradient(circle at 50% 48%, #283525 0%, #131a12 65%, #090d09 100%)",
  },
  {
    labelBg: "#EEF3FA",
    bandHex: "#173766",
    accentHex: "#E68238",
    textHex: "#102547",
    bodyHex: 0x246fd1,
    capType: "dropper",
    backdropGradient: "radial-gradient(circle at 50% 48%, #382416 0%, #1a110b 65%, #0d0805 100%)",
  },
  {
    labelBg: "#FDF0E8",
    bandHex: "#5C1916",
    accentHex: "#E06D3B",
    textHex: "#360E0C",
    bodyHex: 0xe0482b,
    capType: "dropper",
    backdropGradient: "radial-gradient(circle at 50% 48%, #1d362d 0%, #0e1a16 65%, #070d0b 100%)",
  },
];

function resolveThemeForProduct(handle: string, title: string, idx: number): ProductStyleTheme {
  const key = `${handle} ${title}`.toLowerCase();
  if (key.includes("melaxin") || key.includes("peel")) return CATALOG_THEMES[0];
  if (key.includes("drenador") || (key.includes("linfatico") && !key.includes("x2") && !key.includes("natures"))) {
    return CATALOG_THEMES[2];
  }
  if (key.includes("natures") || key.includes("drainage")) return CATALOG_THEMES[3];
  if (key.includes("antihongo") || key.includes("hongo")) return CATALOG_THEMES[4];
  if (key.includes("berberine") && key.includes("apoyo")) return CATALOG_THEMES[5];
  if (key.includes("berberine")) return CATALOG_THEMES[1];
  return CATALOG_THEMES[idx % CATALOG_THEMES.length];
}

const SPACING = 3.5;
const OPENING_DURATION = 1.0;

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const power4Out = (p: number) => 1 - Math.pow(1 - clamp(p, 0, 1), 4);

function wrapRange(val: number, halfSpan: number): number {
  const span = halfSpan * 2;
  return ((((val + halfSpan) % span) + span) % span) - halfSpan;
}

function createCylinderWrapCanvas(spec: ProductCylinderSpec): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 802;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;

  const bgGrad = ctx.createLinearGradient(0, 0, w, 0);
  bgGrad.addColorStop(0, spec.labelBg);
  bgGrad.addColorStop(0.5, "#FFFFFF");
  bgGrad.addColorStop(1, spec.labelBg);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = spec.bandHex;
  ctx.fillRect(0, 0, w, 122);
  ctx.fillRect(0, h - 122, w, 122);

  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(0, 122, w, 9);
  ctx.fillRect(0, h - 131, w, 9);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FAF8F4";
  ctx.font = '600 38px "Cormorant Garamond", Georgia, serif';
  ctx.fillText("LUMINA", cx, 63);

  ctx.fillStyle = spec.accentHex;
  ctx.font = '700 16px "Inter", system-ui, sans-serif';
  ctx.fillText(`●  ${spec.category.toUpperCase()}  ●`, cx, 178);

  ctx.fillStyle = spec.textHex;
  ctx.font = '700 35px "Inter", system-ui, sans-serif';
  const shortTitle = spec.title.length > 26 ? `${spec.title.slice(0, 24)}…` : spec.title;
  ctx.fillText(shortTitle.toUpperCase(), cx, 332);

  ctx.fillStyle = spec.bandHex;
  ctx.fillRect(0, 400, w, 46);

  ctx.fillStyle = spec.accentHex;
  ctx.fillRect(0, 400, w, 2);
  ctx.fillRect(0, 444, w, 2);

  ctx.fillStyle = "#FAF8F4";
  ctx.font = '600 16px "Inter", system-ui, sans-serif';
  ctx.fillText("FÓRMULA BOTÁNICA CONCENTRADA · USO DIARIO", cx, 423);

  ctx.fillStyle = spec.textHex;
  ctx.font = '700 30px "Inter", system-ui, sans-serif';
  ctx.fillText(spec.priceText, cx, 528);

  ctx.fillStyle = "#FAF8F4";
  ctx.font = '600 17px "Inter", system-ui, sans-serif';
  ctx.fillText("ENVÍO A TODA COLOMBIA · PAGO CONTRAENTREGA", cx, h - 61);

  return canvas;
}

export function OrbitalClusterSection() {
  const { data: shopifyProducts } = useSuspenseQuery(productsQueryOptions);
  const headingId = useId();

  const sectionRef = useRef<HTMLElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [labelVisible, setLabelVisible] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [nearViewport, setNearViewport] = useState(true);
  const [webglFailed, setWebglFailed] = useState(false);

  const items = useMemo<ProductCylinderSpec[]>(() => {
    return shopifyProducts.map((sp, idx) => {
      const editorial = getEditorial(sp.node.handle);
      const title = displayName(sp);
      const theme = resolveThemeForProduct(sp.node.handle, title, idx);
      const amount = sp.node.priceRange?.minVariantPrice?.amount;
      return {
        id: sp.node.id,
        handle: sp.node.handle,
        title,
        category: editorial?.category ?? "Bienestar",
        priceText: amount ? `${formatCOP(amount)} COP` : "Contraentrega",
        ...theme,
      };
    });
  }, [shopifyProducts]);

  const count = Math.max(1, items.length);

  const pausedRef = useRef(false);
  const reducedRef = useRef(false);
  const selectedIndexRef = useRef(0);
  const targetPosRef = useRef(0);
  const posRef = useRef(0);
  const elapsedRef = useRef(0);
  const pointerSmoothRef = useRef({ x: 0, y: 0 });
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    lastDelta: number;
    horizontalLocked: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    lastDelta: 0,
    horizontalLocked: false,
  });

  pausedRef.current = paused;
  reducedRef.current = reducedMotion;

  const transitionToIndex = (normalized: number) => {
    if (normalized === selectedIndexRef.current) return;
    selectedIndexRef.current = normalized;

    if (reducedRef.current) {
      setSelectedIndex(normalized);
      setLabelVisible(true);
      return;
    }

    setLabelVisible(false);
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
    }
    fadeTimerRef.current = window.setTimeout(() => {
      setSelectedIndex(normalized);
      setLabelVisible(true);
      fadeTimerRef.current = null;
    }, 90);
  };

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  const selectFlavor = (nextIdx: number, announce = true) => {
    const normalized = ((nextIdx % count) + count) % count;
    const currentIdx = ((Math.round(targetPosRef.current / SPACING) % count) + count) % count;

    let diff = normalized - currentIdx;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;

    const baseTarget = Math.round(targetPosRef.current / SPACING) * SPACING;
    const finalTarget = baseTarget + diff * SPACING;

    targetPosRef.current = finalTarget;
    transitionToIndex(normalized);

    if (reducedRef.current) {
      posRef.current = finalTarget;
      elapsedRef.current = OPENING_DURATION;
    }

    if (announce && items[normalized]) {
      setAnnouncement(`Producto seleccionado: ${items[normalized].title}`);
    }
  };

  const stepBy = (deltaSteps: number) => {
    selectFlavor(selectedIndexRef.current + deltaSteps, true);
  };

  const handleReplay = () => {
    elapsedRef.current = reducedMotion ? OPENING_DURATION : 0;
    pointerTargetRef.current = { x: 0, y: 0 };
    pointerSmoothRef.current = { x: 0, y: 0 };
    targetPosRef.current = 0;
    posRef.current = 0;
    transitionToIndex(0);
    setSelectedIndex(0);
    setLabelVisible(true);
    setPaused(false);
    if (items[0]) {
      setAnnouncement(`Reiniciado en: ${items[0].title}`);
    }
  };

  const handleNavigateToProduct = (e: React.MouseEvent<HTMLAnchorElement>, handle: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const nextUrl = `/product/${handle}`;
    window.history.pushState({}, "", nextUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReducedMotion(mq.matches);
      if (mq.matches) {
        elapsedRef.current = OPENING_DURATION;
        posRef.current = targetPosRef.current;
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (nearViewport) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          io.disconnect();
        }
      },
      { rootMargin: "500px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nearViewport]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const onPointerDown = (e: PointerEvent) => {
      dragStateRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastTime: performance.now(),
        lastDelta: 0,
        horizontalLocked: e.pointerType !== "touch",
      };
      if (e.pointerType !== "touch") {
        host.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerTargetRef.current = {
        x: e.clientX - (rect.left + rect.width / 2),
        y: e.clientY - (rect.top + rect.height / 2),
      };

      const st = dragStateRef.current;
      if (!st.active) return;

      const dxTotal = e.clientX - st.startX;
      const dyTotal = e.clientY - st.startY;

      if (!st.horizontalLocked) {
        if (Math.abs(dxTotal) > 8 && Math.abs(dxTotal) > Math.abs(dyTotal)) {
          st.horizontalLocked = true;
        } else if (Math.abs(dyTotal) > 8) {
          st.active = false;
          return;
        } else {
          return;
        }
      }

      const now = performance.now();
      const dx = e.clientX - st.lastX;
      st.lastDelta = dx;
      st.lastX = e.clientX;
      st.lastTime = now;

      targetPosRef.current -= dx * 0.02;
    };

    const finishDrag = () => {
      const st = dragStateRef.current;
      if (!st.active) return;
      st.active = false;

      if (st.horizontalLocked) {
        const within100ms = performance.now() - st.lastTime <= 100;
        const throwOffset = within100ms ? -st.lastDelta * 0.22 : 0;
        const snapped = Math.round((targetPosRef.current + throwOffset) / SPACING) * SPACING;
        targetPosRef.current = snapped;

        const idx = ((Math.round(snapped / SPACING) % count) + count) % count;
        if (idx !== selectedIndexRef.current) {
          transitionToIndex(idx);
          if (items[idx]) {
            setAnnouncement(`Producto seleccionado: ${items[idx].title}`);
          }
        }
      }
    };

    host.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      host.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [count, items]);

  useEffect(() => {
    if (!nearViewport) return;
    const host = canvasHostRef.current;
    const section = sectionRef.current;
    if (!host || !section) return;

    let disposed = false;
    let rafId = 0;
    let isVisible = true;
    const cleanupFns: Array<() => void> = [];

    (async () => {
      try {
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
        ]);
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";
        renderer.domElement.style.touchAction = "pan-y";
        host.innerHTML = "";
        host.appendChild(renderer.domElement);

        const onContextLost = (e: Event) => {
          e.preventDefault();
          setWebglFailed(true);
        };
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);
        cleanupFns.push(() => renderer.domElement.removeEventListener("webglcontextlost", onContextLost));

        const scene = new THREE.Scene();

        const pmrem = new THREE.PMREMGenerator(renderer);
        const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = envRT.texture;
        pmrem.dispose();

        const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 200);
        camera.position.set(0, 0, 31.5);

        const keyLight = new THREE.DirectionalLight(0xfff8eb, 1.45);
        keyLight.position.set(6, 10, 14);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0xd9ecff, 0.95);
        rimLight.position.set(-8, -4, 10);
        scene.add(rimLight);

        const spotA = new THREE.SpotLight(0xffffff, 25, 8, Math.PI / 4, 1, 0.1);
        spotA.position.set(0, 3.5, 0);
        spotA.target.position.set(0, 0, 1);
        scene.add(spotA, spotA.target);

        const spotB = new THREE.SpotLight(0xffffff, 25, 8, Math.PI / 4, 1, 0.1);
        spotB.position.set(0, -3, 2);
        spotB.target.position.set(0, 0, 1.8);
        scene.add(spotB, spotB.target);

        const bodyGeo = new THREE.CylinderGeometry(0.72, 0.72, 3.25, 48, 1, false);
        const baseRingGeo = new THREE.CylinderGeometry(0.732, 0.735, 0.14, 48);
        const neckRingGeo = new THREE.CylinderGeometry(0.37, 0.39, 0.12, 36);
        const shoulderGeo = new THREE.SphereGeometry(0.72, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const labelGeo = new THREE.CylinderGeometry(0.729, 0.729, 2.85, 48, 1, true, 0, Math.PI * 2);
        const collarGeo = new THREE.CylinderGeometry(0.31, 0.36, 0.34, 36);
        const bulbGeo = new THREE.CapsuleGeometry(0.18, 0.36, 10, 20);
        const sprayCapGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.44, 36);

        const metalMat = new THREE.MeshPhysicalMaterial({
          color: 0xd9bb8c,
          metalness: 0.96,
          roughness: 0.11,
          sheen: 0.9,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          envMapIntensity: 4.0,
        });

        const bulbMat = new THREE.MeshPhysicalMaterial({
          color: 0x17201d,
          roughness: 0.24,
          metalness: 0.15,
          clearcoat: 0.85,
          clearcoatRoughness: 0.1,
          envMapIntensity: 2.2,
        });

        const ownedGeometries: Array<{ dispose: () => void }> = [
          bodyGeo,
          baseRingGeo,
          neckRingGeo,
          shoulderGeo,
          labelGeo,
          collarGeo,
          bulbGeo,
          sprayCapGeo,
        ];
        const ownedMaterials: Array<{ dispose: () => void }> = [metalMat, bulbMat];
        const ownedTextures: Array<{ dispose: () => void }> = [];

        const productLabelMats = items.map((item) => {
          const canvas = createCylinderWrapCanvas(item);
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.repeat.set(1, 1);
          tex.anisotropy = 4;
          tex.needsUpdate = true;
          ownedTextures.push(tex);

          const mat = new THREE.MeshPhysicalMaterial({
            map: tex,
            color: 0xf6f6f6,
            metalness: 0.05,
            roughness: 0.22,
            sheen: 0.3,
            clearcoat: 0.78,
            clearcoatRoughness: 0.09,
            envMapIntensity: 1.45,
          });
          ownedMaterials.push(mat);
          return mat;
        });

        const productBodyMats = items.map((item) => {
          const mat = new THREE.MeshPhysicalMaterial({
            color: item.bodyHex,
            metalness: 0.08,
            roughness: 0.04,
            ior: 1.56,
            reflectivity: 1,
            clearcoat: 1,
            clearcoatRoughness: 0.03,
            sheen: 0.25,
            sheenColor: new THREE.Color(0xffffff),
            envMapIntensity: 3.4,
          });
          ownedMaterials.push(mat);
          return mat;
        });

        const totalClones = 24;
        interface CloneEntry {
          group: InstanceType<typeof THREE.Group>;
          shellMesh: InstanceType<typeof THREE.Group>;
        }

        const clones: CloneEntry[] = [];
        for (let i = 0; i < totalClones; i++) {
          const prodIdx = i % items.length;
          const spec = items[prodIdx];
          const group = new THREE.Group();

          const shellMesh = new THREE.Group();
          shellMesh.name = "Shell";
          shellMesh.scale.set(1, 1, 1.15);

          const bodyMesh = new THREE.Mesh(bodyGeo, productBodyMats[prodIdx]);
          const baseRingMesh = new THREE.Mesh(baseRingGeo, productBodyMats[prodIdx]);
          baseRingMesh.position.y = -1.55;

          const neckRingMesh = new THREE.Mesh(neckRingGeo, metalMat);
          neckRingMesh.position.y = 1.76;

          const shoulderMesh = new THREE.Mesh(shoulderGeo, productBodyMats[prodIdx]);
          shoulderMesh.position.y = 1.625;
          shoulderMesh.scale.set(1, 0.34, 1);

          const labelMesh = new THREE.Mesh(labelGeo, productLabelMats[prodIdx]);
          labelMesh.rotation.y = Math.PI / 2;

          const collarMesh = new THREE.Mesh(collarGeo, metalMat);
          collarMesh.name = "Top";
          collarMesh.position.y = 1.94;

          shellMesh.add(bodyMesh, baseRingMesh, neckRingMesh, shoulderMesh, labelMesh, collarMesh);

          if (spec.capType === "spray") {
            const sprayMesh = new THREE.Mesh(sprayCapGeo, metalMat);
            sprayMesh.name = "Bottom";
            sprayMesh.position.y = 2.26;
            shellMesh.add(sprayMesh);
          } else {
            const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
            bulbMesh.name = "Bottom";
            bulbMesh.position.y = 2.3;
            shellMesh.add(bulbMesh);
          }

          group.add(shellMesh);
          scene.add(group);
          clones.push({ group, shellMesh });
        }

        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const onClickHost = (e: MouseEvent) => {
          const st = dragStateRef.current;
          if (Math.abs(e.clientX - st.startX) > 6) return;
          const rect = renderer.domElement.getBoundingClientRect();
          ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(ndc, camera);

          const hits = raycaster.intersectObjects(
            clones.map((c) => c.group),
            true,
          );
          if (hits.length > 0) {
            let obj: InstanceType<typeof THREE.Object3D> | null = hits[0].object;
            while (obj && !clones.some((c) => c.group === obj)) {
              obj = obj.parent;
            }
            if (obj) {
              const hitX = obj.position.x;
              if (Math.abs(hitX) > 0.5) {
                stepBy(hitX > 0 ? 1 : -1);
              }
            }
          }
        };
        renderer.domElement.addEventListener("click", onClickHost);
        cleanupFns.push(() => renderer.domElement.removeEventListener("click", onClickHost));

        let sectionWidth = host.clientWidth || window.innerWidth;
        let isPortrait = false;

        const onResize = () => {
          const w = host.clientWidth || window.innerWidth;
          const h = host.clientHeight || window.innerHeight;
          sectionWidth = Math.max(1, w);
          const aspect = w / Math.max(1, h);
          isPortrait = aspect < 0.8;
          renderer.setSize(w, h, false);
          camera.aspect = aspect;
          camera.updateProjectionMatrix();
        };
        onResize();
        const ro = new ResizeObserver(onResize);
        ro.observe(host);
        cleanupFns.push(() => ro.disconnect());

        const visObserver = new IntersectionObserver(
          (entries) => {
            isVisible = entries.some((e) => e.isIntersecting);
          },
          { threshold: 0.01 },
        );
        visObserver.observe(section);
        cleanupFns.push(() => visObserver.disconnect());

        const onVisibilityChange = () => {
          if (document.hidden) {
            isVisible = false;
          } else {
            const r = section.getBoundingClientRect();
            isVisible = r.bottom > 0 && r.top < window.innerHeight;
          }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        cleanupFns.push(() => document.removeEventListener("visibilitychange", onVisibilityChange));

        let lastNow = performance.now();

        const tick = (now: number) => {
          rafId = requestAnimationFrame(tick);
          const dt = Math.min(0.05, (now - lastNow) / 1000);
          lastNow = now;

          if (!isVisible) return;

          if (!pausedRef.current && !reducedRef.current) {
            elapsedRef.current += dt;
          }

          const damping = 1 - Math.exp(-16 * dt);

          if (!dragStateRef.current.active) {
            const snappedTarget = Math.round(targetPosRef.current / SPACING) * SPACING;
            targetPosRef.current = lerp(targetPosRef.current, snappedTarget, damping);
          }

          posRef.current = lerp(posRef.current, targetPosRef.current, damping);
          pointerSmoothRef.current.x = lerp(pointerSmoothRef.current.x, pointerTargetRef.current.x, damping);
          pointerSmoothRef.current.y = lerp(pointerSmoothRef.current.y, pointerTargetRef.current.y, damping);

          const elapsed = elapsedRef.current;
          const openingDone = reducedRef.current || elapsed >= OPENING_DURATION;

          const q = openingDone ? 1 : power4Out(elapsed / OPENING_DURATION);
          const spacing = openingDone ? 1 : lerp(2.2, 1, q);
          const wave = openingDone ? 1 : q;

          const camZBase = openingDone ? 31.5 : lerp(29.5, 31.5, q);
          camera.position.z = isPortrait ? camZBase * 1.08 : camZBase;

          const lightBase = openingDone ? 50 : lerp(25, 50, q);
          const halfLight = lightBase * 0.5;
          const spotAngle = (Math.PI / 4) * (1.4 - 0.4 * q);
          spotA.intensity = halfLight;
          spotB.intensity = halfLight;
          spotA.angle = spotAngle;
          spotB.angle = spotAngle;

          const ratio = clamp(1440 / sectionWidth, 1, 2.4);

          for (let i = 0; i < clones.length; i++) {
            const c = clones[i];
            const x = wrapRange(i * SPACING - posRef.current, 42);
            const influence = clamp(1 - Math.abs(x) / 3.5, 0, 1);

            const yawPtr = (pointerSmoothRef.current.x / 1280) * 0.2 * influence;
            const pitchPtr = (pointerSmoothRef.current.y / 1280) * 0.2 * influence;

            if (openingDone) {
              c.group.position.set(x, Math.sin(x * 0.25 * ratio), -Math.abs(x) - 0.2);
              c.group.rotation.set(-Math.PI / 9 + pitchPtr, x * 0.5 - Math.PI / 9 + yawPtr, Math.PI / 16);
              c.group.scale.setScalar(0.94);
              c.shellMesh.rotation.z = c.group.rotation.y * 0.6;
            } else {
              const canX = x * spacing;
              const y = Math.sin(canX * 0.25 * ratio * wave);
              const z = (-Math.abs(x) - 0.2) * wave;
              c.group.position.set(canX, y, z);
              c.group.rotation.set(
                (-Math.PI / 9) * wave + pitchPtr,
                (canX * 0.5 - Math.PI / 9) * wave + yawPtr,
                (Math.PI / 16) * wave,
              );
              c.group.scale.setScalar(0.94);
              c.shellMesh.rotation.z =
                c.group.rotation.y * 0.6 + (Math.PI / 9) * (1 - q) * influence;
            }
          }

          renderer.render(scene, camera);
        };

        rafId = requestAnimationFrame(tick);

        cleanupFns.push(() => {
          cancelAnimationFrame(rafId);
          ownedGeometries.forEach((g) => g.dispose());
          ownedMaterials.forEach((m) => m.dispose());
          ownedTextures.forEach((t) => t.dispose());
          envRT.dispose();
          renderer.dispose();
        });
      } catch (err) {
        console.error("OrbitalClusterSection error:", err);
        if (!disposed) setWebglFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, [nearViewport, items]);

  const activeItem = items[selectedIndex] ?? items[0];

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          stepBy(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          stepBy(1);
        }
      }}
      className="relative h-[100svh] w-full overflow-hidden select-none focus:outline-none"
      style={{
        background:
          activeItem?.backdropGradient ??
          "radial-gradient(circle at 50% 48%, #223b32 0%, #101d19 65%, #080e0c 100%)",
        transition: reducedMotion ? undefined : "background 300ms ease",
      }}
    >
      <h2 id={headingId} className="sr-only">
        Carrusel 3D de productos LUMINA
      </h2>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {activeItem && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex flex-col items-center px-4 text-center sm:top-22">
          <div
            className={`rounded-full border border-white/10 bg-black/35 px-4 py-1.5 backdrop-blur-sm transition-all duration-150 ease-out ${
              labelVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
          >
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#D4B483] uppercase">
              {activeItem.category} · {activeItem.priceText}
            </p>
            <h3 className="font-display text-base font-semibold tracking-tight text-white sm:text-xl">
              {activeItem.title}
            </h3>
          </div>
        </div>
      )}

      {!webglFailed ? (
        <div
          ref={canvasHostRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-6 text-white">
          <div className="grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-5">
            {items.map((it) => (
              <div key={it.id} className="rounded-2xl bg-white/10 p-4 text-center">
                <p className="font-display text-lg">LUMINA</p>
                <p className="mt-1 text-xs font-medium">{it.title}</p>
                <p className="mt-1 text-[0.7rem] text-[#C8A97E]">{it.priceText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-3 px-4">
        {activeItem && (
          <a
            href={`/product/${activeItem.handle}`}
            onClick={(e) => handleNavigateToProduct(e, activeItem.handle)}
            className="group pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#D4B483]/50 bg-[#1B3A32]/90 px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase shadow-lg backdrop-blur-md transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[#D4B483] hover:bg-[#234B41] active:scale-x-[1.03] active:scale-y-[0.95] focus-visible:ring-2 focus-visible:ring-[#D4B483] focus-visible:outline-none"
          >
            <span>Ir al producto</span>
            <ArrowUpRight className="h-4 w-4 text-[#D4B483] transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        )}

        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => stepBy(-1)}
            aria-label="Producto anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all duration-150 ease-out hover:scale-105 hover:border-white/50 hover:bg-black/75 active:scale-x-[1.04] active:scale-y-[0.94] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            role="tablist"
            aria-label="Seleccionar producto"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3.5 py-2 backdrop-blur-md"
          >
            {items.map((it, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={it.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Ver ${it.title}`}
                  onClick={() => selectFlavor(idx, true)}
                  className={`h-2.5 rounded-full transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                    isSelected ? "w-6 bg-[#C8A97E]" : "w-2.5 bg-white/35 hover:bg-white/65"
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => stepBy(1)}
            aria-label="Producto siguiente"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all duration-150 ease-out hover:scale-105 hover:border-white/50 hover:bg-black/75 active:scale-x-[1.04] active:scale-y-[0.94] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? "Reanudar animación" : "Pausar animación"}
            className="flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3.5 text-xs font-medium text-white backdrop-blur-md transition-all duration-150 ease-out hover:border-white/50 hover:bg-black/75 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{paused ? "Reanudar" : "Pausar"}</span>
          </button>

          <button
            type="button"
            onClick={handleReplay}
            aria-label="Repetir animación desde el inicio"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all duration-150 ease-out hover:border-white/50 hover:bg-black/75 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {activeItem && (
          <span className="sr-only">
            {activeItem.title} — {activeItem.priceText}
          </span>
        )}
      </div>
    </section>
  );
}