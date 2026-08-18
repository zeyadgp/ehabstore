ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS district text;

CREATE TABLE public.loyalty_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  base_currency text NOT NULL DEFAULT 'YER',
  amount_per_point numeric NOT NULL DEFAULT 1000,
  min_redeem_points integer NOT NULL DEFAULT 100,
  point_value numeric NOT NULL DEFAULT 10,
  coupon_expiry_days integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_settings TO anon, authenticated;
GRANT ALL ON public.loyalty_settings TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.loyalty_settings TO authenticated;
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read loyalty settings" ON public.loyalty_settings FOR SELECT USING (true);
CREATE POLICY "admin manage loyalty settings" ON public.loyalty_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_loyalty_settings_updated BEFORE UPDATE ON public.loyalty_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  customer_name text,
  points integer NOT NULL DEFAULT 0,
  pending_points integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_accounts TO authenticated;
GRANT ALL ON public.loyalty_accounts TO service_role;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage loyalty accounts" ON public.loyalty_accounts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_loyalty_accounts_updated BEFORE UPDATE ON public.loyalty_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'earn',
  points integer NOT NULL DEFAULT 0,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number integer,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_loyalty_tx_account ON public.loyalty_transactions(account_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage loyalty transactions" ON public.loyalty_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_required integer NOT NULL DEFAULT 100,
  discount_type text NOT NULL DEFAULT 'amount',
  discount_value numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_rewards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_rewards TO authenticated;
GRANT ALL ON public.loyalty_rewards TO service_role;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active rewards" ON public.loyalty_rewards FOR SELECT USING (is_active = true);
CREATE POLICY "admin manage rewards" ON public.loyalty_rewards FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_loyalty_rewards_updated BEFORE UPDATE ON public.loyalty_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.loyalty_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  account_id uuid NOT NULL REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  discount_type text NOT NULL DEFAULT 'amount',
  discount_value numeric NOT NULL DEFAULT 0,
  points_spent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  expires_at timestamptz,
  used_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_coupons TO authenticated;
GRANT ALL ON public.loyalty_coupons TO service_role;
ALTER TABLE public.loyalty_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage coupons" ON public.loyalty_coupons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_loyalty_coupons_updated BEFORE UPDATE ON public.loyalty_coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.loyalty_settings (is_active, base_currency, amount_per_point, min_redeem_points, point_value, coupon_expiry_days)
VALUES (true, 'YER', 1000, 100, 10, 60);

INSERT INTO public.loyalty_rewards (name, description, points_required, discount_type, discount_value, sort_order) VALUES
('خصم 1000 ريال', 'استبدل 100 نقطة بخصم 1000 ريال يمني على طلبك القادم', 100, 'amount', 1000, 1),
('خصم 2500 ريال', 'استبدل 200 نقطة بخصم 2500 ريال يمني', 200, 'amount', 2500, 2),
('خصم 10%', 'استبدل 300 نقطة بخصم 10% على إجمالي الطلب', 300, 'percent', 10, 3);