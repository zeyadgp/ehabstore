import { Link } from "@tanstack/react-router";
import { Heart, Share2, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "./SmartImage";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { shareProduct } from "@/lib/share";
import { fallbackFor } from "@/lib/images";
import { priceOf, type Category, type Product } from "@/lib/store";
import { useCurrency } from "@/lib/currency";

export type CardStyle = "classic" | "modern";

export function ProductCard({
  product,
  categories,
  variant = "classic",
}: {
  product: Product;
  categories: Category[];
  currencyLabel?: string;
  variant?: CardStyle;
}) {
  const cart = useCart();
  const { formatUnit, format } = useCurrency();
  const { isFavorite, toggle } = useFavorites();
  const category = categories.find((c) => c.id === product.category_id);
  const finalPrice = priceOf(product);
  const hasDiscount = product.discount_price != null && product.discount_price > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
    : 0;
  const fav = isFavorite(product.id);

  const addToCart = () => {
    cart.add({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: finalPrice,
      image: product.images?.[0] ?? null,
    });
    toast.success("تمت الإضافة إلى السلة");
  };

  const share = async () => {
    const res = await shareProduct(product.name, product.slug);
    if (res === "copied") toast.success("تم نسخ رابط المنتج");
    if (res === "failed") toast.error("تعذرت المشاركة");
  };

  const favButton = (
    <button
      type="button"
      onClick={() => {
        const now = toggle(product.id);
        toast.success(now ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
      }}
      aria-label="المفضلة"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 shadow-soft backdrop-blur transition-colors hover:border-primary"
    >
      <Heart className={`h-4 w-4 ${fav ? "fill-rose text-rose" : "text-muted-foreground"}`} />
    </button>
  );

  const shareButton = (
    <button
      type="button"
      onClick={share}
      aria-label="مشاركة المنتج"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/90 shadow-soft backdrop-blur transition-colors hover:border-primary"
    >
      <Share2 className="h-4 w-4 text-muted-foreground" />
    </button>
  );

  if (variant === "modern") {
    return (
      <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-2.5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className="absolute top-4 end-4 z-10 flex flex-col gap-2">
          {favButton}
          {shareButton}
        </div>
        {hasDiscount && discountPct > 0 && (
          <span className="absolute top-4 start-4 z-10 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-rose text-[11px] font-extrabold leading-none text-primary-foreground shadow-lift">
            <span>{discountPct}%</span>
            <span className="mt-0.5 text-[9px]">خصم</span>
          </span>
        )}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="relative block aspect-square overflow-hidden rounded-2xl bg-muted"
        >
          <SmartImage
            paths={product.images}
            fallback={fallbackFor(category?.slug)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.stock <= 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-bold text-muted-foreground">
              نفدت الكمية
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-1.5 px-2 pb-1 pt-3">
          {category && <span className="text-[11px] text-muted-foreground">{category.name}</span>}
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="line-clamp-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-0.5 text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-extrabold text-primary">
                {formatUnit(product.id, finalPrice)}
              </span>
              {hasDiscount && (
                <span className="truncate text-xs text-muted-foreground line-through">
                  {format(Number(product.price))}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={addToCart}
              aria-label="أضف إلى السلة"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gradient-gold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="absolute top-3 end-3 z-10 flex gap-2">{shareButton}</div>
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
          onClick={addToCart}
          className="mt-2 w-full rounded-xl gradient-gold px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          أضف إلى السلة
        </button>
      </div>
    </article>
  );
}
