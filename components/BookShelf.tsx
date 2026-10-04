"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const slow = useRef(1);
  const unitWidthRef = useRef(0);
  const measuredForRef = useRef<unknown>(null);
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

  // Search narrows the logical dataset; the loop is built from the result.
  const q = query.trim().toLowerCase();
  const searched = useMemo(
    () =>
      q.length > 1
        ? books.filter((b) =>
            `${b.title} ${b.author}`.toLowerCase().includes(q),
          )
        : books,
    [books, q],
  );

  // Infinite loop: repeat small datasets until one unit comfortably exceeds
  // the viewport, then render three identical units (A | B | C) and rest
  // inside the middle one. Clones share the original book objects — identity
  // (click, hover, search) always resolves to the logical book.
  const rendered = useMemo(() => {
    if (searched.length === 0) return [];
    const rep = Math.max(1, Math.ceil(2000 / (searched.length * 48)));
    const unit: Book[] = [];
    for (let r = 0; r < rep; r++) unit.push(...searched);
    const out: Array<{ book: Book; key: string }> = [];
    for (let c = 0; c < 3; c++)
      for (let r = 0; r < unit.length; r++)
        out.push({ book: unit[r], key: `${c}:${r}:${unit[r].id}` });
    return out;
  }, [searched]);

  // Recompute layout centers (transform-free, so magnification can't feed
  // back) plus one unit width: start-of-B minus start-of-A is exactly one
  // sequence pitch, gaps included, because the pattern repeats.
  const measure = (total: number) => {
    const items = itemRefs.current;
    layoutCenters.current = items.map((el) =>
      el ? el.offsetLeft + el.offsetWidth / 2 : 0,
    );
    const n = Math.round(total / 3);
    if (n > 0 && items.length >= n * 2 && items[0] && items[n]) {
      unitWidthRef.current = items[n].offsetLeft - items[0].offsetLeft;
    } else {
      unitWidthRef.current = 0;
    }
  };

  // Fresh dataset → rebuild in the middle copy. Layout effect so the first
  // paint already sits inside copy B (no visible jump).
  useLayoutEffect(() => {
    measure(rendered.length);
    const el = viewportRef.current;
    const u = unitWidthRef.current;
    if (el && u > 0) el.scrollLeft = u;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onCoarse = (e: MediaQueryListEvent) => setCoarse(e.matches);
    const onResize = () => {
      setNarrow(window.innerWidth < 1100);
      measure(itemRefs.current.length);
    };
    mq.addEventListener("change", onCoarse);
    window.addEventListener("resize", onResize);
    // webfonts shift layout — remeasure shortly after mount
    const t = setTimeout(() => measure(itemRefs.current.length), 600);
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

  // Infinite shelf: no horizontal boundaries exist, so a vertical-dominant
  // wheel always drives the shelf while the pointer is over it. Leaving the
  // shelf restores normal page scrolling — nothing is ever trapped.
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
      e.preventDefault();
      el.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [coarse, reducedMotion]);

  // One rAF loop: seamless normalization + ambient drift + dock focus.
  // Normalization runs unconditionally (even touch / reduced-motion) so a
  // manual swipe can never strand the track outside the middle copy.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const interactive = coarse || reducedMotion;

    const frame = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const el = viewportRef.current;

      if (el) {
        // --- silent wrap: A | B | C stays visually identical ---
        const u = unitWidthRef.current;
        if (u > 0) {
          let sl = el.scrollLeft;
          while (sl >= 2 * u) sl -= u;
          while (sl < u) sl += u;
          if (sl !== el.scrollLeft) el.scrollLeft = sl;
        }

        if (!interactive && rendered.length > 0) {
          // --- drift: slow constant forward motion through the same loop ---
          const target = cursor.current.inside ? 0.22 : 1;
          slow.current += (target - slow.current) * 0.05;
          if (now - lastInteract.current > 3500) {
            el.scrollLeft += 0.016 * dt * slow.current;
          }

          // --- dock: continuous fractional focus from cursor distance ---
          if (cursor.current.inside) {
            if (measuredForRef.current !== rendered) {
              measure(rendered.length);
              measuredForRef.current = rendered;
            }
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
          } else if (focusRef.current !== null) {
            // Cursor left without a mouseleave (e.g. dataset rebuilt under
            // it) — never leave a frozen magnified state behind.
            focusRef.current = null;
            setFocus(null);
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [rendered, coarse, reducedMotion]);

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
            {rendered.map(({ book, key }, i) => {
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
              const isActive = activeIndex === i;
              const activeId = activeIndex === null ? null : rendered[activeIndex]?.book.id;
              const align =
                i < 2 ? "left" : i > rendered.length - 3 ? "right" : "center";
              return (
                <div
                  key={key}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="relative flex items-end"
                >
                  <AnimatePresence>
                    {isActive && activeId === book.id && (
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
                    dimmed={false}
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

          {rendered.length === 0 && (
            <p className="font-serif-display px-6 pb-10 text-center text-[17px] italic text-[#5f5347]">
              Nothing on this part of the shelf — try another genre.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
