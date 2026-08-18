import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LoyaltyReward = {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  sort_order: number;
};

export type LoyaltySettingsRow = {
  id: string;
  is_active: boolean;
  base_currency: string;
  amount_per_point: number;
  min_redeem_points: number;
  point_value: number;
  coupon_expiry_days: number;
};

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: ["loyalty", "rewards"],
    queryFn: async (): Promise<LoyaltyReward[]> => {
      const { data } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("is_active", true)
        .order("points_required");
      return (data as LoyaltyReward[] | null) ?? [];
    },
    staleTime: 60_000,
  });
}

export function useLoyaltySettings() {
  return useQuery({
    queryKey: ["loyalty", "settings"],
    queryFn: async (): Promise<LoyaltySettingsRow | null> => {
      const { data } = await supabase.from("loyalty_settings").select("*").limit(1).maybeSingle();
      return (data as LoyaltySettingsRow | null) ?? null;
    },
    staleTime: 60_000,
  });
}

export const LOYALTY_STORAGE_KEY = "ehab-loyalty-phone";

export function rewardLabel(r: Pick<LoyaltyReward, "discount_type" | "discount_value">, currency: string) {
  return r.discount_type === "percent"
    ? `خصم ${Number(r.discount_value)}%`
    : `خصم ${Number(r.discount_value).toLocaleString("en-US")} ${currency}`;
}
