import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { useCart } from "@/lib/cart";
import { fallbackFor } from "@/lib/images";
import { useCurrency } from "@/lib/currency";

const title = "سلة المشتريات | إيهاب ستور للعناية والتجميل";
const description = "راجعي منتجاتكِ قبل إتمام الطلب عبر واتساب من إيهاب ستور للعناية والتجميل.";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/cart" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/cart" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, setQuantity } = useCart();
  const { unitFor, format, symbol } = useCurrency();
  const total = items.reduce((s, i) => s + unitFor(i.id, i.price) * i.quantity, 0);
  const fmt = (n: number) =>
    `${Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ${symbol}`;
  void format;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-extrabold">سلتكِ فارغة</h1>
        <p className="mt-2 text-sm text-muted-foreground">ابدئي التسوق واختاري منتجاتكِ المفضلة.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl gradient-gold px-7 py-3 text-sm font-bold text-primary-foreground"
        >
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-extrabold md:text-3xl">سلة المشتريات</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft"
            >
              <Link
                to="/product/$slug"
                params={{ slug: item.slug }}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <SmartImage
                  paths={item.image ? [item.image] : []}
                  fallback={fallbackFor()}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link
                  to="/product/$slug"
                  params={{ slug: item.slug }}
                  className="line-clamp-2 text-sm font-bold hover:text-primary"
                >
                  {item.name}
                </Link>
                <span className="mt-1 text-sm font-extrabold text-primary">
                  {fmt(unitFor(item.id, item.price))}
                </span>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded hover:bg-secondary"
                      aria-label="إنقاص"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded hover:bg-secondary"
                      aria-label="زيادة"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="flex items-center gap-1 text-xs font-bold text-destructive hover:opacity-80"
                  >
                    <Trash2 className="h-4 w-4" /> حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-base font-bold">ملخص الطلب</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>عدد المنتجات</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold">
              <span>الإجمالي</span>
              <span className="text-primary">{fmt(total)}</span>
            </div>
          </div>
          <Link
            to="/checkout"
            className="mt-5 block rounded-xl gradient-gold py-3 text-center text-sm font-bold text-primary-foreground shadow-soft"
          >
            إتمام الطلب
          </Link>
          <Link
            to="/products"
            className="mt-2 block rounded-xl border border-border py-3 text-center text-sm font-bold hover:bg-secondary"
          >
            متابعة التسوق
          </Link>
        </aside>
      </div>
    </div>
  );
}