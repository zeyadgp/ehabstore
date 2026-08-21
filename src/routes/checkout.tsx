import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { useCurrency } from "@/lib/currency";
import { placeOrder } from "@/lib/orders.functions";
import { uploadReceipt } from "@/lib/receipt.functions";
import { usePaymentMethods } from "@/lib/payments";
import { SmartImage } from "@/components/SmartImage";
import { buildWhatsappMessage, whatsappLink } from "@/lib/whatsapp";
import { YEMEN_GOVERNORATES, deliveryNote, districtsFor } from "@/lib/yemen";
import { feeForCity, useDeliveryZones } from "@/lib/delivery";
import { checkCoupon, type CouponCheck } from "@/lib/coupons.functions";

const title = "إتمام الطلب | إيهاب ستور للعناية والتجميل";
const description = "أدخلي بياناتكِ لإتمام الطلب وإرساله مباشرة عبر واتساب.";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "اكتب اسمك الكامل").max(80),
  phone: z.string().trim().min(9, "رقم جوال يمني غير صحيح").max(20),
  city: z.string().trim().min(2, "اختر المحافظة").max(60),
  district: z.string().trim().max(60).optional(),
  address: z.string().trim().min(5, "اكتب العنوان بالتفصيل").max(200),
  notes: z.string().trim().max(400).optional(),
});

