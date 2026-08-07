import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SmartImage } from "@/components/SmartImage";
import { uploadImage, useAdminCategories } from "@/lib/admin";
import { fallbackFor } from "@/lib/images";
import { slugify, type Category } from "@/lib/store";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories = [] } = useAdminCategories();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    await qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const add = async () => {
    if (!name.trim()) return toast.error("اسم التصنيف مطلوب");
    setBusy(true);
    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slugify(name),
      sort_order: categories.length,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setName("");
    toast.success("تمت الإضافة");
    await refresh();
  };

  const update = async (c: Category, patch: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const remove = async (c: Category) => {
    if (!confirm(`حذف التصنيف "${c.name}"؟`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    await refresh();
  };

  const changeImage = async (c: Category, file: File | undefined) => {
    if (!file) return;
    try {
      const path = await uploadImage(file, "categories");
      await update(c, { image: path });
      toast.success("تم تحديث الصورة");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر الرفع");
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">التصنيفات</h1>

      <div className="flex gap-2 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم تصنيف جديد"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={add} disabled={busy} className="flex items-center gap-2 rounded-xl gradient-gold px-4 text-xs font-bold text-primary-foreground disabled:opacity-60">
          <Plus className="h-4 w-4" /> إضافة
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <SmartImage
              paths={c.image ? [c.image] : []}
              fallback={fallbackFor(c.slug)}
              alt={c.name}
              className="h-32 w-full rounded-2xl object-cover"
            />
            <input
              value={c.name}
              onChange={(e) => update(c, { name: e.target.value })}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none focus:border-primary"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={c.sort_order}
                onChange={(e) => update(c, { sort_order: Number(e.target.value) })}
                className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-xs"
                aria-label="ترتيب"
              />
              <input type="file" accept="image/*" onChange={(e) => changeImage(c, e.target.files?.[0])} className="flex-1 text-[11px]" />
              <button onClick={() => remove(c)} className="rounded-lg bg-destructive/10 p-2 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
