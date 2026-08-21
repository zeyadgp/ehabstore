import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { YEMEN_GOVERNORATES } from "@/lib/yemen";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  governorate: string | null;
  district: string | null;
  address: string | null;
};

const input =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

/** حساب العميل: تسجيل، دخول، استعادة كلمة المرور، وبيانات الملف الشخصي. */
export function CustomerAccount() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return (data as unknown as Profile) ?? null;
    },
  });

  const [form, setForm] = useState<Omit<Profile, "id">>({
    full_name: "",
    phone: "",
    governorate: "",
    district: "",
    address: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        governorate: profile.governorate ?? "",
        district: profile.district ?? "",
        address: profile.address ?? "",
      });
    }
  }, [profile]);

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("تم تسجيل الدخول");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/account" },
        });
        if (error) throw error;
        toast.success("تم إنشاء حسابك");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: userId, ...form } as never);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم حفظ بياناتك");
    await qc.invalidateQueries({ queryKey: ["profile", userId] });
  };

  if (!userId) {
    return (
      <section className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <p className="flex items-center gap-2 text-sm font-bold">
          <UserRound className="h-4 w-4 text-primary" /> حساب العميل
        </p>
        <form onSubmit={submitAuth} className="mt-3 space-y-3">
          <label className="block text-xs font-bold">
            البريد الإلكتروني
            <input dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </label>
          {mode !== "reset" && (
            <label className="block text-xs font-bold">
              كلمة المرور
              <input dir="ltr" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </label>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {mode === "login" ? "دخول" : mode === "signup" ? "إنشاء حساب" : "إرسال رابط الاستعادة"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-primary">
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "إنشاء حساب جديد" : "لديك حساب؟ دخول"}
          </button>
          <button onClick={() => setMode("reset")}>نسيت كلمة المرور؟</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <p className="flex items-center gap-2 text-sm font-bold">
        <UserRound className="h-4 w-4 text-primary" /> ملفي الشخصي
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold">
          الاسم الكامل
          <input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={input} />
        </label>
        <label className="block text-xs font-bold">
          رقم الجوال
          <input dir="ltr" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
        </label>
        <label className="block text-xs font-bold">
          المحافظة
          <select value={form.governorate ?? ""} onChange={(e) => setForm({ ...form, governorate: e.target.value })} className={input}>
            <option value="">اختر المحافظة</option>
            {YEMEN_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold">
          المديرية / المنطقة
          <input value={form.district ?? ""} onChange={(e) => setForm({ ...form, district: e.target.value })} className={input} />
        </label>
        <label className="block text-xs font-bold sm:col-span-2">
          العنوان (الحي، الشارع، أقرب معلم)
          <input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} />
        </label>
      </div>
      <button
        onClick={() => void saveProfile()}
        disabled={busy}
        className="mt-3 flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> حفظ البيانات
      </button>
    </section>
  );
}
