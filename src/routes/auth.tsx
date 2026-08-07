import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "@/assets/logo.png";

const title = "تسجيل الدخول | إيهاب ستور للعناية والتجميل";
const description = "تسجيل دخول مسؤولي متجر إيهاب ستور للوصول إلى لوحة التحكم وإدارة المنتجات والطلبات.";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { isAdmin, email: currentEmail } = useAdmin();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("تم تسجيل الدخول");
        void navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب، تحقق من بريدك لتأكيد الحساب إن لزم");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  };

  const claimAdmin = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      if (data) {
        toast.success("تم منحك صلاحية المدير");
        void navigate({ to: "/admin" });
      } else {
        toast.error("يوجد مدير للمتجر بالفعل");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تنفيذ العملية");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <img src={logo} alt="شعار المتجر" width={72} height={72} className="mx-auto h-18 w-18" />
      <h1 className="mt-4 text-center text-2xl font-extrabold">لوحة تحكم إيهاب ستور</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {mode === "login" ? "سجّلي الدخول للمتابعة" : "إنشاء حساب جديد"}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div>
          <label className="text-xs font-bold" htmlFor="email">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-bold" htmlFor="password">كلمة المرور</label>
          <input
            id="password"
            type="password"
            dir="ltr"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" /> {mode === "login" ? "دخول" : "إنشاء حساب"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-xs font-bold text-primary"
        >
          {mode === "login" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
        </button>
      </form>

      {currentEmail && !isAdmin && (
        <div className="mt-6 rounded-2xl border border-dashed border-primary/50 bg-secondary/40 p-5 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2 text-xs text-muted-foreground">
            أنتِ مسجلة الدخول باسم <span dir="ltr" className="font-bold">{currentEmail}</span> بدون صلاحية مدير.
            إذا كان هذا أول إعداد للمتجر يمكنك تفعيل حساب المدير الأول.
          </p>
          <button
            onClick={claimAdmin}
            disabled={busy}
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
          >
            تفعيل حساب المدير الأول
          </button>
        </div>
      )}
    </div>
  );
}
