"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Book } from "@/types/book";

/** Pick readable spine ink from the spine color luminance. */
export function spineInk(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.42 ? "#2E2118" : "#F3EAD8";
}

interface BookSpineProps {
  book: Book;
  scale: number;
  lift: number;
  pushX: number;
  zIndex: number;
  dimmed: boolean;
  onSelect: (book: Book) => void;
  reducedMotion: boolean;
  compact?: boolean;
  /** uniform presence scaling (hero shelf) — dock focus math is unaffected */
  sizeScale?: number;
}

export function BookSpine({
  book,
  scale,
  lift,
  pushX,
  zIndex,
  dimmed,
  onSelect,
  reducedMotion,
  compact = false,
  sizeScale = 1,
}: BookSpineProps) {
  const ink = spineInk(book.spineColor);
  const k = (compact ? 0.82 : 1) * sizeScale;
  const h = Math.round(book.height * k);
  // Failed URLs fall back gracefully instead of showing broken images.
  const [failed, setFailed] = useState<readonly string[]>([]);
  const markFailed = (src: string) =>
    setFailed((prev) => (prev.includes(src) ? prev : [...prev, src]));

  // Artwork priority: real spine photo → real front cover → generated spine.
  // A front cover is never stretched into a spine: cover books get a wider
  // face-out slot (~0.55 aspect) so the real artwork keeps its proportions.
  const spineOk =
    Boolean(book.spineImageUrl) &&
    !failed.includes(book.spineImageUrl as string);
  const coverOk =
    !spineOk &&
    Boolean(book.coverImageUrl) &&
    !failed.includes(book.coverImageUrl as string);
  const w = coverOk
    ? Math.min(108, Math.max(64, Math.round(h * 0.55)))
    : Math.round(book.width * k);
  // Shadow lives on the button so it follows dock magnification either way.
  const dropShadow =
    scale > 1.1
      ? "0 20px 30px -12px rgba(43,33,24,0.55)"
      : "0 10px 16px -10px rgba(43,33,24,0.45)";

  return (
    <motion.button
      type="button"
      aria-label={`${book.title} by ${book.author}`}
      onClick={() => onSelect(book)}
      className="relative shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#2b2118] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7]"
      style={{
        width: w,
        height: h,
        zIndex,
        transformOrigin: "bottom center",
        filter: `drop-shadow(${dropShadow})`,
      }}
      initial={false}
      animate={{
        scale,
        y: lift,
        x: pushX,
        opacity: dimmed ? 0.35 : 1,
      }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 340, damping: 30, mass: 0.65 }
      }
      whileTap={reducedMotion ? undefined : { scale: scale * 0.97 }}
    >
      {spineOk ? (
        // Real spine artwork: the image IS the design — no rounded card
        // styling, no overlaid typography. object-cover preserves the
        // artwork's natural tall-narrow proportions inside the spine slot.
        <span
          className="absolute inset-0 block overflow-hidden"
          style={{ backgroundColor: book.spineColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- exact-size slot, nothing to optimize */}
          <img
            src={book.spineImageUrl}
            alt=""
            draggable={false}
            loading="lazy"
            onError={(e) => markFailed(e.currentTarget.src)}
            className="pointer-events-none h-full w-full object-cover select-none"
          />
        </span>
      ) : coverOk ? (
        // Real front cover in a face-out slot — wider so the artwork keeps
        // near-native proportions instead of being squeezed into a spine.
        <span
          className="absolute inset-0 block overflow-hidden"
          style={{ backgroundColor: book.spineColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- exact-size slot, nothing to optimize */}
          <img
            src={book.coverImageUrl}
            alt=""
            draggable={false}
            loading="lazy"
            onError={(e) => markFailed(e.currentTarget.src)}
            className="pointer-events-none h-full w-full object-cover select-none"
          />
        </span>
      ) : (
        <span
          className="absolute inset-0 block overflow-hidden"
          style={{
            backgroundColor: book.spineColor,
            color: ink,
            borderRadius: "2px 3px 3px 2px",
            boxShadow:
              "inset 3px 0 5px rgba(0,0,0,0.18), inset -1px 0 2px rgba(255,255,255,0.1)",
          }}
        >
        {/* cloth texture: faint horizontal weave */}
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px)",
          }}
        />
        {/* hinge */}
        <span
          className="absolute inset-y-0 left-[4px] w-px"
          style={{ backgroundColor: "rgba(0,0,0,0.32)" }}
        />
        <span
          className="absolute inset-y-0 left-[6px] w-px"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        />
        {/* head / tail bands */}
        <span
          className="absolute left-[3px] right-[2px] top-[7px] h-[3px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(0,0,0,0.25)" }}
        />
        <span
          className="absolute bottom-[7px] left-[3px] right-[2px] h-[3px]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(0,0,0,0.28)" }}
        />
        {/* title block */}
        <span className="spine-text absolute inset-0 flex items-center justify-start px-1 pb-6 pt-6">
          <span
            className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium"
            style={{ fontSize: 11, letterSpacing: "0.02em", maxHeight: "80%" }}
          >
            {book.title}
            </span>
          </span>
        </span>
      )}
    </motion.button>
  );
}
