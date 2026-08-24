import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Review = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
};

export type ReviewStat = { avg: number; count: number };

export async function fetchReviewStats(): Promise<Record<string, ReviewStat>> {
  const { data } = await supabase.from("product_reviews").select("product_id,rating").eq("is_approved", true);
  const acc: Record<string, { sum: number; count: number }> = {};
  ((data as { product_id: string; rating: number }[] | null) ?? []).forEach((r) => {
    const cur = acc[r.product_id] ?? { sum: 0, count: 0 };
    cur.sum += Number(r.rating) || 0;
    cur.count += 1;
    acc[r.product_id] = cur;
  });
  const out: Record<string, ReviewStat> = {};
  Object.entries(acc).forEach(([id, v]) => {
    out[id] = { avg: v.count ? v.sum / v.count : 0, count: v.count };
  });
  return out;
}

export function useReviewStats() {
  return useQuery({ queryKey: ["review-stats"], queryFn: fetchReviewStats, staleTime: 60_000 });
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const { data } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });
  return (data as Review[] | null) ?? [];
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-reviews", productId],
    enabled: Boolean(productId),
    queryFn: () => fetchProductReviews(productId as string),
  });
}

export async function submitReview(input: {
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
}) {
  return supabase.from("product_reviews").insert({
    product_id: input.product_id,
    customer_name: input.customer_name.trim() || "زائر",
    rating: Math.min(5, Math.max(1, input.rating)),
    comment: input.comment.trim() || null,
    is_approved: false,
  });

}

export function useAdminReviews() {
  return useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as Review[] | null) ?? [];
    },
  });
}
