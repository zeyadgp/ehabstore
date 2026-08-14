-- 1) Themes
CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  primary_color text NOT NULL DEFAULT '#C9A227',
  accent_color text NOT NULL DEFAULT '#E8B4B8',
  background_color text NOT NULL DEFAULT '#FFFDF8',
  foreground_color text NOT NULL DEFAULT '#2B2320',
  card_color text NOT NULL DEFAULT '#FFFFFF',
  radius text NOT NULL DEFAULT '0.75rem',
  nav_position text NOT NULL DEFAULT 'bottom',
  nav_style text NOT NULL DEFAULT 'pill',
  show_labels boolean NOT NULL DEFAULT true,
  nav_items jsonb NOT NULL DEFAULT '["home","search","categories","cart","account"]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.themes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.themes TO authenticated;
GRANT ALL ON public.themes TO service_role;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read themes" ON public.themes FOR SELECT USING (true);
CREATE POLICY "admin manage themes" ON public.themes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER themes_updated_at BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.themes (name, is_default, primary_color, accent_color, background_color, foreground_color, card_color, nav_position, nav_style, nav_items, sort_order) VALUES
('ذهبي كلاسيكي', true,  '#C9A227', '#E8B4B8', '#FFFDF8', '#2B2320', '#FFFFFF', 'bottom',   'pill',  '["home","search","categories","cart","account"]', 0),
('وردي عصري',    false, '#D96C86', '#F3C9D3', '#FFF9FA', '#2A1F23', '#FFFFFF', 'floating', 'round', '["home","categories","search","favorites","cart"]', 1),
('ليلي فاخر',    false, '#D4AF37', '#8E7CC3', '#14110F', '#F5EFE6', '#1D1917', 'bottom',   'flat',  '["home","search","categories","cart","account"]', 2);

-- 2) Category description
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text;

-- 3) Store settings row (was missing -> saving silently did nothing)
INSERT INTO public.store_settings (store_name, whatsapp_number, currency, currency_label, hero_title, hero_subtitle, about, description, phone, address, working_hours, seo_title, seo_description)
SELECT 'إيهاب ستور للعناية والتجميل', '967780187409', 'YER', 'ريال',
       'جمالك يبدأ من هنا', 'منتجات أصلية للعناية بالبشرة والشعر والمكياج والعطور',
       'متجر متخصص في منتجات العناية والتجميل الأصلية مع توصيل سريع لكل المحافظات.',
       'متجر إيهاب للعناية والتجميل — منتجات أصلية بأسعار منافسة.',
       '780187409', 'اليمن - صنعاء', 'يومياً من 9 صباحاً حتى 10 مساءً',
       'إيهاب ستور للعناية والتجميل', 'تسوقي منتجات العناية بالبشرة والشعر والمكياج والعطور الأصلية.'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- 4) Currencies
INSERT INTO public.currencies (code, name, symbol, rate, is_default, is_active, sort_order) VALUES
('YER', 'الريال اليمني', 'ريال', 1, true, true, 0),
('SAR', 'الريال السعودي', 'ر.س', 0.0157, false, true, 1)
ON CONFLICT DO NOTHING;

-- 5) Categories + sub-sections
INSERT INTO public.categories (id, name, slug, description, sort_order, parent_id) VALUES
('11111111-1111-4111-8111-000000000001','العناية بالبشرة','skin-care','كل ما تحتاجينه لبشرة صحية ونضرة',0,NULL),
('11111111-1111-4111-8111-000000000002','العطور','perfumes','عطور أصلية لكل الأذواق',1,NULL),
('11111111-1111-4111-8111-000000000003','العناية بالشعر','hair-care','منتجات تغذية وترطيب الشعر',2,NULL),
('11111111-1111-4111-8111-000000000004','المكياج','makeup','مستحضرات تجميل بجودة عالية',3,NULL),
('22222222-2222-4222-8222-000000000001','وجه','face','منظفات وكريمات الوجه',0,'11111111-1111-4111-8111-000000000001'),
('22222222-2222-4222-8222-000000000002','واقيات شمس','sunscreen','حماية يومية من الأشعة',1,'11111111-1111-4111-8111-000000000001'),
('22222222-2222-4222-8222-000000000003','مجموعات العناية بالبشرة','skin-sets','مجموعات متكاملة بسعر مميز',2,'11111111-1111-4111-8111-000000000001'),
('22222222-2222-4222-8222-000000000004','نسائي','perfume-women','عطور نسائية',0,'11111111-1111-4111-8111-000000000002'),
('22222222-2222-4222-8222-000000000005','رجالي','perfume-men','عطور رجالية',1,'11111111-1111-4111-8111-000000000002'),
('22222222-2222-4222-8222-000000000006','أطفال','perfume-kids','عطور أطفال لطيفة',2,'11111111-1111-4111-8111-000000000002'),
('22222222-2222-4222-8222-000000000007','زيتي','perfume-oil','عطور زيتية مركزة',3,'11111111-1111-4111-8111-000000000002'),
('22222222-2222-4222-8222-000000000008','شامبو','shampoo','شامبو لكل أنواع الشعر',0,'11111111-1111-4111-8111-000000000003'),
('22222222-2222-4222-8222-000000000009','زيوت وسيروم','hair-oils','زيوت وسيرومات مغذية',1,'11111111-1111-4111-8111-000000000003'),
('22222222-2222-4222-8222-00000000000a','شفاه','lips','أحمر شفاه وملمعات',0,'11111111-1111-4111-8111-000000000004'),
('22222222-2222-4222-8222-00000000000b','عيون','eyes','مسكرة وكحل وظلال',1,'11111111-1111-4111-8111-000000000004')
ON CONFLICT DO NOTHING;

