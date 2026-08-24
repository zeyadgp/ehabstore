import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { AdStrip } from "@/components/AdBanner";
import { useFavorites } from "@/lib/favorites";
import { useCategories, useProducts } from "@/lib/store";

const title = "المفضلة | إيهاب ستور للعناية والتجميل";
const description = "منتجاتك المفضلة المحفوظة في إيهاب ستور، جاهزة للطلب في أي وقت عبر واتساب.";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ehabstore.app/favorites" }],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids } = useFavorites();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const list = products.filter((p) => ids.includes(p.id));
  const suggestions = products.filter((p) => !ids.includes(p.id)).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-rose">
          <Heart className="h-6 w-6 fill-current" />
        </span>
        <h1 className="text-3xl font-extrabold">المفضلة</h1>
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {list.length > 0 ? `${list.length} منتج محفوظ لديكِ` : "احفظي منتجاتك المفضلة للرجوع إليها بسرعة"}
      </p>

      {isLoading ? (
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : list.length > 0 ? (
        <ProductGrid products={list} categories={categories} className="mt-8" />
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-primary/40 bg-secondary/30 p-10 text-center">
          <p className="text-sm font-bold">لا توجد منتجات في المفضلة بعد</p>
          <p className="mt-2 text-xs text-muted-foreground">
            اضغطي على أيقونة القلب في أي منتج لإضافته هنا.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-block rounded-xl gradient-gold px-7 py-3 text-sm font-bold text-primary-foreground"
          >
            تصفّحي المنتجات
          </Link>
        </div>
      )}

      <AdStrip placement="strip" />

      {suggestions.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-extrabold">قد يعجبكِ أيضاً</h2>
          <ProductGrid products={suggestions} categories={categories} className="mt-4" />
        </section>
      )}
    </div>
  );
}
