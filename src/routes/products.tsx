import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { priceOf, useCategories, useProducts, useSettings } from "@/lib/store";

type ProductSearch = { category: string; q: string; sort: "newest" | "price-asc" | "price-desc" };

const title = "جميع المنتجات | إيهاب ستور للعناية والتجميل";
const description =
  "تصفحي جميع منتجات العناية بالبشرة والشعر والمكياج والعطور في إيهاب ستور مع فلترة حسب التصنيف والسعر.";

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    category: typeof search['category'] === "string" ? search['category'] : "",
    q: typeof search['q'] === "string" ? search['q'] : "",
    sort:
      search['sort'] === "price-asc" || search['sort'] === "price-desc"
        ? search['sort']
        : "newest",
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/products" },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { category, q, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts();
  const currency = settings?.currency_label ?? "ر.س";

  const activeCat = categories.find((c) => c.slug === category);
  let list = products.filter((p) => {
    const matchCat = !activeCat || p.category_id === activeCat.id;
    const matchQ = !q || p.name.includes(q) || (p.description ?? "").includes(q);
    return matchCat && matchQ;
  });
  if (sort === "price-asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === "price-desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));

  const update = (patch: Partial<ProductSearch>) =>
    navigate({ search: (prev: ProductSearch) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-center text-3xl font-extrabold">جميع المنتجات</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {list.length} منتج متاح الآن
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 start-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => update({ q: e.target.value.slice(0, 80) })}
            placeholder="ابحثي عن منتج..."
            className="w-full rounded-xl border border-border bg-card py-3 ps-11 pe-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => update({ category: "" })}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
              category === ""
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update({ category: c.slug })}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                category === c.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary"
              }`}
            >
              {c.name}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value as ProductSearch["sort"] })}
            className="ms-auto rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold outline-none focus:border-primary"
          >
            <option value="newest">الأحدث</option>
            <option value="price-asc">السعر: الأقل أولاً</option>
            <option value="price-desc">السعر: الأعلى أولاً</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          لا توجد منتجات مطابقة لبحثكِ.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} categories={categories} currencyLabel={currency} />
          ))}
        </div>
      )}
    </div>
  );
}