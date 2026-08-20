import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, ShieldCheck, Share2, Truck } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductReviews } from "@/components/ProductReviews";
import { useCart } from "@/lib/cart";
import { fallbackFor } from "@/lib/images";
import { shareProduct } from "@/lib/share";
import {
  fetchProductBySlug,
  priceOf,
  useCategories,
  useProducts,
  useSettings,
} from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { buildProductMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: "تفاصيل المنتج | إيهاب ستور للعناية والتجميل" },
      {
        name: "description",
        content: "تفاصيل المنتج والسعر وطلب سريع عبر واتساب من إيهاب ستور للعناية والتجميل.",
      },
      { property: "og:title", content: "تفاصيل المنتج | إيهاب ستور" },
      {
        property: "og:description",
        content: "تفاصيل المنتج والسعر وطلب سريع عبر واتساب من إيهاب ستور.",
      },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `/product/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/product/${params.slug}` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const { data: settings } = useSettings();
  const { formatUnit, format, unitFor, symbol } = useCurrency();
  const { data: categories = [] } = useCategories();
  const { data: all = [] } = useProducts();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });

  const currency = symbol;

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-16"><div className="h-96 animate-pulse rounded-3xl bg-muted" /></div>;
  }

  if (!product || !product.status) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">المنتج غير متوفر</h1>
        <p className="mt-3 text-sm text-muted-foreground">ربما تم حذفه أو تغيير رابطه.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground"
        >
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.category_id);
  const finalPrice = priceOf(product);
  const hasDiscount = product.discount_price != null && product.discount_price > 0;
  const related = all
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  const waLink = whatsappLink(
    settings?.whatsapp_number ?? "+967780187409",
    buildProductMessage({
      storeName: settings?.store_name ?? "إيهاب ستور للعناية والتجميل",
      productName: product.name,
      quantity: qty,
      unitPrice: unitFor(product.id, finalPrice),
      currencyLabel: currency,
    }),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          الرئيسية
        </Link>{" "}
        / <Link to="/products" className="hover:text-primary">المنتجات</Link>
        {category && <> / {category.name}</>}
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <SmartImage
            paths={product.images}
            fallback={fallbackFor(category?.slug)}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          {category && <span className="text-xs font-bold text-primary">{category.name}</span>}
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-extrabold md:text-3xl">{product.name}</h1>
            <button
              type="button"
              onClick={async () => {
                const res = await shareProduct(product.name, product.id);
                if (res === "copied") toast.success("تم نسخ رابط المنتج");
                if (res === "failed") toast.error("تعذرت المشاركة");
              }}
              aria-label="مشاركة المنتج"
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Share2 className="h-4 w-4" /> مشاركة
            </button>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-primary">
              {formatUnit(product.id, finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-base text-muted-foreground line-through">
                {format(Number(product.price))}
              </span>
            )}
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-8 text-muted-foreground">
            {product.description ?? "منتج أصلي مختار بعناية من إيهاب ستور."}
          </p>

          <p className={`mt-4 text-sm font-bold ${product.stock > 0 ? "text-primary" : "text-destructive"}`}>
            {product.stock > 0 ? `متوفر (${product.stock} قطعة)` : "نفدت الكمية"}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
                aria-label="إنقاص"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
                aria-label="زيادة"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => {
                cart.add(
                  {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: finalPrice,
                    image: product.images?.[0] ?? null,
                  },
                  qty,
                );
                toast.success("تمت الإضافة إلى السلة");
              }}
              className="flex-1 rounded-xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              أضف إلى السلة
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl border border-primary/40 bg-card px-6 py-3 text-center text-sm font-bold text-primary hover:bg-secondary"
            >
              اطلب عبر واتساب
            </a>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-xs">
              <ShieldCheck className="h-4 w-4 text-primary" /> منتج أصلي مضمون
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-xs">
              <Truck className="h-4 w-4 text-primary" /> توصيل سريع لجميع المدن
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-extrabold">منتجات مشابهة</h2>
          <ProductGrid products={related} categories={categories} className="mt-5" />
        </section>
      )}
    </div>
  );
}