-- 1) Categories reset
DELETE FROM public.categories;

INSERT INTO public.categories (name, slug, sort_order, description) VALUES
  ('العناية بالبشرة','skincare',1,'سيرومات وكريمات وواقيات شمس ومرطبات وغسولات'),
  ('العطور','perfumes',2,'عطور رجالية ونسائية وبكجات هدايا وبخور'),
  ('المكياج','makeup',3,'رواج وفاونديشن وبكسات'),
  ('العناية بالشعر','haircare',4,'سيرومات وشامبو وماسك وبلسم ومجموعات'),
  ('الأجهزة الإلكترونية','devices',5,'استشوارات ومملسات وأجهزة ليزر وكاويات');

INSERT INTO public.categories (name, slug, sort_order, parent_id)
SELECT s.name, s.slug, s.ord, c.id
FROM (VALUES
  ('سيرومات','skincare-serums',1,'skincare'),
  ('كريمات','skincare-creams',2,'skincare'),
  ('واقيات شمس','skincare-sunscreen',3,'skincare'),
  ('مرطبات','skincare-moisturizers',4,'skincare'),
  ('غسولات','skincare-cleansers',5,'skincare'),
  ('رجالي','perfumes-men',1,'perfumes'),
  ('نسائي','perfumes-women',2,'perfumes'),
  ('بكجات هدايا','perfumes-gift-sets',3,'perfumes'),
  ('بخور','perfumes-bakhoor',4,'perfumes'),
  ('رواج','makeup-blush',1,'makeup'),
  ('فاونديشن','makeup-foundation',2,'makeup'),
  ('بكسات','makeup-palettes',3,'makeup'),
  ('سيرومات','haircare-serums',1,'haircare'),
  ('شامبو','haircare-shampoo',2,'haircare'),
  ('ماسك','haircare-mask',3,'haircare'),
  ('بلسم','haircare-conditioner',4,'haircare'),
  ('مجموعات','haircare-sets',5,'haircare'),
  ('استشوارات','devices-dryers',1,'devices'),
  ('مملسات','devices-straighteners',2,'devices'),
  ('أجهزة ليزر','devices-laser',3,'devices'),
  ('كاويات','devices-curlers',4,'devices')
) AS s(name, slug, ord, parent_slug)
JOIN public.categories c ON c.slug = s.parent_slug AND c.parent_id IS NULL;

-- 2) Payment methods
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  account_details text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active payment methods" ON public.payment_methods
  FOR SELECT USING (is_active = true);
CREATE POLICY "admin manage payment methods" ON public.payment_methods
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.payment_methods (name, sort_order) VALUES
  ('بنك كريمي',1),('أم فلوس',2),('جيب',3),('جوالي',4),('فلوسك',5),('العمقي',6),('حوالة',7);

-- 3) Order payment info
ALTER TABLE public.orders
  ADD COLUMN payment_method text,
  ADD COLUMN receipt_url text;