function CheckoutPage() {
  const { items, clear } = useCart();
  const { code, unitFor, symbol } = useCurrency();
  const fmt = (n: number) =>
    `${Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ${symbol}`;
  const subtotal = items.reduce((s, i) => s + unitFor(i.id, i.price) * i.quantity, 0);
  const navigate = useNavigate();
  const submitOrder = useServerFn(placeOrder);
  const sendReceipt = useServerFn(uploadReceipt);
  const { data: methods = [] } = usePaymentMethods();
  const [methodId, setMethodId] = useState<string>("");
  const [receipt, setReceipt] = useState<{ file: File; preview: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    notes: "",
  });
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState<CouponCheck | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const districts = districtsFor(form.city);
  const { data: zones = [] } = useDeliveryZones();
  const deliveryFee = form.city ? feeForCity(zones, form.city) : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">لا توجد منتجات في السلة</h1>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-xl gradient-gold px-7 py-3 text-sm font-bold text-primary-foreground"
        >
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[String(i.path[0])] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const method = methods.find((m) => m.id === methodId) ?? null;
      let receiptPath: string | null = null;
      if (receipt) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
          reader.readAsDataURL(receipt.file);
        });
        const res = await sendReceipt({ data: { dataUrl } });
        receiptPath = res.path;
      }
      const placed = await submitOrder({
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          city: parsed.data.city,
          district: parsed.data.district ?? null,
          address: parsed.data.address,
          notes: parsed.data.notes ?? null,
          currency: code,
          paymentMethod: method?.name ?? null,
          receiptUrl: receiptPath,
          couponCode: coupon.trim() ? coupon.trim().toUpperCase() : null,
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        },
      });

      const message = buildWhatsappMessage({
        storeName: placed.storeName,
        orderNumber: placed.orderNumber,
        discount: placed.discount,
        couponCode: placed.couponCode,
        pointsEarned: placed.pointsEarned,
        deliveryNote: deliveryNote(parsed.data.city),
        info: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          city: parsed.data.city,
          district: parsed.data.district ?? "",
          address: parsed.data.address,
          notes: [
            parsed.data.notes ?? "",
            placed.paymentMethod ? `طريقة الدفع: ${placed.paymentMethod}` : "",
            receiptPath ? "تم إرفاق صورة الإشعار" : "",
          ]
            .filter(Boolean)
            .join(" — "),
        },
        items: placed.items.map((i, idx) => ({
          id: String(idx),
          slug: "",
          image: null,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total: placed.total,
        currencyLabel: placed.currencyLabel,
      });
      const link = whatsappLink(placed.whatsappNumber, message);
      const waWindow = window.open(link, "_blank", "noopener");
      clear();
      toast.success(
        placed.pointsEarned > 0
          ? `تم تسجيل طلبك وكسبت ${placed.pointsEarned} نقطة ولاء — سيتم تحويلك إلى واتساب`
          : "تم تسجيل طلبك، سيتم تحويلك إلى واتساب",
      );
      if (!waWindow) window.location.href = link;
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error("تعذّر إرسال الطلب، حاولي مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    name: keyof typeof form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-bold">{label}</label>
      <input
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
        {...props}
      />
      {errors[name] && <p className="mt-1 text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-extrabold md:text-3xl">إتمام الطلب</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        عبّي بياناتك وبنرسل تفاصيل طلبك مباشرة إلى واتساب المتجر — التوصيل داخل اليمن لكل المحافظات.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          {field("name", "الاسم الكامل", { placeholder: "مثال: أحمد صالح الحميري", maxLength: 80 })}
          {field("phone", "رقم الجوال (واتساب)", {
            placeholder: "مثال: 770000000",
            dir: "ltr",
            inputMode: "tel",
            maxLength: 20,
          })}

          <div>
            <label className="mb-1.5 block text-sm font-bold">المحافظة</label>
            <select
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, district: "" }))}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">اختر المحافظة…</option>
              {YEMEN_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors["city"] && <p className="mt-1 text-xs text-destructive">{errors["city"]}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold">المديرية / المنطقة (اختياري)</label>
            <input
              list="yemen-districts"
              value={form.district}
              onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              placeholder={districts[0] ? `مثال: ${districts[0]}` : "مثال: مديرية معين"}
              maxLength={60}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <datalist id="yemen-districts">
              {districts.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {field("address", "العنوان بالتفصيل", {
            placeholder: "مثال: صنعاء - شارع الزبيري - جولة المصباحي - بجانب صيدلية النور - منزل رقم 12",
            maxLength: 200,
          })}
          {form.city && (
            <p className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              {deliveryNote(form.city)}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-bold">كود خصم أو كوبون ولاء (اختياري)</label>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => {
                  setCoupon(e.target.value.toUpperCase());
                  setCouponState(null);
                }}
                placeholder="مثال: EH-A7K2M9"
                dir="ltr"
                maxLength={24}
                className="w-full rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={couponBusy || coupon.trim().length < 2}
                onClick={async () => {
                  setCouponBusy(true);
                  try {
                    const res = await checkCoupon({ data: { code: coupon.trim().toUpperCase() } });
                    setCouponState(res);
                  } catch {
                    setCouponState({ ok: false, message: "تعذّر التحقق من الكود" });
                  } finally {
                    setCouponBusy(false);
                  }
                }}
                className="shrink-0 rounded-xl bg-secondary px-4 text-xs font-bold text-foreground disabled:opacity-50"
              >
                {couponBusy ? "جارٍ…" : "تطبيق"}
              </button>
            </div>
            {couponState && (
              <p className={`mt-1 text-xs font-bold ${couponState.ok ? "text-primary" : "text-destructive"}`}>
                {couponState.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              اجمع نقاطك من كل طلب واستبدلها بكوبون خصم من{" "}
              <Link to="/loyalty" className="font-bold text-primary">
                برنامج الولاء
              </Link>
              .
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold">ملاحظات (اختياري)</label>
            <textarea
              value={form.notes}
              maxLength={400}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          {methods.length > 0 && (
            <div className="border-t border-border pt-4">
              <label className="mb-1.5 block text-sm font-bold">طريقة الدفع (اختياري)</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {methods.map((m) => {
                  const active = methodId === m.id;
                  const isImage = Boolean(m.icon && !/^\p{Extended_Pictographic}/u.test(m.icon));
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethodId(active ? "" : m.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs font-bold transition-colors ${
                        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-secondary"
                      }`}
                    >
                      {m.icon ? (
                        isImage ? (
                          <SmartImage
                            paths={[m.icon]}
                            fallback="/favicon.png"
                            alt={m.name}
                            className="h-7 w-7 shrink-0 rounded-lg object-contain"
                          />
                        ) : (
                          <span className="text-lg leading-none">{m.icon}</span>
                        )
                      ) : (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                          {m.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
              {methodId && (
                <div className="mt-3 space-y-1 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
                  {methods.find((m) => m.id === methodId)?.account_details && (
                    <p dir="auto" className="font-bold text-foreground">
                      {methods.find((m) => m.id === methodId)?.account_details}
                    </p>
                  )}
                  <p>{methods.find((m) => m.id === methodId)?.instructions ?? "حوّلي المبلغ ثم أرفقي صورة الإشعار."}</p>
                </div>
              )}

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-bold">صورة الإشعار / الحوالة (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return setReceipt(null);
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("حجم الصورة كبير جداً (الحد 5MB)");
                      return;
                    }
                    setReceipt({ file, preview: URL.createObjectURL(file) });
                  }}
                  className="w-full rounded-xl border border-dashed border-border bg-background px-4 py-3 text-xs"
                />
                {receipt && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={receipt.preview} alt="صورة الإشعار" className="h-20 w-20 rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-base font-bold">ملخص الطلب</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">
                  {i.name} × {i.quantity}
                </span>
                <span className="shrink-0">{fmt(unitFor(i.id, i.price) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>المجموع</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>التوصيل{form.city ? ` — ${form.city}` : ""}</span>
              <span>{deliveryFee > 0 ? fmt(deliveryFee) : "يُحدد حسب المحافظة"}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold">
            <span>الإجمالي</span>
            <span className="text-primary">{fmt(total)}</span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            {saving ? "جاري الإرسال..." : "تأكيد الطلب عبر واتساب"}
          </button>
        </aside>
      </form>
    </div>
  );
}