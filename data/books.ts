import type { Book, BookStatus } from "@/types/book";

export { GENRES } from "@/types/book";

const HEIGHTS = [196, 214, 228, 242, 204, 236, 220, 248, 190, 232, 208, 224];
const WIDTHS = [32, 38, 44, 30, 48, 36, 41, 34, 50, 39, 46, 33];

export const SPINE_COLORS = [
  "#5C4A3A", // umber
  "#7A5C3E", // oak
  "#936639", // caramel
  "#6B705C", // sage
  "#3D5A45", // dark green
  "#283618", // deep moss
  "#7F4F24", // saddle
  "#6D2E2E", // burgundy
  "#8C3B2E", // brick
  "#3D405B", // ink blue
  "#6D6875", // mauve grey
  "#84A59D", // sea mist
  "#B08968", // sand
  "#A98467", // tan
  "#C44536", // poppy (rare pop)
  "#E9C46A", // ochre (rare pop)
];

function sized(i: number): { height: number; width: number; spineColor: string } {
  return {
    height: HEIGHTS[i % HEIGHTS.length],
    width: WIDTHS[(i * 5 + 3) % WIDTHS.length],
    spineColor: SPINE_COLORS[(i * 7 + 2) % SPINE_COLORS.length],
  };
}

/**
 * Mock artwork lives here in the data layer — never inside components.
 * Real uploaded spine photographs later just replace these URLs.
 */
interface MockArt {
  spineImageUrl?: string;
  coverImageUrl?: string;
}

function b(
  id: string,
  title: string,
  author: string,
  releaseYear: number,
  genre: string,
  subgenre: string,
  status: BookStatus,
  i: number,
  art?: MockArt,
): Book {
  return {
    id,
    title,
    author,
    releaseYear,
    genre,
    subgenre,
    status,
    source: "owner",
    createdAt: `2024-01-${String((i % 27) + 1).padStart(2, "0")}T12:00:00.000Z`,
    ...sized(i),
    ...art,
  };
}

