import { Star } from "lucide-react";

/** Read-only star row used in product cards and the reviews list. */
export function Stars({ value, size = "sm" }: { value: number; size?: "xs" | "sm" | "md" }) {
  const cls = size === "xs" ? "h-3 w-3" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5 text-primary" aria-label={`تقييم ${value} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < Math.round(value) ? "fill-current" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}
