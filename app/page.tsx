"use client";

import { useEffect, useMemo, useState } from "react";
import type { Book } from "@/types/book";
import {
  matchesGenre,
  matchesQuery,
  myLibraryBooks,
  tbrBooks,
} from "@/lib/book-selectors";
import { LibraryHeader } from "@/components/LibraryHeader";
import { GenreFilters, type GenreFilter } from "@/components/GenreFilters";
import { BookShelf } from "@/components/BookShelf";
import { BookSheet } from "@/components/BookSheet";
import { useBookCovers } from "@/hooks/useBookCovers";
import {
  RecommendationModal,
  type Recommendation,
} from "@/components/RecommendationModal";

function isBookArray(value: unknown): value is Book[] {
  return Array.isArray(value);
}

export default function Home() {
  const [genre, setGenre] = useState<GenreFilter>("All");
  const [query, setQuery] = useState("");
  // Single source of truth — loaded from the API, never edited by hand.
  const [books, setBooks] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Progressive enhancement: resolve real covers once per book, merge + persist.
  useBookCovers(books, (id, coverImageUrl) =>
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, coverImageUrl } : b)),
    ),
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/books")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        if (!cancelled && isBookArray(data)) setBooks(data);
      })
      .catch(() => {
        // API unreachable — shelf stays empty rather than crashing.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived shelves — no manually maintained fictionBooks/tbrBooks arrays.
  const myLibrary = useMemo(() => myLibraryBooks(books), [books]);
  const tbr = useMemo(() => tbrBooks(books), [books]);

  const filteredMyLibrary = useMemo(
    () =>
      myLibrary.filter(
        (b) => matchesGenre(b, genre) && matchesQuery(b, query),
      ),
    [myLibrary, genre, query],
  );
  const filteredTbr = useMemo(
    () => tbr.filter((b) => matchesGenre(b, genre) && matchesQuery(b, query)),
    [tbr, genre, query],
  );

  const handleRecommend = async (r: Recommendation) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: r.title,
          author: r.author,
          name: r.name,
          reason: r.reason,
          genre: r.genre,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFormError(data?.error ?? "Could not shelve that book.");
        return;
      }
      const created = (await res.json()) as Book;
      // Appears on the To Be Read shelf immediately — no refresh needed.
      setBooks((prev) => [...prev, created]);
      setRecommendOpen(false);
    } catch {
      setFormError("Could not reach the library. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full">
      <main>
        {/* Hero viewport: intro centered in the upper ~60%, shelf along the bottom */}
        <section className="flex min-h-[100svh] flex-col">
          <LibraryHeader
            volumeCount={myLibrary.length}
            query={query}
            onQuery={setQuery}
            onRecommend={() => {
              setFormError(null);
              setRecommendOpen(true);
            }}
          />
          <GenreFilters active={genre} onChange={setGenre} />

          <div className="min-h-[6vh] flex-1 md:min-h-[10vh]" />

          <div className="mt-auto">
            <BookShelf
              books={filteredMyLibrary}
              query={query}
              onSelect={setSelected}
              showPlank={false}
              sizeScale={1.08}
            />
          </div>
        </section>

        {/* Shelf 2 — below the first viewport, same visual language */}
        {filteredTbr.length > 0 && (
          <section className="mx-auto max-w-none pt-16 md:pt-24">
            <p className="px-5 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7d6d]">
              To be read
            </p>
            <div className="mt-6 md:mt-8">
              <BookShelf
                books={filteredTbr}
                query={query}
                onSelect={setSelected}
                showPlank={false}
                sizeScale={1.08}
              />
            </div>
          </section>
        )}

      </main>

      <BookSheet book={selected} onClose={() => setSelected(null)} />
      <RecommendationModal
        open={recommendOpen}
        onClose={() => setRecommendOpen(false)}
        onSubmit={handleRecommend}
        submitting={submitting}
        error={formError}
      />
    </div>
  );
}
