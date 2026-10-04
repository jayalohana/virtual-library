"use client";

import { useEffect, useRef } from "react";
import type { Book } from "@/types/book";
import { fetchCoverForBook } from "@/lib/bookCovers";

const attempted = new Set<string>();
const CONCURRENCY = 3;

/**
 * Progressive cover enhancement: for books without artwork, resolve the real
 * front cover once (module cache + attempted set ⇒ no refetch on rerender),
 * persist it server-side, and merge it into client state. Books that already
 * carry coverImageUrl are never touched.
 */
export function useBookCovers(
  books: Book[],
  onCover: (id: string, coverImageUrl: string) => void,
) {
  const onCoverRef = useRef(onCover);

  useEffect(() => {
    onCoverRef.current = onCover;
    const pending = books.filter(
      (b) => !b.coverImageUrl && !attempted.has(b.id),
    );
    if (pending.length === 0) return;
    pending.forEach((b) => attempted.add(b.id));

    let cancelled = false;
    const queue = [...pending];
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, queue.length) },
      async () => {
        while (queue.length > 0 && !cancelled) {
          const book = queue.shift();
          if (!book) return;
          try {
            const url = await fetchCoverForBook({
              isbn: book.isbn,
              title: book.title,
              author: book.author,
            });
            if (!url || cancelled) continue;
            onCoverRef.current(book.id, url);
            // Persist — best effort, never blocks the shelf.
            fetch("/api/books", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: book.id, coverImageUrl: url }),
            }).catch(() => {});
          } catch {
            // Resolution failure ⇒ generated fallback stays. Nothing to do.
          }
        }
      },
    );
    Promise.all(workers).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [books]);
}
