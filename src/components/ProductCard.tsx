import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SmartImage } from "./SmartImage";
import { useCart } from "@/lib/cart";
import { fallbackFor } from "@/lib/images";
import { priceOf, type Category, type Product } from "@/lib/store";
import { useCurrency } from "@/lib/currency";

export function ProductCard({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
  currencyLabel?: string;
}) {
  const cart = useCart();
  const { formatUnit, format } = useCurrency();
  const category = categories.find((c) => c.id === product.category_id);
  const finalPrice = priceOf(product);
  const hasDiscount = product.discount_price != null && product.discount_price > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
    : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <SmartImage
          paths={product.images}
          fallback={fallbackFor(category?.slug)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasDiscount && discountPct > 0 && (
          <span className="absolute top-3 start-3 rounded-full bg-rose px-3 py-1 text-xs font-bold text-primary-foreground shadow-soft">
            خصم {discountPct}%
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-bold text-muted-foreground">
            نفدت الكمية
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && <span className="text-xs text-muted-foreground">{category.name}</span>}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-base font-bold text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-extrabold text-primary">
            {formatUnit(product.id, finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {format(Number(product.price))}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={() => {
            cart.add({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: finalPrice,
              image: product.images?.[0] ?? null,
            });
            toast.success("تمت الإضافة إلى السلة");
          }}
          className="mt-2 w-full rounded-xl gradient-gold px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          أضف إلى السلة
        </button>
      </div>
    </article>
  );
}