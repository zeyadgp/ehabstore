CREATE TABLE public.currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  symbol text NOT NULL,
  rate numeric NOT NULL DEFAULT 1,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.currencies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.currencies TO authenticated;
GRANT ALL ON public.currencies TO service_role;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read currencies" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "admin manage currencies" ON public.currencies FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_currencies_updated BEFORE UPDATE ON public.currencies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  currency_code text NOT NULL REFERENCES public.currencies(code) ON UPDATE CASCADE ON DELETE CASCADE,
  price numeric,
  discount_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, currency_code)
);
GRANT SELECT ON public.product_prices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_prices TO authenticated;
GRANT ALL ON public.product_prices TO service_role;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product prices" ON public.product_prices FOR SELECT USING (true);
CREATE POLICY "admin manage product prices" ON public.product_prices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_product_prices_updated BEFORE UPDATE ON public.product_prices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency_label text NOT NULL DEFAULT 'ر.س',
  ADD COLUMN IF NOT EXISTS currency_rate numeric NOT NULL DEFAULT 1;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS store_image text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS youtube text;

INSERT INTO public.currencies (code, name, symbol, rate, is_default, is_active, sort_order) VALUES
  ('SAR', 'ريال سعودي', 'ر.س', 1, true, true, 1),
  ('YER_NEW', 'ريال يمني جديد', 'ر.ي جديد', 100, false, true, 2),
  ('YER_OLD', 'ريال يمني قديم', 'ر.ي قديم', 143, false, true, 3)
ON CONFLICT (code) DO NOTHING;