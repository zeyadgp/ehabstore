import { Link } from "@tanstack/react-router";
import { Heart, Share2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "./SmartImage";
import { Stars } from "./Stars";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { shareProduct } from "@/lib/share";
import { fallbackFor } from "@/lib/images";
import { priceOf, type Category, type Product } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { useReviewStats } from "@/lib/reviews";

export type CardStyle = "classic" | "modern";

export function ProductCard({
  product,
  categories,
  variant = "classic",
  compact = false,
}: {
  product: Product;
  categories: Category[];
  currencyLabel?: string;
  variant?: CardStyle;
  /** Very tight layout used on phones when the grid shows 3 columns. */
  compact?: boolean;
}) {
  const cart = useCart();
  const { formatUnit, format } = useCurrency();
  const { isFavorite, toggle } = useFavorites();
  const { data: stats } = useReviewStats();
  const category = categories.find((c) => c.id === product.category_id);
  const finalPrice = priceOf(product);
  const hasDiscount = product.discount_price != null && product.discount_price > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
    : 0;
  const fav = isFavorite(product.id);
  const stat = stats?.[product.id];

  // Compact styles only bite on phones; from `sm:` up the card looks normal.
  const c = (tight: string, normal: string) => (compact ? tight : normal);

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

  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/85 shadow-soft backdrop-blur transition-colors hover:border-primary";

  /** Both actions sit in the bottom-start corner, the least busy part of a product photo. */
  const imageActions = (
    <div className="absolute bottom-1.5 start-1.5 z-10 flex gap-1">
      <button
        type="button"
        onClick={() => {
          const now = toggle(product.id);
          toast.success(now ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
        }}
        aria-label="المفضلة"
        className={iconBtn}
      >
        <Heart className={`h-3.5 w-3.5 ${fav ? "fill-rose text-rose" : "text-muted-foreground"}`} />
      </button>
      <button type="button" onClick={share} aria-label="مشاركة المنتج" className={iconBtn}>
        <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );

  const rating = (
    <div className="flex items-center gap-1">
      <Stars value={stat?.avg ?? 5} size="xs" />
      {stat?.count ? (
        <span className="text-[10px] text-muted-foreground">({stat.count})</span>
      ) : null}
    </div>
  );

  if (variant === "modern") {
    return (
      <article
        className={`group relative flex flex-col overflow-hidden border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${c("rounded-2xl p-1.5 sm:rounded-3xl sm:p-2.5", "rounded-3xl p-2.5")}`}
      >
        {hasDiscount && discountPct > 0 && (
          <span
            className={`absolute top-2.5 end-2.5 z-10 rounded-full bg-rose font-extrabold text-primary-foreground shadow-lift ${c("px-1.5 py-0.5 text-[9px] sm:px-2 sm:py-1 sm:text-[11px]", "px-2 py-1 text-[11px]")}`}
          >
            {discountPct}% خصم
          </span>
        )}
        <div className="relative block aspect-square overflow-hidden rounded-2xl bg-muted">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="block h-full w-full">
            <SmartImage
              paths={product.images}
              fallback={fallbackFor(category?.slug)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {product.stock <= 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-bold text-muted-foreground">
                نفدت الكمية
              </span>
            )}
          </Link>
          {imageActions}
        </div>

        <div className={`flex flex-1 flex-col ${c("gap-1 px-1 pb-0.5 pt-1.5 sm:gap-1.5 sm:px-2 sm:pb-1 sm:pt-3", "gap-1.5 px-2 pb-1 pt-3")}`}>
          {category && (
            <span className={`truncate text-muted-foreground ${c("text-[9px] sm:text-[11px]", "text-[11px]")}`}>
              {category.name}
            </span>
          )}
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className={`line-clamp-2 font-bold text-foreground transition-colors hover:text-primary ${c("text-[11px] leading-snug sm:text-sm", "text-sm")}`}
          >
            {product.name}
          </Link>
          {rating}
          <div className={`mt-auto flex items-end justify-between gap-1 ${c("pt-1 sm:pt-2", "pt-2")}`}>
            <div className="flex min-w-0 flex-col">
              <span className={`truncate font-extrabold text-primary ${c("text-[11px] sm:text-base", "text-base")}`}>
                {formatUnit(product.id, finalPrice)}
              </span>
              {hasDiscount && (
                <span className={`truncate text-muted-foreground line-through ${c("text-[9px] sm:text-xs", "text-xs")}`}>
                  {format(Number(product.price))}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={addToCart}
              aria-label="أضف إلى السلة"
              className={`flex shrink-0 items-center justify-center gradient-gold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${c("h-7 w-7 rounded-lg sm:h-11 sm:w-11 sm:rounded-2xl", "h-11 w-11 rounded-2xl")}`}
            >
              <ShoppingCart className={c("h-3.5 w-3.5 sm:h-5 sm:w-5", "h-5 w-5")} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative flex flex-col overflow-hidden border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${c("rounded-xl sm:rounded-2xl", "rounded-2xl")}`}
    >
      <div className="relative block aspect-square overflow-hidden bg-muted">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block h-full w-full">
          <SmartImage
            paths={product.images}
            fallback={fallbackFor(category?.slug)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {hasDiscount && discountPct > 0 && (
            <span
              className={`absolute top-2 start-2 rounded-full bg-rose font-bold text-primary-foreground shadow-soft ${c("px-1.5 py-0.5 text-[9px] sm:px-3 sm:py-1 sm:text-xs", "px-3 py-1 text-xs")}`}
            >
              خصم {discountPct}%
            </span>
          )}
          {product.stock <= 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-bold text-muted-foreground">
              نفدت الكمية
            </span>
          )}
        </Link>
        {imageActions}
      </div>

      <div className={`flex flex-1 flex-col ${c("gap-1 p-2 sm:gap-2 sm:p-4", "gap-2 p-4")}`}>
        {category && (
          <span className={`truncate text-muted-foreground ${c("text-[9px] sm:text-xs", "text-xs")}`}>
            {category.name}
          </span>
        )}
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className={`line-clamp-2 font-bold text-foreground transition-colors hover:text-primary ${c("text-[11px] leading-snug sm:text-base", "text-base")}`}
        >
          {product.name}
        </Link>
        {rating}
        <div className={`mt-auto flex flex-wrap items-baseline gap-x-2 ${c("pt-1 sm:pt-2", "pt-2")}`}>
          <span className={`font-extrabold text-primary ${c("text-xs sm:text-lg", "text-lg")}`}>
            {formatUnit(product.id, finalPrice)}
          </span>
          {hasDiscount && (
            <span className={`text-muted-foreground line-through ${c("text-[9px] sm:text-sm", "text-sm")}`}>
              {format(Number(product.price))}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={addToCart}
          className={`mt-1 w-full gradient-gold font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${c("rounded-lg px-2 py-1.5 text-[11px] sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm", "rounded-xl px-4 py-2.5 text-sm")}`}
        >
          أضف إلى السلة
        </button>
      </div>
    </article>
  );
}
