import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ShieldMinus } from "lucide-react";
import { toast } from "sonner";
import { listAdminUsers, setUserAdmin } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const qc = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const changeRole = useServerFn(setUserAdmin);
  const [email, setEmail] = useState("");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => fetchUsers(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { email: string; makeAdmin: boolean }) => changeRole({ data: vars }),
    onSuccess: async () => {
      toast.success("تم تحديث الصلاحيات");
      setEmail("");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذر التحديث"),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">المستخدمون والصلاحيات</h1>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <input
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => mutation.mutate({ email, makeAdmin: true })}
          disabled={mutation.isPending || !email}
          className="rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          منح صلاحية مدير
        </button>
      </div>

      {error && (
        <p className="rounded-2xl bg-destructive/10 p-4 text-xs text-destructive">
          تعذر تحميل المستخدمين: {error instanceof Error ? error.message : "خطأ"}
        </p>
      )}

      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-soft">
        <table className="w-full min-w-[560px] text-right text-sm">
          <thead className="bg-secondary/60 text-xs">
            <tr>
              <th className="p-3">البريد</th>
              <th className="p-3">الصلاحية</th>
              <th className="p-3">آخر دخول</th>
              <th className="p-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <tr key={u.id}>
                  <td className="p-3 text-xs font-bold" dir="ltr">{u.email}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${isAdmin ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {isAdmin ? "مدير" : "مستخدم"}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-muted-foreground">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("ar-EG") : "—"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => mutation.mutate({ email: u.email, makeAdmin: !isAdmin })}
                      disabled={mutation.isPending}
                      className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-[11px] font-bold disabled:opacity-60"
                    >
                      {isAdmin ? <ShieldMinus className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      {isAdmin ? "إزالة الصلاحية" : "ترقية لمدير"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {isLoading && (
              <tr><td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">جاري التحميل…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
