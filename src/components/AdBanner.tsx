import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SmartImage } from "@/components/SmartImage";
import { fallbackFor } from "@/lib/images";
import { useBanners, type Banner, type BannerPlacement } from "@/lib/banners";

function Cta({ banner }: { banner: Banner }) {
  if (!banner.cta_label) return null;
  const url = banner.cta_url || "/products";
  const cls =
    "inline-flex items-center gap-2 rounded-2xl gradient-gold px-6 py-3 text-sm font-bold text-primary-foreground shadow-lift transition-opacity hover:opacity-90";
  if (url.startsWith("http")) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={cls}>
        {banner.cta_label} <ArrowLeft className="h-4 w-4" />
      </a>
    );
  }
  return (
    <Link to={url} className={cls}>
      {banner.cta_label} <ArrowLeft className="h-4 w-4" />
    </Link>
  );
}

/** Rotating hero advertisement managed from the dashboard. */
export function HeroAds({ fallbackImage }: { fallbackImage: string }) {
  const { data: banners } = useBanners("hero");
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const b = banners[Math.min(i, banners.length - 1)]!;

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 pt-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-border shadow-lift">
          <div className="relative aspect-[16/10] w-full sm:aspect-[16/7]">
            <SmartImage
              paths={b.image ? [b.image] : []}
              fallback={fallbackImage || fallbackFor()}
              alt={b.title}
              eager
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/70 to-background/10" />
            <div className="relative flex h-full flex-col justify-center gap-3 p-6 sm:max-w-lg sm:p-10">
              {b.badge && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-card/90 px-4 py-1.5 text-[11px] font-bold text-primary backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" /> {b.badge}
                </span>
              )}
              <h2 className="text-2xl font-extrabold leading-tight text-foreground sm:text-4xl">
                {b.title}
              </h2>
              {b.subtitle && (
                <p className="max-w-md text-xs leading-7 text-muted-foreground sm:text-sm">{b.subtitle}</p>
              )}
              <div className="pt-1">
                <Cta banner={b} />
              </div>
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {banners.map((x, idx) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`إعلان ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? "w-7 gradient-gold" : "w-2 bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Wide strip / in-content advertisement blocks. */
export function AdStrip({ placement }: { placement: BannerPlacement }) {
  const { data: banners } = useBanners(placement);
  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className={placement === "content" ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {banners.map((b) => (
          <article
            key={b.id}
            className="group relative overflow-hidden rounded-3xl border border-border shadow-soft"
          >
            <div className={placement === "content" ? "aspect-[4/3]" : "aspect-[16/6]"}>
              <SmartImage
                paths={b.image ? [b.image] : []}
                fallback={fallbackFor("offers")}
                alt={b.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-5 sm:p-8">
              {b.badge && (
                <span className="w-fit rounded-full bg-rose px-3 py-1 text-[10px] font-bold text-primary-foreground">
                  {b.badge}
                </span>
              )}
              <h3 className="max-w-sm text-lg font-extrabold text-foreground sm:text-2xl">{b.title}</h3>
              {b.subtitle && (
                <p className="max-w-sm text-[11px] leading-6 text-muted-foreground sm:text-sm">{b.subtitle}</p>
              )}
              {b.cta_label && (
                <div className="pt-1">
                  <Cta banner={b} />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
