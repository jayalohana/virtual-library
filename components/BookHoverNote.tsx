"use client";

import { motion } from "framer-motion";
import type { Book } from "@/types/book";
import { formatYear } from "@/lib/book-selectors";

/**
 * Warm paper annotation card that floats above the focused book.
 * Rendered inside the focused book's wrapper so it follows drift + scroll.
 */
export function BookHoverNote({
  book,
  align = "center",
}: {
  book: Book;
  align?: "left" | "center" | "right";
}) {
  const pos =
    align === "left"
      ? "left-0"
      : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`pointer-events-none absolute bottom-full z-50 mb-4 w-[186px] ${pos}`}
    >
      <div className="border border-[#2b2118]/15 bg-[#fbf6e9] px-3.5 py-3 shadow-[0_14px_28px_-12px_rgba(43,33,24,0.5)]">
        <p className="font-serif-display text-[14.5px] font-medium leading-snug text-[#2b2118]">
          {book.title}
        </p>
        <p className="mt-0.5 text-[12px] text-[#5f5347]">{book.author}</p>
        <p className="mt-1.5 text-[11px] tabular-nums text-[#8a7d6d]">
          {formatYear(book.releaseYear)}
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[#7a5a3c]">
          {book.genre}
          {book.subgenre && (
            <span className="normal-case tracking-normal text-[#8a7d6d]">
              {" "}
              / {book.subgenre}
            </span>
          )}
        </p>
      </div>
      {/* little pin */}
      <div className="mx-auto h-3 w-px bg-[#2b2118]/25" />
    </motion.div>
  );
}
