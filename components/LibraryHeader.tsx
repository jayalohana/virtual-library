"use client";

interface LibraryHeaderProps {
  volumeCount: number;
  query: string;
  onQuery: (q: string) => void;
  onRecommend: () => void;
}

export function LibraryHeader({
  volumeCount,
  query,
  onQuery,
  onRecommend,
}: LibraryHeaderProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-12 text-center md:pt-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7d6d]">
        A personal library
      </p>
      <h1 className="font-serif-display mt-5 font-normal italic leading-[1.08] text-[#2b2118] text-[clamp(2.75rem,7.5vw,5rem)]">
        Welcome to my library
      </h1>
      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7d6d]">
        {volumeCount} volumes
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={onRecommend}
          className="h-10 rounded-full border border-[#2b2118]/25 px-6 text-[11px] font-medium uppercase tracking-[0.22em] text-[#2b2118] transition-colors hover:bg-[#2b2118] hover:text-[#f6f1e7]"
        >
          Recommend a book
        </button>
      </div>

      <div className="mx-auto mt-9 max-w-md md:mt-11">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="What are you looking for?"
          aria-label="Search books"
          className="h-11 w-full border-b border-[#2b2118]/25 bg-transparent px-2 text-center text-[15px] text-[#2b2118] outline-none placeholder:text-center placeholder:italic placeholder:text-[#a2977f] focus:border-[#2b2118]/60"
        />
      </div>
    </div>
  );
}
