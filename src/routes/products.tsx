import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductGrid, useGridSettings } from "@/components/ProductGrid";
import { AdStrip } from "@/components/AdBanner";
import { SmartImage } from "@/components/SmartImage";
import { fallbackFor } from "@/lib/images";
import {
  childrenOf,
  productMatchesCategory,
  priceOf,
  rootCategories,
  rootOf,
  useCategories,
  useProducts,
  useProductLinks,
} from "@/lib/store";
import { useReviewStats } from "@/lib/reviews";

type SortKey = "newest" | "price-asc" | "price-desc" | "bestseller" | "rating";
type ProductSearch = {
  category?: string | undefined;
  q?: string | undefined;
  sort?: SortKey | undefined;
  filter?: string | undefined;
  min?: string | undefined;
  max?: string | undefined;
  stock?: string | undefined;
  deals?: string | undefined;
  rating?: string | undefined;
  new?: string | undefined;
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
      sort: (["price-asc", "price-desc", "bestseller", "rating"] as string[]).includes(
        String(search['sort']),
      )
        ? (search['sort'] as SortKey)
        : undefined,
      filter: flag(search['filter']),
      min: str(search['min']),
      max: str(search['max']),
      stock: flag(search['stock']),
      deals: flag(search['deals']),
      rating: str(search['rating']),
      new: flag(search['new']),
    };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "https://ehabstore.app/products" },
    ],
    links: [{ rel: "canonical", href: "https://ehabstore.app/products" }],
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
    rating = "",
    new: onlyNew = "",
  } = Route.useSearch();
  const navigate = useNavigate({ from: "/products" });
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts();
  const { data: links = [] } = useProductLinks();
  const { data: stats = {} } = useReviewStats();
  const { columns } = useGridSettings();
  const [panelOpen, setPanelOpen] = useState(filter === "1");

  const activeCat = categories.find((c) => c.slug === category);

  // Climb parent_id all the way up so deep sub-categories still highlight their root chip.
  const activeRoot = activeCat ? rootOf(categories, activeCat) : null;
  const ownKids = activeCat ? childrenOf(categories, activeCat.id) : [];
  const siblings = activeCat?.parent_id ? childrenOf(categories, activeCat.parent_id) : [];
  const subCats = ownKids.length > 0 ? ownKids : siblings;
  const subParent = activeCat && ownKids.length > 0
    ? activeCat
    : activeCat?.parent_id
      ? categories.find((c) => c.id === activeCat.parent_id) ?? activeRoot
      : activeRoot;
  let list = products.filter((p) => {
    const matchCat = !activeCat || productMatchesCategory(p, activeCat, categories, links, stats);
    const pCat = categories.find((c) => c.id === p.category_id);
    const matchQ =
      !q ||
      p.name.includes(q) ||
      (p.description ?? "").includes(q) ||
      (pCat?.name ?? "").includes(q);
    const price = priceOf(p);
    const matchMin = !min || price >= Number(min);
    const matchMax = !max || price <= Number(max);
    const matchStock = stock !== "1" || p.stock > 0;
    const matchDeals = deals !== "1" || (p.discount_price != null && p.discount_price > 0);
    const matchRating = !rating || (stats[p.id]?.avg ?? 0) >= Number(rating);
    const matchNew =
      onlyNew !== "1" ||
      Date.now() - new Date(p.created_at).getTime() < 1000 * 60 * 60 * 24 * 30;
    return (
      matchCat && matchQ && matchMin && matchMax && matchStock && matchDeals && matchRating && matchNew
    );
  });
  if (sort === "price-asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
  if (sort === "price-desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
  if (sort === "bestseller")
    list = [...list].sort((a, b) => Number(b.is_bestseller) - Number(a.is_bestseller));
  if (sort === "rating")
    list = [...list].sort((a, b) => (stats[b.id]?.avg ?? 0) - (stats[a.id]?.avg ?? 0));

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

  // Per-category SEO: title, description, keywords and breadcrumb structured data.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const seoTitle = activeCat?.seo_title ?? (activeCat ? `${activeCat.name} | إيهاب ستور للعناية والتجميل` : title);
    const seoDesc =
      activeCat?.seo_description ??
      (activeCat
        ? `تسوقي منتجات ${activeCat.name} الأصلية من إيهاب ستور مع توصيل لكل محافظات اليمن.`
        : description);
    document.title = seoTitle;
    const setMeta = (key: string, attr: "name" | "property", value: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    setMeta("description", "name", seoDesc);
    setMeta("keywords", "name", activeCat?.seo_keywords ?? "إيهاب ستور, العناية والتجميل, اليمن");
    setMeta("og:title", "property", seoTitle);
    setMeta("og:description", "property", seoDesc);
    const url = activeCat
      ? `https://ehabstore.app/products?category=${encodeURIComponent(activeCat.slug)}`
      : "https://ehabstore.app/products";
    setMeta("og:url", "property", url);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const id = "category-jsonld";
    document.getElementById(id)?.remove();
    if (activeCat) {
      // Full ancestor chain (unlimited depth), not just the direct parent.
      const chain: { name: string; slug: string }[] = [];
      let node = activeCat as typeof activeCat | undefined;
      for (let i = 0; i < 20 && node; i += 1) {
        chain.unshift({ name: node.name, slug: node.slug });
        node = node.parent_id ? categories.find((c) => c.id === node!.parent_id) : undefined;
      }
      const crumbs = [{ name: "الرئيسية", slug: "" }, ...chain];
      const script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          item: c.slug ? `/products?category=${c.slug}` : "/",
        })),
      });
      document.head.appendChild(script);
    }
    return () => document.getElementById(id)?.remove();
  }, [activeCat, categories]);

  const activeFilters =
    (min ? 1 : 0) +
    (max ? 1 : 0) +
    (stock === "1" ? 1 : 0) +
    (deals === "1" ? 1 : 0) +
    (rating ? 1 : 0) +
    (onlyNew === "1" ? 1 : 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {activeCat ? (
        <header className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="relative h-32 w-full overflow-hidden bg-muted sm:h-44">
            <SmartImage
              paths={activeCat.cover_image ? [activeCat.cover_image] : activeCat.image ? [activeCat.image] : []}
              fallback={fallbackFor(activeCat.slug)}
              alt={activeCat.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-4">
            <h1 className="text-xl font-extrabold sm:text-2xl">
              {activeCat.icon ? `${activeCat.icon} ` : ""}
              {activeCat.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeCat.description ?? `${list.length} منتج متاح الآن`}
            </p>
          </div>
        </header>
      ) : (
        <>
          <h1 className="text-center text-3xl font-extrabold">جميع المنتجات</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {list.length} منتج متاح الآن
          </p>
        </>
      )}

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
            <option value="bestseller">الأكثر مبيعاً</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>

        {subCats.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => update({ category: subParent!.slug })}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                category === subParent!.slug
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary"
              }`}
            >
              كل {subParent!.name}
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
                onClick={() => update({ new: onlyNew === "1" ? "" : "1" })}
                className={`rounded-full border px-4 py-2 text-xs font-bold ${
                  onlyNew === "1" ? "border-primary bg-secondary text-primary" : "border-border bg-background"
                }`}
              >
                جديد
              </button>
              {["4", "3"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update({ rating: rating === r ? "" : r })}
                  className={`rounded-full border px-4 py-2 text-xs font-bold ${
                    rating === r ? "border-primary bg-secondary text-primary" : "border-border bg-background"
                  }`}
                >
                  ★ {r} فأعلى
                </button>
              ))}
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
                onClick={() =>
                  update({ min: "", max: "", stock: "", deals: "", category: "", q: "", rating: "", new: "" })
                }
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