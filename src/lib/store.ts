import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CategoryKind = "standard" | "group" | "smart" | "brand";

export type SmartRule = {
  type?: "bestseller" | "featured" | "new" | "deals" | "price" | "top-rated";
  min?: number | null;
  max?: number | null;
  limit?: number | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  sort_order: number;
  parent_id: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  cover_image: string | null;
  is_active: boolean;
  kind: CategoryKind;
  smart_rule: SmartRule | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  images: string[];
  category_id: string | null;
  stock: number;
  status: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  created_at: string;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  logo: string | null;
  whatsapp_number: string;
  currency: string;
  currency_label: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  about: string | null;
  instagram: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export type StoreSettingsFull = StoreSettings & {
  seo_keywords: string | null;
  og_image: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image: string | null;
  about_content: string | null;
  contact_content: string | null;
  facebook: string | null;
  tiktok: string | null;
  snapchat: string | null;
  working_hours: string | null;
  store_image: string | null;
  description: string | null;
  twitter: string | null;
  youtube: string | null;
  hide_lovable_badge: boolean | null;
  grid_columns: number | null;
  card_style: string | null;
  brand_text_color: string | null;
};

export type Testimonial = {
  id: string;
  customer_name: string;
  content: string;
  rating: number;
};

export const BUCKET = "store-images";

export async function fetchSettings(): Promise<StoreSettingsFull | null> {
  const { data } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
  return (data as StoreSettingsFull | null) ?? null;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return (data as Category[] | null) ?? [];
}

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", true)
    .order("created_at", { ascending: false });
  return (data as Product[] | null) ?? [];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  return (data as Product | null) ?? null;
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false });
  return (data as Testimonial[] | null) ?? [];
}

export const settingsQuery = { queryKey: ["settings"], queryFn: fetchSettings, staleTime: 60_000 };
export const categoriesQuery = { queryKey: ["categories"], queryFn: fetchCategories, staleTime: 60_000 };
export const productsQuery = { queryKey: ["products"], queryFn: fetchProducts, staleTime: 30_000 };
export const testimonialsQuery = {
  queryKey: ["testimonials"],
  queryFn: fetchTestimonials,
  staleTime: 60_000,
};

export function useSettings() {
  return useQuery(settingsQuery);
}

export function useCategories() {
  return useQuery(categoriesQuery);
}

export function useProducts() {
  return useQuery(productsQuery);
}

/** Storage objects live in a private bucket, so browser display needs signed URLs. */
export function useSignedImages(paths: string[] | undefined) {
  const list = (paths ?? []).filter(Boolean);
  return useQuery({
    queryKey: ["signed-images", list.join("|")],
    enabled: list.length > 0,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const map = new Map<string, string>();
      const remote = list.filter((p) => !p.startsWith("http"));
      list.filter((p) => p.startsWith("http")).forEach((p) => map.set(p, p));
      if (remote.length > 0) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrls(remote, 60 * 60 * 24);
        data?.forEach((item) => {
          if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
        });
      }
      return list.map((p) => map.get(p)).filter((u): u is string => Boolean(u));
    },
  });
}

export function priceOf(product: Pick<Product, "price" | "discount_price">) {
  return product.discount_price != null && product.discount_price > 0
    ? Number(product.discount_price)
    : Number(product.price);
}

export function formatMoney(value: number, label = "ر.س") {
  const n = Number(value || 0);
  return `${n.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ${label}`;
}

export function slugify(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || `item-${Date.now()}`
  );
}

/** Returns the category id plus every descendant id (sub-categories). */
export function categoryTreeIds(categories: Category[], rootId: string): string[] {
  const ids = [rootId];
  const walk = (parent: string) => {
    categories
      .filter((c) => c.parent_id === parent)
      .forEach((c) => {
        ids.push(c.id);
        walk(c.id);
      });
  };
  walk(rootId);
  return ids;
}

export function rootCategories(categories: Category[]) {
  return categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
}

export function childrenOf(categories: Category[], parentId: string) {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Depth of a category inside the tree (0 = root). Supports unlimited nesting. */
export function depthOf(categories: Category[], c: Category) {
  let depth = 0;
  let parent = c.parent_id;
  while (parent && depth < 20) {
    depth += 1;
    parent = categories.find((x) => x.id === parent)?.parent_id ?? null;
  }
  return depth;
}

/** Prevents moving a category under one of its own descendants. */
export function descendantIds(categories: Category[], rootId: string) {
  return categoryTreeIds(categories, rootId);
}

export type ProductCategoryLink = { product_id: string; category_id: string };

export async function fetchProductLinks(): Promise<ProductCategoryLink[]> {
  const { data } = await supabase.from("product_categories").select("product_id,category_id");
  return (data as ProductCategoryLink[] | null) ?? [];
}

export const productLinksQuery = {
  queryKey: ["product-categories"],
  queryFn: fetchProductLinks,
  staleTime: 60_000,
};

export function useProductLinks() {
  return useQuery(productLinksQuery);
}

/** Products of a smart category, evaluated from its automatic rule. */
export function smartProducts(products: Product[], rule: SmartRule | null | undefined) {
  const type = rule?.type ?? "new";
  let list = [...products];
  if (type === "bestseller") list = list.filter((p) => p.is_bestseller);
  else if (type === "featured" || type === "top-rated") list = list.filter((p) => p.is_featured);
  else if (type === "deals")
    list = list.filter((p) => p.discount_price != null && Number(p.discount_price) > 0);
  else if (type === "price")
    list = list.filter((p) => {
      const v = priceOf(p);
      return (rule?.min == null || v >= rule.min) && (rule?.max == null || v <= rule.max);
    });
  else list = list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return rule?.limit ? list.slice(0, rule.limit) : list;
}

/** True when the product belongs to the category (direct, extra link, or smart rule). */
export function productMatchesCategory(
  product: Product,
  category: Category,
  categories: Category[],
  links: ProductCategoryLink[],
) {
  if (category.kind === "smart") return smartProducts([product], category.smart_rule).length > 0;
  const ids = categoryTreeIds(categories, category.id);
  if (product.category_id && ids.includes(product.category_id)) return true;
  return links.some((l) => l.product_id === product.id && ids.includes(l.category_id));
}