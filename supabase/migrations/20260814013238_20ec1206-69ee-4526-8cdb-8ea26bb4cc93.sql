CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  subtitle text,
  badge text,
  image text,
  cta_label text,
  cta_url text,
  placement text NOT NULL DEFAULT 'hero',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active banners"
  ON public.banners FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin manage banners"
  ON public.banners FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER banners_set_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS brand_text_color text NOT NULL DEFAULT 'black';

INSERT INTO public.banners (title, subtitle, badge, cta_label, cta_url, placement, sort_order, is_active) VALUES
  ('عروض العناية الفاخرة', 'خصومات تصل إلى 40% على منتجات البشرة والشعر المختارة بعناية.', 'عرض محدود', 'تسوّقي العرض', '/products', 'hero', 0, true),
  ('توصيل سريع لكل المدن', 'اطلبي اليوم عبر واتساب واستلمي طلبك خلال أيام قليلة.', 'خدمة مميزة', 'ابدئي التسوق', '/products', 'strip', 1, true);