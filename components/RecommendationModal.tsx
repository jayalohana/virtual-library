"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GENRES } from "@/types/book";

export interface Recommendation {
  title: string;
  author: string;
  name: string;
  reason: string;
  genre: string;
}

const inputCls =
  "h-10 w-full border border-[#2b2118]/15 bg-white px-3 text-[14px] text-[#2b2118] outline-none placeholder:text-[#a2977f] focus:border-[#2b2118]/50";

export function RecommendationModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  error = null,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (r: Recommendation) => Promise<void> | void;
  submitting?: boolean;
  error?: string | null;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [genre, setGenre] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const valid =
    title.trim() && author.trim() && name.trim() && !submitting;

  const reset = () => {
    setTitle("");
    setAuthor("");
    setName("");
    setReason("");
    setGenre("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b2118]/55 p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Recommend a book"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto border border-[#2b2118]/15 bg-[#fbf6e9] p-6 shadow-[0_28px_56px_-20px_rgba(0,0,0,0.6)]"
          >
            <h3 className="font-serif-display text-[22px] text-[#2b2118]">
              Recommend a book
            </h3>
            <p className="mt-1 text-[13px] text-[#5f5347]">
              It will land directly on the To Be Read shelf.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!valid) return;
                await onSubmit({
                  title: title.trim(),
                  author: author.trim(),
                  name: name.trim(),
                  reason: reason.trim(),
                  genre: genre.trim(),
                });
                reset();
              }}
            >
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5347]">
                  Book title
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Master and Margarita"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5347]">
                  Author
                </span>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Mikhail Bulgakov"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5347]">
                  Your name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meera"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5347]">
                  Genre{" "}
                  <span className="font-normal normal-case tracking-normal opacity-60">
                    (optional)
                  </span>
                </span>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className={`${inputCls} ${genre ? "" : "text-[#a2977f]"}`}
                >
                  <option value="">Not sure</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5347]">
                  Why should I read it?{" "}
                  <span className="font-normal normal-case tracking-normal opacity-60">
                    (optional)
                  </span>
                </span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="A line or two is plenty."
                  className="w-full resize-none border border-[#2b2118]/15 bg-white px-3 py-2 text-[14px] text-[#2b2118] outline-none placeholder:text-[#a2977f] focus:border-[#2b2118]/50"
                />
              </label>
              {error && (
                <p role="alert" className="text-[13px] text-[#8C3B2E]">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="h-10 px-4 text-[13px] font-medium text-[#5f5347] hover:bg-[#ece2cd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!valid}
                  className="h-10 bg-[#2b2118] px-5 text-[13px] font-medium text-[#f6f1e7] hover:bg-[#4a3222] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? "Shelving…" : "Shelve it"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
