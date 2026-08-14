import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Truck, ShieldCheck, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { ProductGrid } from "@/components/ProductGrid";
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
  const roots = rootCategories(categories);

  const bestsellers = products.filter((p) => p.is_bestseller).slice(0, 4);
  const latest = products.slice(0, 8);
  const offers = products.filter((p) => p.discount_price && p.discount_price > 0).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="order-2 text-center md:order-1 md:text-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4" /> منتجات أصلية 100%
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-foreground md:text-5xl">
              جمالكِ يبدأ من <span className="text-gradient-gold">إيهاب ستور</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-muted-foreground md:mx-0 md:text-base">
              تشكيلة فاخرة من منتجات العناية بالبشرة والشعر والمكياج والعطور، مختارة بعناية لكِ
              بأسعار منافسة وطلب سهل عبر واتساب.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
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

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "منتجات أصلية", text: "مصادر موثوقة وضمان الجودة" },
            { icon: Truck, title: "توصيل سريع", text: "لجميع المدن خلال أيام" },
            { icon: Star, title: "خدمة مميزة", text: "رد فوري على الواتساب" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionTitle title="تسوّقي حسب التصنيف" subtitle="اختاري ما يناسب روتين جمالكِ" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {roots.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
            <Link
              to="/products"
              search={{ category: c.slug, q: "", sort: "newest" }}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={fallbackFor(c.slug)}
                  alt={c.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="py-3 text-center text-sm font-bold">{c.name}</p>
            </Link>
            {childrenOf(categories, c.id).length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {childrenOf(categories, c.id).map((sub) => (
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
        </div>
      </section>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <SectionTitle title="الأكثر مبيعاً" subtitle="اختيارات عميلاتنا المفضلة" />
          <ProductGrid products={bestsellers} categories={categories} />
        </section>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <section className="gradient-soft py-10">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle title="العروض والخصومات" subtitle="وفّري أكثر على منتجاتكِ المفضلة" />
            <ProductGrid products={offers} categories={categories} />
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionTitle title="أحدث المنتجات" subtitle="وصل حديثاً إلى المتجر" />
        <ProductGrid products={latest} categories={categories} />
        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="inline-block rounded-xl border border-primary/40 bg-card px-8 py-3 text-sm font-bold text-primary hover:bg-secondary"
          >
            عرض كل المنتجات
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <SectionTitle title="آراء عميلاتنا" subtitle="ثقتكِ هي أغلى ما نملك" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
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
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h2 className="text-2xl font-extrabold md:text-3xl">عن المتجر</h2>
        <p className="mt-4 text-sm leading-8 text-muted-foreground md:text-base">
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
      <h2 className="text-2xl font-extrabold text-foreground md:text-3xl">{t}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <span className="mx-auto mt-3 block h-0.5 w-16 rounded-full gradient-gold" />
    </div>
  );
}

