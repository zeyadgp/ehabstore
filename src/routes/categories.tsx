import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Search, SlidersHorizontal } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { fallbackFor } from "@/lib/images";
import {
  categoryTreeIds,
  childrenOf,
  rootCategories,
  useCategories,
  useProducts,
} from "@/lib/store";

const title = "أقسام المتجر | إيهاب ستور للعناية والتجميل";
const description =
  "تصفحي أقسام إيهاب ستور: العناية بالبشرة، العطور، العناية بالشعر والمكياج مع بحث سريع وفلترة ذكية.";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ehabstore.app/categories" }],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const roots = rootCategories(categories);
  const q = term.trim();

  const countFor = (id: string) => {
    const ids = categoryTreeIds(categories, id);
    return products.filter((p) => p.category_id && ids.includes(p.category_id)).length;
  };

  const catHits = q ? categories.filter((c) => c.name.includes(q)).slice(0, 6) : [];
  const productHits = q ? products.filter((p) => p.name.includes(q)).slice(0, 6) : [];

  const goSearch = () => navigate({ to: "/products", search: { q: q || undefined } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-32">
      <h1 className="text-2xl font-extrabold">أقسام المتجر</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ابحثي أو اختاري القسم للوصول السريع لما تحتاجينه.
      </p>

      {/* Search + filter */}
      <div className="mt-5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value.slice(0, 60))}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
            placeholder="ابحثي عن منتج أو قسم أو ماركة..."
            className="w-full rounded-2xl border border-border bg-card py-3 ps-11 pe-4 text-sm shadow-soft outline-none transition-colors focus:border-primary"
          />
        </div>
        <Link
          to="/products"
          search={{ filter: "1" }}
          aria-label="الفلترة"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-soft transition-colors hover:border-primary"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Link>
      </div>

      {q && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {catHits.length === 0 && productHits.length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">لا توجد نتائج مطابقة.</p>
          )}
          {catHits.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug }}
              className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-sm transition-colors hover:bg-secondary/60"
            >
              <span className="truncate font-bold">
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {c.kind === "brand" ? "ماركة" : c.parent_id ? "قسم فرعي" : "قسم"}
              </span>
            </Link>
          ))}
          {productHits.map((p) => (
            <Link
              key={p.id}
              to="/product/$slug"
              params={{ slug: p.id }}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 text-sm transition-colors last:border-0 hover:bg-secondary/60"
            >
              <SmartImage
                paths={p.images}
                fallback={fallbackFor(categories.find((c) => c.id === p.category_id)?.slug)}
                alt={p.name}
                className="h-9 w-9 shrink-0 rounded-lg object-cover"
              />
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
        </div>
      )}

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">جاري التحميل…</p>}

      {!isLoading && roots.length === 0 && (
        <p className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد أقسام حالياً.
        </p>
      )}

      {/* Store-style category cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {roots.map((c) => (
          <Link
            key={c.id}
            to="/products"
            search={{ category: c.slug }}
            className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            style={c.color ? { borderColor: `${c.color}55` } : undefined}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <SmartImage
                paths={c.cover_image ? [c.cover_image] : c.image ? [c.image] : []}
                fallback={fallbackFor(c.slug)}
                alt={c.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-2 end-2 rounded-full bg-card/85 px-2 py-0.5 text-[10px] font-bold text-primary backdrop-blur">
                {countFor(c.id)} منتج
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold">
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </h2>
                <p className="truncate text-[11px] text-muted-foreground">
                  {c.description ?? `${childrenOf(categories, c.id).length} تصنيف فرعي`}
                </p>
              </div>
              <ChevronLeft className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