/** Owner's seed collection. Previously-"Reading" books map to "owned". */
export const SEED_BOOKS: Book[] = [
  // Fiction (5)
  b("fic-1", "The Remains of the Day", "Kazuo Ishiguro", 1989, "Fiction", "Literary", "read", 0),
  b("fic-2", "Beloved", "Toni Morrison", 1987, "Fiction", "Literary", "read", 1, {
    spineImageUrl: "/spines/beloved.svg",
  }),
  b("fic-3", "Piranesi", "Susanna Clarke", 2020, "Fiction", "Literary Fantasy", "read", 2),
  b("fic-4", "A Gentleman in Moscow", "Amor Towles", 2016, "Fiction", "Historical", "read", 3),
  b("fic-5", "Normal People", "Sally Rooney", 2018, "Fiction", "Contemporary", "owned", 4),
  // Non-Fiction (5)
  b("nf-1", "The Design of Everyday Things", "Don Norman", 1988, "Non-Fiction", "Design", "read", 5, {
    spineImageUrl: "/spines/design-everyday.svg",
  }),
  b("nf-2", "Braiding Sweetgrass", "Robin Wall Kimmerer", 2013, "Non-Fiction", "Nature", "read", 6),
  b("nf-3", "The Warmth of Other Suns", "Isabel Wilkerson", 2010, "Non-Fiction", "History", "read", 7),
  b("nf-4", "Entangled Life", "Merlin Sheldrake", 2020, "Non-Fiction", "Science", "owned", 8),
  b("nf-5", "Thinking, Fast and Slow", "Daniel Kahneman", 2011, "Non-Fiction", "Psychology", "read", 9),
  // Sci-Fi (5)
  b("sf-1", "Dune", "Frank Herbert", 1965, "Sci-Fi", "Space Opera", "read", 10, {
    spineImageUrl: "/spines/dune.svg",
    coverImageUrl: "/covers/dune.svg",
  }),
  b("sf-2", "The Left Hand of Darkness", "Ursula K. Le Guin", 1969, "Sci-Fi", "Social SF", "read", 11),
  b("sf-3", "Stories of Your Life", "Ted Chiang", 2002, "Sci-Fi", "Short Stories", "read", 12),
  b("sf-4", "The Three-Body Problem", "Liu Cixin", 2008, "Sci-Fi", "Hard SF", "read", 13),
  b("sf-5", "A Psalm for the Wild-Built", "Becky Chambers", 2021, "Sci-Fi", "Cozy SF", "owned", 14),
  // Mystery & Thriller (5)
  b("my-1", "The Secret History", "Donna Tartt", 1992, "Mystery & Thriller", "Literary Mystery", "read", 15, {
    spineImageUrl: "/spines/secret-history.svg",
    coverImageUrl: "/covers/secret-history.svg",
  }),
  b("my-2", "The Talented Mr. Ripley", "Patricia Highsmith", 1955, "Mystery & Thriller", "Crime", "read", 16),
  b("my-3", "Murder on the Orient Express", "Agatha Christie", 1934, "Mystery & Thriller", "Classic Whodunit", "read", 17),
  b("my-4", "The Silent Patient", "Alex Michaelides", 2019, "Mystery & Thriller", "Psychological", "read", 18),
  b("my-5", "The Adventures of Sherlock Holmes", "Arthur Conan Doyle", 1892, "Mystery & Thriller", "Detective", "tbr", 19),
  // Philosophy (5)
  b("ph-1", "Meditations", "Marcus Aurelius", 180, "Philosophy", "Stoicism", "read", 20, {
    spineImageUrl: "/spines/meditations.svg",
    coverImageUrl: "/covers/meditations.svg",
  }),
  b("ph-2", "Zhuangzi", "Zhuang Zhou", -300, "Philosophy", "Daoism", "read", 21),
  b("ph-3", "Beyond Good and Evil", "Friedrich Nietzsche", 1886, "Philosophy", "Ethics", "read", 22),
  b("ph-4", "The Ethics of Ambiguity", "Simone de Beauvoir", 1947, "Philosophy", "Existentialism", "owned", 23),
  b("ph-5", "How to Do Nothing", "Jenny Odell", 2019, "Philosophy", "Attention", "read", 24),
  // Biography (5)
  b("bi-1", "Long Walk to Freedom", "Nelson Mandela", 1994, "Biography", "Memoir", "read", 25),
  b("bi-2", "Becoming", "Michelle Obama", 2018, "Biography", "Memoir", "read", 26),
  b("bi-3", "Surely You're Joking", "Richard Feynman", 1985, "Biography", "Memoir", "owned", 27),
  b("bi-4", "Educated", "Tara Westover", 2018, "Biography", "Memoir", "read", 28),
  b("bi-5", "The Story of My Experiments", "M. K. Gandhi", 1927, "Biography", "Autobiography", "read", 29),
  // Fantasy (5)
  b("fa-1", "The Hobbit", "J. R. R. Tolkien", 1937, "Fantasy", "High Fantasy", "read", 30, {
    spineImageUrl: "/spines/hobbit.svg",
    coverImageUrl: "/covers/hobbit.svg",
  }),
  b("fa-2", "A Wizard of Earthsea", "Ursula K. Le Guin", 1968, "Fantasy", "Coming of Age", "read", 31),
  b("fa-3", "The Name of the Wind", "Patrick Rothfuss", 2007, "Fantasy", "Epic", "owned", 32),
  b("fa-4", "The Master and Margarita", "Mikhail Bulgakov", 1967, "Fantasy", "Satire", "read", 33),
  b("fa-5", "The Priory of the Orange Tree", "Samantha Shannon", 2019, "Fantasy", "Epic", "tbr", 34),
  // Romance (5)
  b("ro-1", "Pride and Prejudice", "Jane Austen", 1813, "Romance", "Classic", "read", 35),
  b("ro-2", "Persuasion", "Jane Austen", 1817, "Romance", "Classic", "read", 36),
  b("ro-3", "Beach Read", "Emily Henry", 2020, "Romance", "Contemporary", "tbr", 37),
  b("ro-4", "The Kiss Quotient", "Helen Hoang", 2018, "Romance", "Contemporary", "tbr", 38),
  b("ro-5", "Outlander", "Diana Gabaldon", 1991, "Romance", "Historical", "owned", 39),
  // two extra for density (42 volumes)
  b("ex-1", "Kindred", "Octavia Butler", 1979, "Sci-Fi", "Time Travel", "read", 40),
  b("ex-2", "Klara and the Sun", "Kazuo Ishiguro", 2021, "Fiction", "Literary SF", "read", 41),
];
