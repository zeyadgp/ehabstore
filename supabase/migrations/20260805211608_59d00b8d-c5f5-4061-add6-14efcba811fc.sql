-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  image text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "admin manage categories" ON public.categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  discount_price numeric(12,2),
  images text[] NOT NULL DEFAULT '{}',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  stock int NOT NULL DEFAULT 0,
  status boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_bestseller boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT USING (status = true);
CREATE POLICY "admin manage products" ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_products_category ON public.products(category_id);

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('new','processing','shipped','completed','cancelled');
CREATE SEQUENCE public.order_number_seq START 1001;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number int NOT NULL DEFAULT nextval('public.order_number_seq'),
  customer_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  notes text,
  total numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SAR',
  status public.order_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE ON SEQUENCE public.order_number_seq TO anon, authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can create order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read order items" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage order items" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- TESTIMONIALS
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  content text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read testimonials" ON public.testimonials FOR SELECT USING (is_visible = true);
CREATE POLICY "admin manage testimonials" ON public.testimonials FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SETTINGS
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'إيهاب ستور للعناية والتجميل',
  logo text,
  whatsapp_number text NOT NULL DEFAULT '967780187409',
  currency text NOT NULL DEFAULT 'SAR',
  currency_label text NOT NULL DEFAULT 'ر.س',
  email text,
  phone text,
  address text,
  about text,
  instagram text,
  seo_title text,
  seo_description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "admin update settings" ON public.store_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.store_settings (store_name, whatsapp_number, currency, currency_label, about, seo_title, seo_description, phone)
VALUES ('إيهاب ستور للعناية والتجميل','967780187409','SAR','ر.س',
'متجر متخصص في منتجات العناية بالبشرة والشعر والمكياج والعطور، نختار لكِ الأفضل عالمياً بجودة أصلية مضمونة وتوصيل سريع.',
'إيهاب ستور للعناية والتجميل | منتجات أصلية للبشرة والشعر والمكياج',
'تسوقي أرقى منتجات العناية بالبشرة والشعر والمكياج والعطور من إيهاب ستور. منتجات أصلية 100% وأسعار منافسة وتوصيل سريع.',
'+967780187409');

INSERT INTO public.categories (name, slug, sort_order) VALUES
 ('العناية بالبشرة','skincare',1),
 ('العناية بالشعر','haircare',2),
 ('المكياج','makeup',3),
 ('العطور','perfumes',4),
 ('منتجات الجسم','bodycare',5),
 ('العروض','offers',6);

INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'سيروم فيتامين سي المضيء','vitamin-c-serum','سيروم مركز بفيتامين سي النقي 20% يوحّد لون البشرة ويمنحها إشراقة فورية ويقلل من آثار التصبغات.',180,139,c.id,25,true,true,'{}'
FROM public.categories c WHERE c.slug='skincare';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'كريم ترطيب بحمض الهيالورونيك','hyaluronic-cream','كريم غني بحمض الهيالورونيك يرطب البشرة لمدة 48 ساعة ويمنحها نعومة ومظهراً ممتلئاً.',145,NULL,c.id,40,true,false,'{}'
FROM public.categories c WHERE c.slug='skincare';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'زيت الأرغان المغربي الأصلي','argan-oil','زيت أرغان نقي 100% يغذي الشعر ويعالج التقصف ويمنح لمعاناً طبيعياً بدون دهون.',120,95,c.id,30,true,true,'{}'
FROM public.categories c WHERE c.slug='haircare';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'ماسك الكيراتين المكثف','keratin-mask','ماسك كيراتين يعيد بناء الشعر التالف من أول استخدام ويمنحه ملمساً حريرياً.',165,NULL,c.id,18,false,true,'{}'
FROM public.categories c WHERE c.slug='haircare';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'أحمر شفاه مخملي طويل الثبات','velvet-lipstick','أحمر شفاه بتركيبة مخملية خفيفة تدوم حتى 12 ساعة بألوان راقية ولمسة نهائية مطفية.',95,75,c.id,50,true,true,'{}'
FROM public.categories c WHERE c.slug='makeup';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'كريم أساس عالي التغطية','hd-foundation','كريم أساس بتغطية كاملة وثبات يدوم طوال اليوم مع حماية من الشمس SPF 25.',210,NULL,c.id,22,false,false,'{}'
FROM public.categories c WHERE c.slug='makeup';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'عطر الورد الدمشقي الفاخر','damask-rose-perfume','عطر نسائي فاخر بنفحات الورد الدمشقي والعنبر والمسك الأبيض، ثبات يتجاوز 10 ساعات.',320,259,c.id,15,true,true,'{}'
FROM public.categories c WHERE c.slug='perfumes';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'عطر العود الملكي','royal-oud-perfume','مزيج شرقي فاخر من العود والزعفران وخشب الصندل يناسب المناسبات المسائية.',450,NULL,c.id,10,false,false,'{}'
FROM public.categories c WHERE c.slug='perfumes';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'مقشر الجسم بالسكر والورد','rose-body-scrub','مقشر لطيف بحبيبات السكر الطبيعية وزيت الورد يزيل الجلد الميت ويترك البشرة ناعمة ومعطرة.',110,89,c.id,35,true,false,'{}'
FROM public.categories c WHERE c.slug='bodycare';
INSERT INTO public.products (name, slug, description, price, discount_price, category_id, stock, is_featured, is_bestseller, images)
SELECT 'لوشن الجسم المرطب بالشيا','shea-body-lotion','لوشن غني بزبدة الشيا يمنح ترطيباً عميقاً يدوم 24 ساعة برائحة فانيليا هادئة.',85,NULL,c.id,60,false,true,'{}'
FROM public.categories c WHERE c.slug='bodycare';

INSERT INTO public.testimonials (customer_name, content, rating) VALUES
 ('نورة العتيبي','منتجات أصلية والتوصيل كان أسرع مما توقعت. سيروم فيتامين سي غيّر بشرتي خلال أسبوعين.',5),
 ('أم عبدالله','التعامل راقي جداً والرد على الواتساب سريع. طلبت العطر ووصلني بتغليف فخم.',5),
 ('سارة محمد','أسعارهم منافسة مقارنة بالمحلات، وزيت الأرغان ممتاز لشعري.',5),
 ('ريم الحربي','ثاني طلب لي من المتجر، الجودة ثابتة والخدمة ممتازة.',4);