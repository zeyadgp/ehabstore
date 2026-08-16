import { ProductCard, type CardStyle } from "@/components/ProductCard";
import { useSettings, type Category, type Product } from "@/lib/store";

/** Grid columns and card style are controlled from the admin dashboard. */
export function useGridSettings() {
  const { data: settings } = useSettings();
  const columns = settings?.grid_columns === 3 ? 3 : 2;
  const style: CardStyle = settings?.card_style === "modern" ? "modern" : "classic";
  return { columns, style };
}

export function ProductGrid({
  products,
  categories,
  className = "mt-6",
}: {
  products: Product[];
  categories: Category[];
  className?: string;
}) {
  const { columns, style } = useGridSettings();
  const cols = columns === 3 ? "grid-cols-3 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4";
  const gap = columns === 3 ? "gap-2.5 sm:gap-4" : "gap-4";

  return (
    <div className={`grid ${cols} ${gap} ${className}`}>
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          categories={categories}
          variant={style}
          compact={columns === 3}
        />
      ))}
    </div>
  );
}
