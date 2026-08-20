import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { fallbackFor } from "@/lib/images";
import { categoryTreeIds, childrenOf, rootCategories, useCategories, useProducts } from "@/lib/store";

const title = "أقسام المتجر | إيهاب ستور للعناية والتجميل";
const description =
  "تصفحي أقسام إيهاب ستور: العناية بالبشرة، العطور، العناية بالشعر والمكياج مع الأقسام الفرعية لكل تصنيف.";

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
    links: [{ rel: "canonical", href: "/categories" }],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();
  const roots = rootCategories(categories);

  const countFor = (id: string) => {
    const ids = categoryTreeIds(categories, id);
    return products.filter((p) => p.category_id && ids.includes(p.category_id)).length;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-32">
      <h1 className="text-2xl font-extrabold">أقسام المتجر</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        اختاري التصنيف الرئيسي ثم القسم الفرعي للوصول السريع لما تبحثين عنه.
      </p>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">جاري التحميل…</p>}

      {!isLoading && roots.length === 0 && (
        <p className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد أقسام حالياً.
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {roots.map((c) => {
          const kids = childrenOf(categories, c.id);
          return (
            <article
              key={c.id}
              className="rounded-3xl border border-border bg-card p-4 shadow-soft"
              style={c.color ? { borderInlineStartWidth: 4, borderInlineStartColor: c.color } : undefined}
            >
              <Link
                to="/products"
                search={{ category: c.slug }}
                className="flex items-center gap-3"
              >
                <SmartImage
                  paths={c.image ? [c.image] : []}
                  fallback={fallbackFor(c.slug)}
                  alt={c.name}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-extrabold">
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </h2>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c.description ?? `${countFor(c.id)} منتج`}
                  </p>
                </div>
                <ChevronLeft className="h-5 w-5 text-primary" />
              </Link>

              {kids.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {kids.map((k) => (
                    <li key={k.id}>
                      <Link
                        to="/products"
                        search={{ category: k.slug }}
                        className="flex items-center gap-1 rounded-xl bg-secondary/60 px-3 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:bg-secondary hover:text-primary"
                      >
                        {k.name}
                        <span className="text-[10px] text-muted-foreground">({countFor(k.id)})</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
