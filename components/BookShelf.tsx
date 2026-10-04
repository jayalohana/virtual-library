"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, useScroll } from "framer-motion";
import type { Book } from "@/types/book";
import { BookSpine } from "./BookSpine";
import { BookHoverNote } from "./BookHoverNote";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface BookShelfProps {
  books: Book[];
  query: string;
  onSelect: (book: Book) => void;
  /** hide the walnut plank — the books themselves form the shelf line */
  showPlank?: boolean;
  /** uniform presence scaling for hero-sized shelves */
  sizeScale?: number;
}

function wave(dist: number, peak: number, sigma: number) {
  return peak * Math.exp(-(dist * dist) / (2 * sigma * sigma));
}

export function BookShelf({
  books,
  query,
  onSelect,
  showPlank = true,
  sizeScale = 1,
}: BookShelfProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const layoutCenters = useRef<number[]>([]);
  const [focus, setFocus] = useState<number | null>(null);
  const focusRef = useRef<number | null>(null);
  const cursor = useRef<{ x: number; inside: boolean }>({ x: 0, inside: false });
  const lastInteract = useRef(0);
  const dir = useRef<1 | -1>(1);
  const slow = useRef(1);
  const [coarse, setCoarse] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1100,
  );
  const reducedMotion = usePrefersReducedMotion();
  const { scrollY } = useScroll();

  // recompute layout centers (transform-free, so magnification can't feed back)
  const measure = () => {
    layoutCenters.current = itemRefs.current.map((el) =>
      el ? el.offsetLeft + el.offsetWidth / 2 : 0,
    );
  };

  useEffect(() => {
    measure();
  }, [books]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onCoarse = (e: MediaQueryListEvent) => setCoarse(e.matches);
    const onResize = () => {
      setNarrow(window.innerWidth < 1100);
      measure();
    };
    mq.addEventListener("change", onCoarse);
    window.addEventListener("resize", onResize);
    // webfonts shift layout — remeasure shortly after mount
    const t = setTimeout(measure, 600);
    return () => {
      mq.removeEventListener("change", onCoarse);
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  // vertical scroll → subtle horizontal nudge
  useEffect(() => {
    if (reducedMotion) return;
    let prev = scrollY.get();
    const unsub = scrollY.on("change", (y) => {
      const el = viewportRef.current;
      if (!el) return;
      el.scrollLeft += (y - prev) * 0.12;
      prev = y;
    });
    return unsub;
  }, [scrollY, reducedMotion]);

  // wheel over the shelf → horizontal scroll, with boundary release.
  // Native non-passive listener (React's onWheel can't preventDefault).
  // If the shelf can't move further in the wheel's direction, we do nothing
  // and the page scrolls vertically instead — never a scroll trap.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      lastInteract.current = performance.now();
      if (coarse || reducedMotion) return;
      if (e.ctrlKey) return; // trackpad pinch-zoom — leave to the browser
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      // Natural horizontal trackpad gestures pass through untouched.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;
      const EPS = 1;
      const canMove =
        (e.deltaY > 0 && el.scrollLeft < max - EPS) ||
        (e.deltaY < 0 && el.scrollLeft > EPS);
      if (!canMove) return; // at a boundary → normal page scroll
      e.preventDefault();
      el.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [coarse, reducedMotion]);

  // one rAF loop: idle auto-drift (native scroll) + continuous dock focus
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const interactive = coarse || reducedMotion;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const el = viewportRef.current;

      if (el && !interactive && books.length > 0) {
        // --- drift: slow ping-pong autoscroll, eased near the ends ---
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          const target = cursor.current.inside ? 0.22 : 1;
          slow.current += (target - slow.current) * 0.05;
          const idle = now - lastInteract.current > 3500;
          if (idle) {
            const edge = 120;
            const distToEdge =
              dir.current === 1 ? max - el.scrollLeft : el.scrollLeft;
            const ease = Math.min(1, Math.max(0.15, distToEdge / edge));
            el.scrollLeft += dir.current * (0.016 * dt) * slow.current * ease;
            if (el.scrollLeft >= max - 1) dir.current = -1;
            if (el.scrollLeft <= 1) dir.current = 1;
          }
        }

        // --- dock: continuous fractional focus from cursor distance ---
        if (cursor.current.inside) {
          if (layoutCenters.current.length !== books.length) measure();
          const rect = el.getBoundingClientRect();
          const x = cursor.current.x;
          const centers = layoutCenters.current;
          let f: number | null = null;
          let best = Infinity;
          for (let i = 0; i < centers.length; i++) {
            const sx = rect.left + centers[i] - el.scrollLeft;
            const d = Math.abs(x - sx);
            if (d < best) best = d;
          }
          if (best < 200) {
            // fractional index by interpolating between neighboring centers
            let lo = 0;
            for (let i = 0; i < centers.length; i++) {
              const sx = rect.left + centers[i] - el.scrollLeft;
              if (sx <= x) lo = i;
            }
            const hi = Math.min(lo + 1, centers.length - 1);
            const sxLo = rect.left + centers[lo] - el.scrollLeft;
            const sxHi = rect.left + centers[hi] - el.scrollLeft;
            f =
              hi === lo || sxHi === sxLo
                ? lo
                : lo + (x - sxLo) / (sxHi - sxLo);
            f = Math.max(0, Math.min(centers.length - 1, f));
          }
          const prevF = focusRef.current;
          if (
            (f === null && prevF !== null) ||
            (f !== null &&
              (prevF === null || Math.abs(f - prevF) > 0.004))
          ) {
            focusRef.current = f;
            setFocus(f);
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [books.length, coarse, reducedMotion]);

  const q = query.trim().toLowerCase();
  const peak = narrow ? 0.22 : 0.36;
  const activeIndex =
    focus === null || coarse || reducedMotion ? null : Math.round(focus);

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        onMouseMove={(e) => {
          cursor.current = { x: e.clientX, inside: true };
        }}
        onMouseLeave={() => {
          cursor.current.inside = false;
          focusRef.current = null;
          setFocus(null);
        }}
        onPointerDown={() => {
          lastInteract.current = performance.now();
        }}
        onWheel={() => {
          lastInteract.current = performance.now();
        }}
        onTouchStart={() => {
          lastInteract.current = performance.now();
        }}
        className="no-scrollbar overflow-x-auto overflow-y-visible"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0, black 36px, black calc(100% - 36px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, black 36px, black calc(100% - 36px), transparent 100%)",
        }}
      >
        <div className="w-max min-w-full">
          <div className="flex items-end justify-center gap-[3px] px-3 pt-44">
            {books.map((book, i) => {
              const dist =
                focus === null || coarse || reducedMotion
                  ? Infinity
                  : Math.abs(i - focus);
              const scale =
                focus === null || coarse || reducedMotion
                  ? 1
                  : 1 + wave(dist, peak, 0.9);
              const lift =
                focus === null || coarse || reducedMotion
                  ? 0
                  : -wave(dist, 15, 1.0);
              const pushX =
                focus === null || coarse || reducedMotion
                  ? 0
                  : Math.sign(i - (focus ?? 0)) * wave(dist, 9, 1.1);
              const dimmed =
                q.length > 1 &&
                !`${book.title} ${book.author}`.toLowerCase().includes(q);
              const isActive = activeIndex === i;
              const align =
                i < 2 ? "left" : i > books.length - 3 ? "right" : "center";
              return (
                <div
                  key={book.id}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="relative flex items-end"
                >
                  <AnimatePresence>
                    {isActive && (
                      <BookHoverNote key="note" book={book} align={align} />
                    )}
                  </AnimatePresence>
                  <BookSpine
                    book={book}
                    scale={Number(scale.toFixed(3))}
                    lift={Number(lift.toFixed(2))}
                    pushX={Number(pushX.toFixed(2))}
                    zIndex={
                      activeIndex === null
                        ? 1
                        : 30 - Math.min(14, Math.round(dist * 3))
                    }
                    dimmed={dimmed}
                    onSelect={onSelect}
                    reducedMotion={reducedMotion}
                    compact={narrow && !coarse}
                    sizeScale={sizeScale}
                  />
                </div>
              );
            })}
          </div>

          {/* walnut plank — hidden on hero shelves so books form the line */}
          {showPlank ? (
            <div className="px-[3vw]">
              <div className="wood-shelf h-[13px]">
                <div className="absolute -bottom-4 left-10 hidden h-4 w-2 bg-[#38251a] md:block" />
                <div className="absolute -bottom-4 right-10 hidden h-4 w-2 bg-[#38251a] md:block" />
              </div>
              <div
                className="h-8"
                style={{
                  boxShadow: "0 22px 26px -20px rgba(43,33,24,0.45)",
                }}
              />
            </div>
          ) : (
            <div className="h-5" />
          )}

          {books.length === 0 && (
            <p className="font-serif-display px-6 pb-10 text-center text-[17px] italic text-[#5f5347]">
              Nothing on this part of the shelf — try another genre.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
