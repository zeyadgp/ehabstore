import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductGrid, useGridSettings } from "@/components/ProductGrid";
import { AdStrip } from "@/components/AdBanner";
import {
  categoryTreeIds,
  childrenOf,
  priceOf,
  rootCategories,
  useCategories,
  useProducts,
} from "@/lib/store";

type SortKey = "newest" | "price-asc" | "price-desc";
type ProductSearch = {
  category?: string | undefined;
  q?: string | undefined;
  sort?: SortKey | undefined;
  filter?: string | undefined;
  min?: string | undefined;
  max?: string | undefined;
  stock?: string | undefined;
  deals?: string | undefined;
};

const title = "جميع المنتجات | إيهاب ستور للعناية والتجميل";
const description =
  "تصفحي جميع منتجات العناية بالبشرة والشعر والمكياج والعطور في إيهاب ستور مع فلترة حسب التصنيف والسعر.";

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : undefined);
    const flag = (v: unknown) => (v === "1" ? "1" : undefined);
    return {
      category: str(search['category']),
      q: str(search['q']),
      sort:
        search['sort'] === "price-asc" || search['sort'] === "price-desc"
          ? search['sort']
          : undefined,
      filter: flag(search['filter']),
      min: str(search['min']),
      max: str(search['max']),
      stock: flag(search['stock']),
      deals: flag(search['deals']),
    };
  },
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
  const {
    category = "",
    q = "",
    sort = "newest",
    filter = "",
    min = "",
    max = "",
    stock = "",
    deals = "",
  } = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts();
  const { columns } = useGridSettings();
  const [panelOpen, setPanelOpen] = useState(filter === "1");

  const activeCat = categories.find((c) => c.slug === category);
  const allowedIds = activeCat ? categoryTreeIds(categories, activeCat.id) : null;
  const activeRoot = activeCat
    ? activeCat.parent_id
      ? categories.find((c) => c.id === activeCat.parent_id)
      : activeCat
    : null;
  const subCats = activeRoot ? childrenOf(categories, activeRoot.id) : [];
  let list = products.filter((p) => {
    const matchCat = !allowedIds || (p.category_id != null && allowedIds.includes(p.category_id));
    const matchQ = !q || p.name.includes(q) || (p.description ?? "").includes(q);
    const price = priceOf(p);
    const matchMin = !min || price >= Number(min);
    const matchMax = !max || price <= Number(max);
    const matchStock = stock !== "1" || p.stock > 0;
    const matchDeals = deals !== "1" || (p.discount_price != null && p.discount_price > 0);
    return matchCat && matchQ && matchMin && matchMax && matchStock && matchDeals;
  });
  if (sort === "price-asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === "price-desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));

  const update = (patch: Partial<ProductSearch>) =>
    navigate({
      search: (prev: ProductSearch) => {
        const next = { ...prev, ...patch } as Record<string, string | undefined>;
        Object.keys(next).forEach((k) => {
          if (!next[k]) delete next[k];
        });
        return next as ProductSearch;
      },
    });

  const activeFilters =
    (min ? 1 : 0) + (max ? 1 : 0) + (stock === "1" ? 1 : 0) + (deals === "1" ? 1 : 0);

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
            onClick={() => setPanelOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
              panelOpen || activeFilters > 0
                ? "border-primary bg-secondary text-primary"
                : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> الفلتر
            {activeFilters > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
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
          {rootCategories(categories).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update({ category: c.slug })}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                activeRoot?.id === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary"
              }`}
            >
              {c.name}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value as SortKey })}
            className="ms-auto rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold outline-none focus:border-primary"
          >
            <option value="newest">الأحدث</option>
            <option value="price-asc">السعر: الأقل أولاً</option>
            <option value="price-desc">السعر: الأعلى أولاً</option>
          </select>
        </div>

        {subCats.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => update({ category: activeRoot!.slug })}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                category === activeRoot!.slug
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary"
              }`}
            >
              كل {activeRoot!.name}
            </button>
            {subCats.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => update({ category: s.slug })}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  category === s.slug
                    ? "border-primary bg-secondary text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {panelOpen && (
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold">تصفية النتائج</p>
              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  update({ filter: "" });
                }}
                aria-label="إغلاق الفلتر"
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold">أقل سعر</span>
                <input
                  type="number"
                  min="0"
                  value={min}
                  onChange={(e) => update({ min: e.target.value })}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold">أعلى سعر</span>
                <input
                  type="number"
                  min="0"
                  value={max}
                  onChange={(e) => update({ max: e.target.value })}
                  placeholder="بدون حد"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => update({ stock: stock === "1" ? "" : "1" })}
                className={`rounded-full border px-4 py-2 text-xs font-bold ${
                  stock === "1" ? "border-primary bg-secondary text-primary" : "border-border bg-background"
                }`}
              >
                المتوفر فقط
              </button>
              <button
                type="button"
                onClick={() => update({ deals: deals === "1" ? "" : "1" })}
                className={`rounded-full border px-4 py-2 text-xs font-bold ${
                  deals === "1" ? "border-primary bg-secondary text-primary" : "border-border bg-background"
                }`}
              >
                عليه خصم
              </button>
              <button
                type="button"
                onClick={() => update({ min: "", max: "", stock: "", deals: "", category: "", q: "" })}
                className="ms-auto rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:border-primary"
              >
                مسح الكل
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          className={`mt-10 grid gap-4 ${columns === 3 ? "grid-cols-3 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4"}`}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          لا توجد منتجات مطابقة لبحثكِ.
        </p>
      ) : (
        <ProductGrid products={list} categories={categories} className="mt-8" />
      )}

      <AdStrip placement="strip" />
    </div>
  );
}