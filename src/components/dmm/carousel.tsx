import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Slide = {
  id: string;
  image: string;
  title: string;
  caption: string;
};

export function AutoSlideCarousel({
  slides,
  intervalMs = 4500,
  className,
}: {
  slides: Slide[];
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  if (!slides.length) return null;

  return (
    <div className={cn("relative overflow-hidden rounded-[20px]", className)}>
      <div className="relative aspect-[16/10] w-full bg-ink-2">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-out",
              i === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0",
            )}
          >
            <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-paper">
              <p className="text-xs font-semibold tracking-wider text-brass-2 uppercase">{s.caption}</p>
              <h3 className="mt-1 font-display text-lg font-semibold sm:text-xl">{s.title}</h3>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition hover:bg-brass hover:text-ink"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label="Seguinte"
        onClick={() => setIndex((i) => (i + 1) % slides.length)}
        className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition hover:bg-brass hover:text-ink"
      >
        <ChevronRight size={18} />
      </button>
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-6 bg-brass" : "w-1.5 bg-paper/50 hover:bg-paper/80",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ServiceMarquee({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent" />
      <div className="slide-track gap-4">
        {children}
        {children}
      </div>
    </div>
  );
}
