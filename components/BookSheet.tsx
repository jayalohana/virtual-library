"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Book } from "@/types/book";
import { formatYear } from "@/lib/book-selectors";
import { spineInk } from "./BookSpine";

const STATUS_STYLE: Record<Book["status"], string> = {
  owned: "bg-[#283618] text-[#ede6d3]",
  tbr: "bg-transparent text-[#5f5347] border border-[#5f5347]/40",
  read: "bg-[#7f4f24] text-[#fbf3e2]",
};

const STATUS_LABEL: Record<Book["status"], string> = {
  owned: "In my library",
  tbr: "To be read",
  read: "Read",
};

/** Compact sheet shown on tap/click — same info as the hover note + status. */
export function BookSheet({
  book,
  onClose,
}: {
  book: Book | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!book) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [book, onClose]);

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#2b2118]/55 p-4 sm:items-center"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${book.title} details`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="w-full max-w-[420px] border border-[#2b2118]/15 bg-[#fbf6e9] p-5 shadow-[0_28px_56px_-20px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-start gap-4">
              {book.coverImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size local artwork, nothing to optimize */}
                  <img
                  src={book.coverImageUrl}
                  alt={`Front cover of ${book.title}`}
                  draggable={false}
                  className="aspect-[2/3] w-16 shrink-0 object-cover select-none"
                  style={{
                    boxShadow:
                      "0 10px 18px -8px rgba(43,33,24,0.5), inset 2px 0 4px rgba(0,0,0,0.2)",
                  }}
                  />
                </>
              ) : (
                <span
                  className="block h-24 w-8 shrink-0"
                  style={{
                    backgroundColor: book.spineColor,
                    color: spineInk(book.spineColor),
                    borderRadius: "2px 3px 3px 2px",
                    boxShadow: "inset 2px 0 4px rgba(0,0,0,0.25)",
                  }}
                >
                  <span className="spine-text flex h-full items-center justify-center py-2 text-[9px] font-medium">
                    {book.title}
                  </span>
                </span>
              )}
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[book.status]}`}
                >
                  {STATUS_LABEL[book.status]}
                </span>
                <h3 className="font-serif-display mt-1.5 text-[20px] font-medium leading-tight text-[#2b2118]">
                  {book.title}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#5f5347]">{book.author}</p>
                <p className="mt-1 text-[12px] tabular-nums text-[#8a7d6d]">
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
                {book.source === "recommendation" && book.recommendedBy && (
                  <p className="mt-2 border-t border-[#2b2118]/10 pt-2 text-[12px] italic text-[#5f5347]">
                    Recommended by {book.recommendedBy}
                    {book.recommendationNote
                      ? ` — “${book.recommendationNote}”`
                      : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center text-[15px] text-[#5f5347] hover:bg-[#ece2cd]"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
