export type BookStatus = "owned" | "tbr" | "read";
export type BookSource = "owner" | "recommendation";

export interface Book {
  id: string;
  title: string;
  author: string;
  releaseYear?: number;
  genre: string;
  subgenre?: string;
  status: BookStatus;
  source: BookSource;
  recommendedBy?: string;
  recommendationNote?: string;
  createdAt: string;
  /**
   * Real artwork, when available. A spine photo/scan at natural tall-narrow
   * proportions — never a front cover stretched sideways. Uploaded spine
   * photographs plug in here later with no component changes.
   */
  spineImageUrl?: string;
  /** Front-cover artwork (correct 2:3-ish proportions), shown in detail views. */
  coverImageUrl?: string;
  /** ISBN-10/13 when known — preferred key for metadata/cover lookup. */
  isbn?: string;
  /** spine visuals for the shelf — assigned at creation, not edited by hand */
  spineColor: string;
  height: number; // px at desktop scale
  width: number; // px
}

/** Genres the UI offers as filters / suggestions. Book.genre stays a free string. */
export type Genre =
  | "Fiction"
  | "Non-Fiction"
  | "Sci-Fi"
  | "Mystery & Thriller"
  | "Philosophy"
  | "Biography"
  | "Fantasy"
  | "Romance";

export const GENRES: Genre[] = [
  "Fiction",
  "Non-Fiction",
  "Sci-Fi",
  "Mystery & Thriller",
  "Philosophy",
  "Biography",
  "Fantasy",
  "Romance",
];
