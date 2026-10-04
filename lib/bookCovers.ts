/**
 * Real cover-artwork lookup. No React, no DOM — pure fetch helpers plus a
 * module-level cache so a book is resolved at most once per session.
 *
 * Lookup order per book:
 *   1. Google Books API (by ISBN when known, else title + author)
 *   2. Open Library Search API → covers.openlibrary.org (fallback)
 *   3. null → caller renders the generated spine fallback
 */

export interface CoverQuery {
  isbn?: string;
  title: string;
  author: string;
}

interface GoogleVolumeInfo {
  title?: string;
  authors?: string[];
  imageLinks?: {
    large?: string;
    medium?: string;
    thumbnail?: string;
    smallThumbnail?: string;
  };
}

interface OpenLibraryDoc {
  title?: string;
  author_name?: string[];
  cover_i?: number;
}

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function cacheKey(q: CoverQuery): string {
  const isbn = (q.isbn ?? "").replace(/[^0-9xX]/g, "");
  if (isbn) return `isbn:${isbn.toLowerCase()}`;
  return `ta:${q.title.trim().toLowerCase()}|${q.author.trim().toLowerCase()}`;
}

/** "The Three-Body Problem" vs "The Three-Body Problem (Remembrance…)" */
function normTitle(t: string): string {
  return t
    .toLowerCase()
    .split(":")[0]
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function authorMatches(candidate: string[] | undefined, want: string): boolean {
  if (!candidate || candidate.length === 0) return false;
  const parts = want.toLowerCase().split(/[\s.]+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  if (!last) return false;
  return candidate.some((a) => a.toLowerCase().includes(last));
}

/** Prefer large > medium > thumbnail; force https; drop the curl overlay; upscale. */
function upgradeGoogleUrl(url: string): string {
  return url
    .replace(/^http:/, "https:")
    .replace(/&edge=curl/, "")
    .replace(/zoom=1/, "zoom=0");
}

function googleImage(info: GoogleVolumeInfo): string | null {
  const links = info.imageLinks;
  if (!links) return null;
  const raw =
    links.large ?? links.medium ?? links.thumbnail ?? links.smallThumbnail;
  return raw ? upgradeGoogleUrl(raw) : null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function googleByIsbn(isbn: string): Promise<string | null> {
  const data = await fetchJson<{ items?: { volumeInfo: GoogleVolumeInfo }[] }>(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&maxResults=1`,
  );
  const info = data?.items?.[0]?.volumeInfo;
  return info ? googleImage(info) : null;
}

async function googleByTitleAuthor(
  title: string,
  author: string,
): Promise<string | null> {
  const data = await fetchJson<{ items?: { volumeInfo: GoogleVolumeInfo }[] }>(
    `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=5`,
  );
  const items = data?.items ?? [];
  const wantTitle = normTitle(title);
  // Best match first: same normalized title + author last-name hit + has art.
  const ranked = items
    .map((it) => it.volumeInfo)
    .filter((info) => googleImage(info) !== null)
    .sort((a, b) => {
      const score = (info: GoogleVolumeInfo) => {
        let s = 0;
        if (normTitle(info.title ?? "") === wantTitle) s += 2;
        else if (
          wantTitle &&
          normTitle(info.title ?? "").includes(wantTitle)
        )
          s += 1;
        if (authorMatches(info.authors, author)) s += 2;
        return s;
      };
      return score(b) - score(a);
    });
  const best = ranked[0];
  if (!best) return null;
  // Refuse unrelated covers: require a title or author signal.
  const titleOk =
    wantTitle.length > 0 &&
    (normTitle(best.title ?? "") === wantTitle ||
      normTitle(best.title ?? "").includes(wantTitle) ||
      wantTitle.includes(normTitle(best.title ?? "")));
  if (!titleOk && !authorMatches(best.authors, author)) return null;
  return googleImage(best);
}

async function openLibraryCover(
  title: string,
  author: string,
): Promise<string | null> {
  const data = await fetchJson<{ docs?: OpenLibraryDoc[] }>(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=5&fields=key,title,author_name,cover_i`,
  );
  const docs = (data?.docs ?? []).filter((d) => d.cover_i !== undefined);
  if (docs.length === 0) return null;
  const wantTitle = normTitle(title);
  const ranked = [...docs].sort((a, b) => {
    const score = (d: OpenLibraryDoc) => {
      let s = 0;
      if (normTitle(d.title ?? "") === wantTitle) s += 2;
      if (authorMatches(d.author_name, author)) s += 2;
      return s;
    };
    return score(b) - score(a);
  });
  const best = ranked[0];
  const titleOk =
    wantTitle.length > 0 &&
    (normTitle(best.title ?? "") === wantTitle ||
      normTitle(best.title ?? "").includes(wantTitle));
  if (!titleOk && !authorMatches(best.author_name, author)) return null;
  return `https://covers.openlibrary.org/b/id/${best.cover_i}-L.jpg`;
}

async function resolve(query: CoverQuery): Promise<string | null> {
  const isbn = (query.isbn ?? "").replace(/[^0-9xX]/g, "");
  if (isbn) {
    const viaIsbn = await googleByIsbn(isbn);
    if (viaIsbn) return viaIsbn;
  }
  const viaGoogle = await googleByTitleAuthor(query.title, query.author);
  if (viaGoogle) return viaGoogle;
  return openLibraryCover(query.title, query.author);
}

/**
 * Resolve a book's real front-cover URL (or null). Cached per session and
 * deduped while in flight — safe to call from effects without refetch storms.
 */
export function fetchCoverForBook(query: CoverQuery): Promise<string | null> {
  const key = cacheKey(query);
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = resolve(query)
    .then((url) => {
      cache.set(key, url);
      inflight.delete(key);
      return url;
    })
    .catch(() => {
      cache.set(key, null);
      inflight.delete(key);
      return null;
    });
  inflight.set(key, job);
  return job;
}

/** Test seam: how many distinct lookups have completed this session. */
export function coverCacheSize(): number {
  return cache.size;
}
