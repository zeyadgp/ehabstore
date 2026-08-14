import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CornerDownLeft, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SmartImage } from "@/components/SmartImage";
import { uploadImage, useAdminCategories } from "@/lib/admin";
import { fallbackFor } from "@/lib/images";
import { childrenOf, rootCategories, slugify, type Category } from "@/lib/store";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories = [] } = useAdminCategories();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [subFor, setSubFor] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editParent, setEditParent] = useState("");
  const [editOrder, setEditOrder] = useState("0");
  const [editDesc, setEditDesc] = useState("");

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    await qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const create = async (value: string, parent: string | null) => {
    if (!value.trim()) { toast.error("اسم التصنيف مطلوب"); return false; }
    setBusy(true);
    const { error } = await supabase.from("categories").insert({
      name: value.trim(),
      slug: slugify(value),
      sort_order: categories.length,
      parent_id: parent,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return false; }
    toast.success("تمت الإضافة");
    await refresh();
    return true;
  };

  const update = async (c: Category, patch: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) { toast.error(error.message); return false; }
    await refresh();
    return true;
  };

  const remove = async (c: Category) => {
    if (childrenOf(categories, c.id).length > 0) { toast.error("احذفي التصنيفات الفرعية أولاً"); return; }
    if (!confirm(`حذف التصنيف "${c.name}"؟`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
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

  const openEdit = (c: Category) => {
    setEditing(c);
    setEditName(c.name);
    setEditParent(c.parent_id ?? "");
    setEditOrder(String(c.sort_order));
    setEditDesc(c.description ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editName.trim()) { toast.error("اسم التصنيف مطلوب"); return; }
    const ok = await update(editing, {
      name: editName.trim(),
      slug: slugify(editName),
      parent_id: editParent || null,
      sort_order: Number(editOrder || 0),
      description: editDesc.trim() || null,
    });
    if (ok) { toast.success("تم التعديل"); setEditing(null); }
  };

  const roots = rootCategories(categories);

  const Actions = ({ c }: { c: Category }) => (
    <div className="flex items-center gap-1">
      <button onClick={() => openEdit(c)} title="تعديل" aria-label="تعديل" className="rounded-lg bg-secondary p-2 text-primary">
        <Pencil className="h-4 w-4" />
      </button>
      <button onClick={() => remove(c)} title="حذف" aria-label="حذف" className="rounded-lg bg-destructive/10 p-2 text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
      <label title="تغيير الصورة" className="cursor-pointer rounded-lg bg-secondary p-2 text-foreground">
        <ImagePlus className="h-4 w-4" />
        <input type="file" accept="image/*" className="hidden" onChange={(e) => changeImage(c, e.target.files?.[0])} />
      </label>
    </div>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">التصنيفات</h1>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم تصنيف رئيسي جديد"
          className="min-w-40 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={async () => { if (await create(name, null)) setName(""); }}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> إضافة تصنيف رئيسي
        </button>
      </div>

      <div className="space-y-3">
        {roots.map((c) => {
          const kids = childrenOf(categories, c.id);
          return (
            <div key={c.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-3">
                <SmartImage
                  paths={c.image ? [c.image] : []}
                  fallback={fallbackFor(c.slug)}
                  alt={c.name}
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {kids.length > 0 ? `${kids.length} تصنيف فرعي` : "لا توجد تصنيفات فرعية"}
                  </p>
                </div>
                <Actions c={c} />
              </div>

              {kids.length > 0 && (
                <div className="mt-3 space-y-2 border-s-2 border-secondary ps-4">
                  {kids.map((k) => (
                    <div key={k.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/40 p-3">
                      <CornerDownLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <SmartImage
                        paths={k.image ? [k.image] : []}
                        fallback={fallbackFor(k.slug)}
                        alt={k.name}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                      <p className="min-w-0 flex-1 truncate text-xs font-bold">{k.name}</p>
                      <Actions c={k} />
                    </div>
                  ))}
                </div>
              )}

              {subFor === c.id ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    autoFocus
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder={`تصنيف فرعي تحت: ${c.name}`}
                    className="min-w-40 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={async () => { if (await create(subName, c.id)) { setSubName(""); setSubFor(null); } }}
                    disabled={busy}
                    className="rounded-xl gradient-gold px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
                  >
                    حفظ
                  </button>
                  <button onClick={() => { setSubFor(null); setSubName(""); }} className="rounded-xl border border-border px-4 py-2 text-xs font-bold">
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setSubFor(c.id); setSubName(""); }}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-[11px] font-bold text-primary hover:border-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> إضافة تصنيف فرعي
                </button>
              )}
            </div>
          );
        })}
        {roots.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            لا توجد تصنيفات بعد — أضيفي أول تصنيف رئيسي من الأعلى.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">تعديل التصنيف</h2>
              <button onClick={() => setEditing(null)} aria-label="إغلاق" className="rounded-lg p-1 text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold">الاسم</span>
                <input className={`mt-1 ${inputCls}`} value={editName} onChange={(e) => setEditName(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-bold">يتبع لـ</span>
                <select className={`mt-1 ${inputCls}`} value={editParent} onChange={(e) => setEditParent(e.target.value)}>
                  <option value="">تصنيف رئيسي</option>
                  {roots.filter((r) => r.id !== editing.id).map((r) => (
                    <option key={r.id} value={r.id}>تحت: {r.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold">الوصف</span>
                <textarea rows={3} className={`mt-1 ${inputCls}`} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-bold">الترتيب</span>
                <input type="number" className={`mt-1 ${inputCls}`} value={editOrder} onChange={(e) => setEditOrder(e.target.value)} />
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveEdit} className="flex-1 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground">حفظ</button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-6 text-sm font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
