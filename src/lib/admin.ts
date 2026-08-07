import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET, type Category, type Product, type StoreSettingsFull } from "@/lib/store";

export type OrderStatus =
  | "new"
  | "reviewing"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export const statusLabels: Record<OrderStatus, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  processing: "جاري التجهيز",
  shipped: "تم الشحن",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const statusOrder: OrderStatus[] = [
  "new",
  "reviewing",
  "processing",
  "shipped",
  "completed",
  "cancelled",
];

export const statusColor: Record<OrderStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  reviewing: "bg-amber-100 text-amber-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  notes: string | null;
  total: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
};

export type AdminTestimonial = {
  id: string;
  customer_name: string;
  content: string;
  rating: number;
  is_visible: boolean;
  created_at: string;
};

/** All products including hidden ones (admin only, enforced by RLS). */
export function useAllProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Product[]) ?? [];
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return (data as unknown as Category[]) ?? [];
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Order[]) ?? [];
    },
  });
}

export function useOrderItems() {
  return useQuery({
    queryKey: ["admin", "order-items"],
    queryFn: async (): Promise<OrderItem[]> => {
      const { data, error } = await supabase.from("order_items").select("*");
      if (error) throw error;
      return (data as unknown as OrderItem[]) ?? [];
    },
  });
}

export function useAdminTestimonials() {
  return useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async (): Promise<AdminTestimonial[]> => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as AdminTestimonial[]) ?? [];
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async (): Promise<StoreSettingsFull | null> => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as StoreSettingsFull | null) ?? null;
    },
  });
}

function extOf(name: string) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name);
  return m?.[1]?.toLowerCase() ?? "jpg";
}

/** Uploads to the private bucket and returns the storage path stored in the DB. */
export async function uploadImage(file: File, folder = "products"): Promise<string> {
  const path = `${folder}/${crypto.randomUUID()}.${extOf(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function removeImage(path: string) {
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
