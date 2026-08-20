import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Truck, ShieldCheck, Sparkles, Search, CreditCard, MessageCircle, Percent } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { ProductGrid } from "@/components/ProductGrid";
import { AdStrip, HeroAds, TrustTicker } from "@/components/AdBanner";
import { fallbackFor } from "@/lib/images";
import { useQuery } from "@tanstack/react-query";
import {
  testimonialsQuery,
  useCategories,
  useProducts,
  useSettings,
  childrenOf,
  rootCategories,
} from "@/lib/store";

const title = "إيهاب ستور للعناية والتجميل | منتجات أصلية للبشرة والشعر والمكياج";
const description =
  "تسوقي أرقى منتجات العناية بالبشرة والشعر والمكياج والعطور من إيهاب ستور. منتجات أصلية 100%، أسعار منافسة، وطلب سريع عبر واتساب.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const { data: testimonials = [] } = useQuery(testimonialsQuery);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const roots = rootCategories(categories);

  const bestsellers = products.filter((p) => p.is_bestseller).slice(0, 8);
  const latest = products.slice(0, 8);
  const offers = products.filter((p) => p.discount_price && p.discount_price > 0).slice(0, 8);
  const suggested = products
    .filter((p) => p.is_featured && !bestsellers.includes(p))
    .slice(0, 4);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/products", search: { category: "", q: q.trim(), sort: "newest" } });
  };

  return (
    <div>
      {/* Smart search */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <form onSubmit={search} className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحثي عن منتج، قسم، أو ماركة..."
              aria-label="بحث"
              className="w-full rounded-2xl border border-border bg-card py-2.5 ps-9 pe-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl gradient-gold px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-soft sm:text-sm"
          >
            بحث
          </button>
        </form>
      </div>

      <TrustTicker />

      <HeroAds fallbackImage={hero} />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 md:grid-cols-2 md:py-14">
          <div className="order-2 text-center md:order-1 md:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4" /> منتجات أصلية 100%
            </span>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight text-foreground md:text-5xl">
              {settings?.hero_title ?? (
                <>
                  جمالكِ يبدأ من <span className="text-gradient-gold">إيهاب ستور</span>
                </>
              )}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground md:mx-0 md:text-base">
              {settings?.hero_subtitle ??
                "تشكيلة فاخرة من منتجات العناية بالبشرة والشعر والمكياج والعطور، مختارة بعناية لكِ بأسعار منافسة وطلب سهل عبر واتساب."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                to="/products"
                className="rounded-xl gradient-gold px-7 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
              >
                تسوّقي الآن
              </Link>
              <Link
                to="/products"
                search={{ category: "offers", q: "", sort: "newest" }}
                className="rounded-xl border border-primary/40 bg-card px-7 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary"
              >
                عروض هذا الأسبوع
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img
              src={hero}
              alt="منتجات العناية والتجميل الفاخرة في إيهاب ستور"
              width={1600}
              height={1008}
              className="w-full rounded-3xl object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      {/* Quick categories */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <SectionTitle title="تسوّقي حسب التصنيف" subtitle="اختاري ما يناسب روتين جمالكِ" />
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:gap-4 lg:grid-cols-6">
          {roots.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <Link
                to="/products"
                search={{ category: c.slug, q: "", sort: "newest" }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={c.image || fallbackFor(c.slug)}
                    alt={c.name}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="py-2.5 text-center text-[11px] font-bold sm:text-sm">{c.name}</p>
              </Link>
              {childrenOf(categories, c.id).length > 0 && (
                <div className="hidden flex-wrap justify-center gap-1.5 sm:flex">
                  {childrenOf(categories, c.id)
                    .slice(0, 3)
                    .map((sub) => (
                      <Link
                        key={sub.id}
                        to="/products"
                        search={{ category: sub.slug, q: "", sort: "newest" }}
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {sub.name}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
          <Link
            to="/products"
            search={{ category: "offers", q: "", sort: "newest" }}
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-primary/40 gradient-soft p-3 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full gradient-gold text-primary-foreground">
              <Percent className="h-5 w-5" />
            </span>
            <p className="text-[11px] font-bold text-primary sm:text-sm">التخفيضات</p>
          </Link>
        </div>
      </section>

      <AdStrip placement="strip" />

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <SectionRow title="الأكثر مبيعاً" subtitle="اختيارات عميلاتنا المفضلة" sort="bestseller" />
          <ProductGrid products={bestsellers} categories={categories} className="mt-4" />
        </section>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <section className="gradient-soft py-8">
          <div className="mx-auto max-w-6xl px-4">
            <SectionRow title="عروض وخصومات" subtitle="وفّري أكثر على منتجاتكِ المفضلة" category="offers" />
            <ProductGrid products={offers} categories={categories} className="mt-4" />
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <AdStrip placement="content" />
        <SectionRow title="وصل حديثاً" subtitle="أحدث ما أضيف إلى المتجر" />
        <ProductGrid products={latest} categories={categories} className="mt-4" />
      </section>

      {/* Suggested */}
      {suggested.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <SectionRow title="منتجات مقترحة لكِ" subtitle="مختارة بعناية من فريقنا" />
          <ProductGrid products={suggested} categories={categories} className="mt-4" />
        </section>
      )}

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "منتجات أصلية", text: "مصادر موثوقة وضمان الجودة" },
            { icon: CreditCard, title: "دفع آمن", text: "محافظ وبنوك محلية معتمدة" },
            { icon: Truck, title: "توصيل سريع", text: "لكل المحافظات خلال أيام" },
            { icon: MessageCircle, title: "دعم واتساب", text: "رد فوري على استفساراتكِ" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold sm:text-sm">{f.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <SectionTitle title="آراء عميلاتنا" subtitle="ثقتكِ هي أغلى ما نملك" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex gap-1 text-primary">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-7 text-muted-foreground">
                  {t.content}
                </blockquote>
                <figcaption className="mt-3 text-sm font-bold">{t.customer_name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      <section className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h2 className="text-2xl font-extrabold md:text-3xl">عن المتجر</h2>
        <p className="mt-3 text-sm leading-8 text-muted-foreground md:text-base">
          {settings?.about ??
            "متجر متخصص في منتجات العناية بالبشرة والشعر والمكياج والعطور، نختار لكِ الأفضل عالمياً بجودة أصلية مضمونة."}
        </p>
      </section>
    </div>
  );
}

function SectionTitle({ title: t, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h2 className="text-xl font-extrabold text-foreground md:text-3xl">{t}</h2>
      <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
      <span className="mx-auto mt-3 block h-0.5 w-16 rounded-full gradient-gold" />
    </div>
  );
}

function SectionRow({
  title: t,
  subtitle,
  category = "",
  sort = "newest",
}: {
  title: string;
  subtitle: string;
  category?: string;
  sort?: "newest" | "bestseller";
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold text-foreground md:text-2xl">{t}</h2>
        <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">{subtitle}</p>
      </div>
      <Link
        to="/products"
        search={{ category, q: "", sort }}
        className="shrink-0 rounded-xl border border-primary/40 bg-card px-3 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-secondary sm:text-sm"
      >
        عرض الكل
      </Link>
    </div>
  );
}