-- 6) Demo products (base prices are in YER, the default currency)
INSERT INTO public.products (id, name, slug, description, price, discount_price, images, category_id, stock, status, is_featured, is_bestseller) VALUES
('33333333-3333-4333-8333-000000000001','غسول وجه منظف للبشرة الدهنية','face-cleanser','غسول لطيف ينظف المسام بعمق ويوازن إفراز الدهون، مناسب للاستخدام اليومي.',7500,6200,ARRAY['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80'],'22222222-2222-4222-8222-000000000001',25,true,true,true),
('33333333-3333-4333-8333-000000000002','كريم مرطب بحمض الهيالورونيك','hydrating-cream','كريم مرطب خفيف يمنح البشرة ترطيباً يدوم 24 ساعة دون ملمس دهني.',12000,NULL,ARRAY['https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80'],'22222222-2222-4222-8222-000000000001',18,true,true,false),
('33333333-3333-4333-8333-000000000003','واقي شمس SPF50 خفيف','sunscreen-spf50','حماية عالية من الأشعة فوق البنفسجية بملمس خفيف لا يترك أثراً أبيض.',9800,8900,ARRAY['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=80'],'22222222-2222-4222-8222-000000000002',30,true,true,true),
('33333333-3333-4333-8333-000000000004','مجموعة العناية اليومية بالبشرة','daily-skin-set','مجموعة متكاملة: غسول + تونر + مرطب + واقي شمس بسعر مميز.',32000,27500,ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=80'],'22222222-2222-4222-8222-000000000003',10,true,true,false),
('33333333-3333-4333-8333-000000000005','عطر نسائي زهري فاخر','floral-perfume','عطر نسائي بمزيج زهري دافئ وثبات يمتد لساعات طويلة.',28000,NULL,ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80'],'22222222-2222-4222-8222-000000000004',14,true,true,true),
('33333333-3333-4333-8333-000000000006','عطر رجالي خشبي','woody-perfume','عطر رجالي بنفحات خشبية وتوابل شرقية يناسب المساء.',31000,26900,ARRAY['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=900&q=80'],'22222222-2222-4222-8222-000000000005',12,true,false,true),
('33333333-3333-4333-8333-000000000007','شامبو مغذي بزيت الأرغان','argan-shampoo','شامبو غني بزيت الأرغان يمنح الشعر نعومة ولمعاناً من أول استخدام.',8600,NULL,ARRAY['https://images.unsplash.com/photo-1626015438414-96e3a2f4f1b3?w=900&q=80'],'22222222-2222-4222-8222-000000000008',22,true,false,true),
('33333333-3333-4333-8333-000000000008','أحمر شفاه مطفي طويل الثبات','matte-lipstick','تركيبة مطفية مريحة على الشفاه بثبات يصل إلى 8 ساعات.',6400,5200,ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=900&q=80'],'22222222-2222-4222-8222-00000000000a',40,true,true,false)
ON CONFLICT DO NOTHING;

-- 7) Explicit SAR prices for the demo products
INSERT INTO public.product_prices (product_id, currency_code, price, discount_price) VALUES
('33333333-3333-4333-8333-000000000001','SAR',119,98),
('33333333-3333-4333-8333-000000000002','SAR',189,NULL),
('33333333-3333-4333-8333-000000000003','SAR',155,139),
('33333333-3333-4333-8333-000000000004','SAR',499,429),
('33333333-3333-4333-8333-000000000005','SAR',439,NULL),
('33333333-3333-4333-8333-000000000006','SAR',489,425),
('33333333-3333-4333-8333-000000000007','SAR',135,NULL),
('33333333-3333-4333-8333-000000000008','SAR',99,82)
ON CONFLICT DO NOTHING;