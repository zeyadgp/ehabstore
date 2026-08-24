import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Award, Copy, Gift, Sparkles, Ticket } from "lucide-react";
import { toast } from "sonner";
import { getLoyaltyOverview, redeemReward, type LoyaltyOverview } from "@/lib/loyalty.functions";
import { LOYALTY_STORAGE_KEY, rewardLabel, useLoyaltyRewards, useLoyaltySettings } from "@/lib/loyalty";
import { normalizeYemeniPhone } from "@/lib/yemen";

const title = "برنامج الولاء | إيهاب ستور";
const description =
  "اجمع نقاط الولاء مع كل طلب من إيهاب ستور واستبدلها بكوبونات خصم — تحقق من رصيد نقاطك برقم جوالك.";

export const Route = createFileRoute("/loyalty")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://ehabstore.app/loyalty" }],
  }),
  component: LoyaltyPage,
});

const txLabel: Record<string, string> = {
  pending: "بانتظار التأكيد",
  earn: "نقاط مكتسبة",
  redeem: "استبدال نقاط",
  adjust: "تعديل إداري",
  coupon: "استخدام كوبون",
  cancelled: "ملغاة",
};

function LoyaltyPage() {
  const lookup = useServerFn(getLoyaltyOverview);
  const redeem = useServerFn(redeemReward);
  const { data: rewards = [] } = useLoyaltyRewards();
  const { data: settings } = useLoyaltySettings();
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<LoyaltyOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const currency = settings?.base_currency ?? "YER";

  const load = async (value: string) => {
    const normalized = normalizeYemeniPhone(value);
    if (normalized.length < 9) {
      toast.error("أدخل رقم جوال صحيح");
      return;
    }
    setLoading(true);
    try {
      const res = await lookup({ data: { phone: normalized } });
      setData(res);
      localStorage.setItem(LOYALTY_STORAGE_KEY, normalized);
      if (!res.found) toast.info("لا يوجد رصيد نقاط لهذا الرقم بعد — أول طلب يبدأ رصيدك");
    } catch {
      toast.error("تعذّر جلب الرصيد، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(LOYALTY_STORAGE_KEY);
    if (saved) {
      setPhone(saved);
      void load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points = data?.points ?? 0;
  const nextReward =
    rewards.find((r) => r.points_required > points) ?? rewards[rewards.length - 1] ?? null;
  const progress = nextReward
    ? Math.min(100, Math.round((points / Math.max(1, nextReward.points_required)) * 100))
    : 0;

  const doRedeem = async (rewardId: string) => {
    if (!data?.phone) return;
    try {
      const res = await redeem({ data: { phone: data.phone, rewardId } });
      toast.success(`تم إنشاء كوبونك: ${res.code}`);
      await load(data.phone);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الاستبدال");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl gradient-gold p-6 text-primary-foreground shadow-soft">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4" /> برنامج ولاء إيهاب ستور
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">اجمع نقاطك واستبدلها بخصومات</h1>
        <p className="mt-2 text-xs opacity-90">
          كل {Number(settings?.amount_per_point ?? 1000).toLocaleString("en-US")} {currency} من
          مشترياتك = نقطة واحدة. النقاط تُعتمد بعد استلام الطلب.
        </p>
      </div>

      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <label className="mb-1.5 block text-sm font-bold">رقم جوالك (نفس رقم الطلبات)</label>
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            inputMode="tel"
            placeholder="770000000"
            maxLength={20}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => void load(phone)}
            disabled={loading}
            className="shrink-0 rounded-xl gradient-gold px-5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "..." : "عرض النقاط"}
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-5 text-center shadow-soft">
              <Award className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-2xl font-extrabold">{points}</p>
              <p className="text-xs text-muted-foreground">نقطة متاحة</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 text-center shadow-soft">
              <Gift className="mx-auto h-5 w-5 text-rose" />
              <p className="mt-2 text-2xl font-extrabold">{data.pendingPoints}</p>
              <p className="text-xs text-muted-foreground">نقاط بانتظار التأكيد</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 text-center shadow-soft">
              <Ticket className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-2xl font-extrabold">
                {data.coupons.filter((c) => c.status === "available").length}
              </p>
              <p className="text-xs text-muted-foreground">كوبون متاح</p>
            </div>
          </div>

          {nextReward && (
            <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>المكافأة القادمة: {nextReward.name}</span>
                <span className="text-primary">
                  {points}/{nextReward.points_required}
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-secondary">
                <div className="h-full gradient-gold transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {points >= nextReward.points_required
                  ? "مبروك! تقدر تستبدل مكافأتك الآن."
                  : `باقي ${nextReward.points_required - points} نقطة للوصول للمكافأة.`}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-bold">المكافآت المتاحة</h2>
            <ul className="mt-3 space-y-2">
              {rewards.map((r) => {
                const can = points >= r.points_required;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.description ?? rewardLabel(r, currency)} · {r.points_required} نقطة
                      </p>
                    </div>
                    <button
                      onClick={() => void doRedeem(r.id)}
                      disabled={!can}
                      className="rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40"
                    >
                      استبدال
                    </button>
                  </li>
                );
              })}
              {rewards.length === 0 && (
                <li className="py-4 text-center text-xs text-muted-foreground">لا توجد مكافآت حالياً</li>
              )}
            </ul>
          </div>

          {data.coupons.length > 0 && (
            <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <h2 className="text-base font-bold">كوبوناتي</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.coupons.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                    <span dir="ltr" className="font-extrabold text-primary">
                      {c.code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.discount_type === "percent"
                        ? `خصم ${c.discount_value}%`
                        : `خصم ${c.discount_value.toLocaleString("en-US")} ${currency}`}
                    </span>
                    <span className="ms-auto text-[11px] text-muted-foreground">
                      {c.status === "available" ? "متاح" : c.status === "used" ? "مستخدم" : "منتهي"}
                    </span>
                    {c.status === "available" && (
                      <button
                        onClick={() => {
                          void navigator.clipboard.writeText(c.code);
                          toast.success("تم نسخ الكوبون");
                        }}
                        className="rounded-lg border border-border p-2"
                        aria-label="نسخ الكوبون"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-bold">سجل النقاط</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {data.transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="font-bold">{txLabel[t.type] ?? t.type}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.description ?? (t.order_number ? `الطلب #${t.order_number}` : "")}
                    </span>
                  </span>
                  <span className={`font-extrabold ${t.points < 0 ? "text-destructive" : "text-primary"}`}>
                    {t.points > 0 ? `+${t.points}` : t.points}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("ar-EG")}
                  </span>
                </li>
              ))}
              {data.transactions.length === 0 && (
                <li className="py-4 text-center text-xs text-muted-foreground">لا يوجد سجل بعد</li>
              )}
            </ul>
          </div>
        </>
      )}

      <div className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/products" className="font-bold text-primary">
          تسوّق الآن واكسب نقاطك
        </Link>
      </div>
    </div>
  );
}
