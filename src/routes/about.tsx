import { createFileRoute } from "@tanstack/react-router";
import { Gem, HeartHandshake, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useSettings } from "@/lib/store";

const title = "من نحن | إيهاب ستور للعناية والتجميل";
const description =
  "تعرّفي على إيهاب ستور: متجر متخصص في منتجات العناية بالبشرة والشعر والمكياج والعطور الأصلية.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: settings } = useSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center text-3xl font-extrabold">من نحن</h1>
      <img
        src={hero}
        alt="إيهاب ستور للعناية والتجميل"
        loading="lazy"
        width={1600}
        height={1008}
        className="mt-8 w-full rounded-3xl object-cover shadow-lift"
      />
      <p className="mt-8 text-center text-sm leading-8 text-muted-foreground md:text-base">
        {settings?.about ??
          "إيهاب ستور متجر متخصص في منتجات العناية بالبشرة والشعر والمكياج والعطور. نختار لكِ منتجات أصلية من علامات موثوقة، ونحرص على تقديم تجربة تسوق بسيطة وسريعة عبر واتساب."}
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { icon: Gem, t: "جودة أصلية", d: "منتجات مضمونة من مصادر موثوقة" },
          { icon: HeartHandshake, t: "ثقة العميلات", d: "خدمة ودعم سريع في كل خطوة" },
          { icon: Sparkles, t: "اختيار مدروس", d: "تشكيلة منتقاة تناسب كل احتياج" },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft">
            <c.icon className="mx-auto h-7 w-7 text-primary" />
            <h2 className="mt-3 text-base font-bold">{c.t}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}