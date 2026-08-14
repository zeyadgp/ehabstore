import { Link } from "@tanstack/react-router";
import { SmartImage } from "@/components/SmartImage";
import { useSettings } from "@/lib/store";

/** Store name colour is configurable from the dashboard; black is the default. */
export function brandColorClass(value?: string | null) {
  if (value === "gold") return "text-primary";
  if (value === "rose") return "text-rose";
  if (value === "gradient") return "text-gradient-gold";
  return "text-foreground";
}

export function BrandMark({
  size = "md",
  asLink = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  className?: string;
}) {
  const { data: settings } = useSettings();
  const storeName = settings?.store_name ?? "إيهاب ستور للعناية والتجميل";
  const img = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const text =
    size === "lg" ? "text-lg md:text-xl" : size === "sm" ? "text-[13px]" : "text-sm md:text-base";

  const inner = (
    <>
      <SmartImage
        paths={settings?.logo ? [settings.logo] : []}
        fallback="/favicon.png"
        alt={storeName}
        eager
        className={`${img} shrink-0 rounded-2xl object-contain`}
      />
      <span
        className={`truncate font-extrabold leading-tight ${text} ${brandColorClass(settings?.brand_text_color)}`}
      >
        {storeName}
      </span>
    </>
  );

  if (!asLink) return <div className={`flex min-w-0 items-center gap-2 ${className}`}>{inner}</div>;
  return (
    <Link to="/" className={`flex min-w-0 items-center gap-2 ${className}`}>
      {inner}
    </Link>
  );
}
