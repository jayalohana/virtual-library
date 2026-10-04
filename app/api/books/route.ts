import { NextResponse } from "next/server";
import { validateRecommendation, type RecommendationInput } from "@/lib/book-selectors";
import {
  addBook,
  buildRecommendedBook,
  listBooks,
  updateBookCover,
} from "@/lib/book-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const books = await listBooks();
  return NextResponse.json(books);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { valid, error } = validateRecommendation(body as RecommendationInput);
  if (!valid) {
    return NextResponse.json({ error }, { status: 400 });
  }
  const created = await addBook(buildRecommendedBook(valid));
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { id, coverImageUrl } = (body ?? {}) as {
    id?: unknown;
    coverImageUrl?: unknown;
  };
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "Book id is required." }, { status: 400 });
  }
  const updated = await updateBookCover(
    id,
    typeof coverImageUrl === "string" ? coverImageUrl : "",
  );
  if (!updated) {
    return NextResponse.json(
      { error: "Book not found or invalid cover URL." },
      { status: 400 },
    );
  }
  return NextResponse.json(updated);
}
