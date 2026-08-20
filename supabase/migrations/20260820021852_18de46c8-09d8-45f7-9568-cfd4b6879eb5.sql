UPDATE public.store_settings SET
  store_name = COALESCE(NULLIF(TRIM(store_name), ''), 'إيهاب ستور للعناية والتجميل'),
  description = COALESCE(NULLIF(TRIM(description), ''), 'وجهتك الأولى في اليمن لمنتجات العناية بالبشرة والشعر والمكياج والعطور الأصلية 100% بأسعار منافسة وتوصيل لكل المحافظات.'),
  about = COALESCE(NULLIF(TRIM(about), ''), 'إيهاب ستور — منتجات أصلية مختارة بعناية، خدمة سريعة وثقة تمتد لسنوات.'),
  about_content = COALESCE(NULLIF(TRIM(about_content), ''), 'بدأت رحلتنا في صنعاء بهدف واضح: أن نوفّر لكل عميلة وعميل منتجات عناية وتجميل أصلية بأسعار عادلة. نعمل مع موردين معتمدين ونفحص كل منتج قبل شحنه، ونقدّم استشارة مجانية لاختيار المنتج المناسب لنوع بشرتك أو شعرك. اليوم نوصل طلباتنا إلى جميع المحافظات اليمنية مع خدمة عملاء تردّ عليك خلال دقائق عبر واتساب.'),
  contact_content = COALESCE(NULLIF(TRIM(contact_content), ''), 'نسعد بخدمتك يومياً من السبت إلى الخميس من 9 صباحاً حتى 9 مساءً. للطلب أو الاستفسار راسلنا على واتساب أو اتصل بنا مباشرة، وفريقنا جاهز لمساعدتك في اختيار المنتج المناسب ومتابعة شحنتك حتى تصلك.'),
  hero_title = COALESCE(NULLIF(TRIM(hero_title), ''), 'جمالك يبدأ من هنا'),
  hero_subtitle = COALESCE(NULLIF(TRIM(hero_subtitle), ''), 'منتجات أصلية للعناية بالبشرة والشعر والعطور — توصيل لكل محافظات اليمن'),
  working_hours = COALESCE(NULLIF(TRIM(working_hours), ''), 'السبت - الخميس: 9 صباحاً - 9 مساءً'),
  address = COALESCE(NULLIF(TRIM(address), ''), 'صنعاء - شارع الزبيري - جوار مركز الأمين التجاري'),
  phone = COALESCE(NULLIF(TRIM(phone), ''), '+967771234567'),
  email = COALESCE(NULLIF(TRIM(email), ''), 'info@ehabstore.com'),
  instagram = COALESCE(NULLIF(TRIM(instagram), ''), 'https://instagram.com/ehabstore'),
  facebook = COALESCE(NULLIF(TRIM(facebook), ''), 'https://facebook.com/ehabstore'),
  tiktok = COALESCE(NULLIF(TRIM(tiktok), ''), 'https://tiktok.com/@ehabstore'),
  snapchat = COALESCE(NULLIF(TRIM(snapchat), ''), 'https://snapchat.com/add/ehabstore'),
  twitter = COALESCE(NULLIF(TRIM(twitter), ''), 'https://x.com/ehabstore'),
  youtube = COALESCE(NULLIF(TRIM(youtube), ''), 'https://youtube.com/@ehabstore'),
  seo_title = COALESCE(NULLIF(TRIM(seo_title), ''), 'إيهاب ستور | منتجات العناية والتجميل الأصلية في اليمن'),
  seo_description = COALESCE(NULLIF(TRIM(seo_description), ''), 'تسوق العناية بالبشرة والشعر والمكياج والعطور الأصلية من إيهاب ستور مع توصيل سريع لكل محافظات اليمن وأسعار منافسة.'),
  seo_keywords = COALESCE(NULLIF(TRIM(seo_keywords), ''), 'العناية بالبشرة, العناية بالشعر, مكياج, عطور, متجر يمني, صنعاء, عدن, تعز, منتجات أصلية'),
  updated_at = now();

INSERT INTO public.testimonials (customer_name, content, rating, is_visible)
SELECT * FROM (VALUES
  ('أم محمد - صنعاء', 'المنتجات أصلية 100% والتوصيل وصلني في نفس اليوم. تعامل راقٍ جداً وأنصح فيهم.', 5, true),
  ('سارة العُلفي - تعز', 'جربت سيروم فيتامين سي والنتيجة ممتازة خلال أسبوعين. شكراً إيهاب ستور.', 5, true),
  ('عبدالله الحداد - عدن', 'العطر وصل مغلّف بشكل أنيق والسعر أفضل من المحلات. خدمة العملاء سريعة.', 5, true),
  ('نجلاء - إب', 'مجموعة العناية بالشعر رهيبة، والاستشارة قبل الشراء ساعدتني أختار الصح.', 4, true)
) AS v(customer_name, content, rating, is_visible)
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials);