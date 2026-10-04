"use client";

import type { Genre } from "@/types/book";

export type GenreFilter = "All" | Genre;

export const FILTERS: GenreFilter[] = [
  "All",
  "Fiction",
  "Non-Fiction",
  "Sci-Fi",
  "Mystery & Thriller",
  "Philosophy",
  "Biography",
  "Fantasy",
  "Romance",
];

/** Display labels only — filter values above are untouched, so logic is unchanged. */
const DISPLAY_LABELS: Record<GenreFilter, string> = {
  All: "ALL",
  Fiction: "FICTION",
  "Non-Fiction": "NONFICTION",
  "Sci-Fi": "SCI-FI",
  "Mystery & Thriller": "MYSTERY & THRILLER",
  Philosophy: "PHILOSOPHY",
  Biography: "BIOGRAPHY",
  Fantasy: "FANTASY",
  Romance: "ROMANCE",
};

export function GenreFilters({
  active,
  onChange,
}: {
  active: GenreFilter;
  onChange: (g: GenreFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter by genre"
      className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-1.5 px-5 md:gap-2"
    >
      {FILTERS.map((g) => {
        const selected = g === active;
        return (
          <button
            key={g}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onChange(g)}
            className={`h-7 rounded-full border px-3 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors md:h-8 md:px-3.5 md:text-[10.5px] ${
              selected
                ? "border-[#2b2118]/60 text-[#2b2118]"
                : "border-[#2b2118]/20 text-[#8a7d6d] hover:border-[#2b2118]/40 hover:text-[#2b2118]"
            }`}
          >
            {DISPLAY_LABELS[g]}
          </button>
        );
      })}
    </div>
  );
}
