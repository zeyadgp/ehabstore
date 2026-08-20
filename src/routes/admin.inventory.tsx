import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAllProducts, useAdminCurrency } from "@/lib/admin";
import { formatMoney } from "@/lib/store";

export const Route = createFileRoute("/admin/inventory")({ component: AdminInventory });

function AdminInventory() {
  const qc = useQueryClient();
  const { data: products = [] } = useAllProducts();
  const { label } = useAdminCurrency();
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const setStock = async (id: string, stock: number) => {
    const { error } = await supabase.from("products").update({ stock }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["admin", "products"] });
    await qc.invalidateQueries({ queryKey: ["products"] });
  };

  const list = products
    .filter((p) => (lowOnly ? p.stock <= 3 : true))
    .filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : true));

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const outOf = products.filter((p) => p.stock === 0).length;
  const value = products.reduce(
    (s, p) => s + p.stock * Number(p.discount_price && p.discount_price > 0 ? p.discount_price : p.price),
    0,
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">المخزون</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Box label="إجمالي القطع" value={String(totalStock)} />
        <Box label="منتجات نفدت" value={String(outOf)} />
        <Box label="قيمة المخزون" value={formatMoney(value, label)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث باسم المنتج"
            className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => setLowOnly((v) => !v)}
          className={`rounded-xl px-4 py-2 text-xs font-bold ${lowOnly ? "gradient-gold text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}
        >
          المنخفض فقط
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <ul className="divide-y divide-border text-sm">
          {list.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1 truncate font-bold">{p.name}</span>
              {p.stock <= 3 && <AlertTriangle className="h-4 w-4 text-amber-600" />}
              <input
                type="number"
                defaultValue={String(p.stock)}
                onBlur={(e) => void setStock(p.id, Math.max(0, Number(e.target.value) || 0))}
                className="w-24 rounded-xl border border-border bg-background px-3 py-1.5 text-xs"
              />
              <span className="text-xs text-muted-foreground">
                {formatMoney(Number(p.discount_price && p.discount_price > 0 ? p.discount_price : p.price), label)}
              </span>
            </li>
          ))}
          {list.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">لا توجد نتائج</li>}
        </ul>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </div>
  );
}
