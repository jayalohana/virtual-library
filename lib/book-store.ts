import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { SEED_BOOKS } from "@/data/books";
import { assignSpineVisuals, type ValidRecommendation } from "./book-selectors";
import type { Book } from "@/types/book";

const DATA_FILE = path.join(process.cwd(), "data", "library.json");

let cache: Book[] | null = null;

function isBook(value: unknown): value is Book {
  if (typeof value !== "object" || value === null) return false;
  const b = value as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.title === "string" &&
    typeof b.author === "string" &&
    typeof b.genre === "string" &&
    (b.status === "owned" || b.status === "tbr" || b.status === "read") &&
    (b.source === "owner" || b.source === "recommendation") &&
    typeof b.createdAt === "string" &&
    typeof b.spineColor === "string" &&
    typeof b.height === "number" &&
    typeof b.width === "number"
  );
}

async function persist(books: Book[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), "utf8");
}

/** Single source of truth on the server. Seeds from SEED_BOOKS on first run. */
export async function listBooks(): Promise<Book[]> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isBook)) {
      cache = parsed;
      return cache;
    }
  } catch {
    // missing/corrupt file → fall through to seed
  }
  cache = [...SEED_BOOKS];
  await persist(cache);
  return cache;
}

/** A recommendation always lands as status "tbr" + source "recommendation". */
export function buildRecommendedBook(input: ValidRecommendation): Book {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `rec-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    id,
    title: input.title,
    author: input.author,
    genre: input.genre || "Fiction",
    status: "tbr",
    source: "recommendation",
    recommendedBy: input.name,
    recommendationNote: input.reason || undefined,
    createdAt: new Date().toISOString(),
    ...assignSpineVisuals(id),
  };
}

export async function addBook(book: Book): Promise<Book> {
  const books = await listBooks();
  books.push(book);
  cache = books;
  await persist(books);
  return book;
}

function isHttpUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("https://") || value.startsWith("http://"))
  );
}

/** Persist a resolved real cover URL onto an existing book. */
export async function updateBookCover(
  id: string,
  coverImageUrl: string,
): Promise<Book | null> {
  if (!id || !isHttpUrl(coverImageUrl)) return null;
  const books = await listBooks();
  const book = books.find((b) => b.id === id);
  if (!book) return null;
  book.coverImageUrl = coverImageUrl;
  cache = books;
  await persist(books);
  return book;
}
