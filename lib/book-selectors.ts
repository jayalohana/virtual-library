import { SPINE_COLORS } from "@/data/books";
import type { Book } from "@/types/book";

/** Normalized comparison: lowercase + trimmed. */
export function normalizeGenre(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Genre match for a filter value.
 * "All" matches everything; otherwise matches book.genre OR book.subgenre.
 */
export function matchesGenre(book: Book, selected: string): boolean {
  if (normalizeGenre(selected) === "all") return true;
  const want = normalizeGenre(selected);
  return (
    normalizeGenre(book.genre) === want ||
    normalizeGenre(book.subgenre) === want
  );
}

/** Shelf 1: everything JAYA added herself (any status). */
export function myLibraryBooks(books: Book[]): Book[] {
  return books.filter((b) => b.source === "owner");
}

/** Shelf 2: everything to read — owner TBR + recommendations. */
export function tbrBooks(books: Book[]): Book[] {
  return books.filter((b) => b.status === "tbr");
}

/** Free-text search over title + author. Empty/short query matches all. */
export function matchesQuery(book: Book, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return true;
  return `${book.title} ${book.author}`.toLowerCase().includes(q);
}

export function formatYear(year: number | undefined): string {
  if (year === undefined) return "Year unknown";
  return year < 0 ? `${Math.abs(year)} BCE` : String(year);
}

/** Deterministic spine visuals from any string seed (id-based). */
export function assignSpineVisuals(seed: string): {
  spineColor: string;
  height: number;
  width: number;
} {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return {
    spineColor: SPINE_COLORS[h % SPINE_COLORS.length],
    height: 196 + (h % 52),
    width: 30 + ((h >> 4) % 22),
  };
}

export interface RecommendationInput {
  title: unknown;
  author: unknown;
  name: unknown;
  reason?: unknown;
  genre?: unknown;
}

export interface ValidRecommendation {
  title: string;
  author: string;
  name: string;
  reason: string;
  genre: string;
}

/** Shared validation — used by the API route (server) and reachable for tests. */
export function validateRecommendation(input: RecommendationInput): {
  valid: ValidRecommendation | null;
  error: string | null;
} {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const author = typeof input.author === "string" ? input.author.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  const genre = typeof input.genre === "string" ? input.genre.trim() : "";

  if (!title) return { valid: null, error: "Book title is required." };
  if (!author) return { valid: null, error: "Author is required." };
  if (!name) return { valid: null, error: "Your name is required." };
  return { valid: { title, author, name, reason, genre }, error: null };
}
