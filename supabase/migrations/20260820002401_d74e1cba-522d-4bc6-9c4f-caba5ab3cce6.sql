ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS thumbnail text;

UPDATE public.store_settings SET
  store_name = COALESCE(NULLIF(store_name,''),'إيهاب ستور للجمال'),
  hero_title = COALESCE(NULLIF(hero_title,''),'جمالك يبدأ من هنا'),
  hero_subtitle = COALESCE(NULLIF(hero_subtitle,''),'عطور ومكياج وعناية أصلية 100% مع توصيل لكل محافظات اليمن'),
  description = COALESCE(NULLIF(description,''),'إيهاب ستور متجر يمني متخصص في العناية بالبشرة والشعر، العطور، المكياج والأجهزة الكهربائية للتجميل، بمنتجات أصلية وأسعار مناسبة.'),
  about = COALESCE(NULLIF(about,''),'متجر يمني للمنتجات الأصلية في العناية والجمال، خدمة سريعة وتوصيل لكل المحافظات.'),
  about_content = COALESCE(NULLIF(about_content,''),'انطلق إيهاب ستور من صنعاء ليكون وجهة الجمال الأولى في اليمن. نختار منتجاتنا من وكلاء معتمدين ونضمن أصالتها، ونوفر لكِ تشكيلة متجددة من سيرومات وكريمات البشرة، شامبوهات وماسكات الشعر، العطور الرجالية والنسائية، المكياج والأجهزة الكهربائية.

لماذا نحن؟
• منتجات أصلية مضمونة
• أسعار منافسة وعروض أسبوعية
• توصيل لكل محافظات اليمن
• دعم عبر واتساب طوال أيام الأسبوع'),
  contact_content = COALESCE(NULLIF(contact_content,''),'نسعد بخدمتك! تواصلي معنا عبر واتساب لطلب أي منتج أو للاستفسار عن العروض. فريقنا يرد خلال دقائق خلال ساعات العمل، ونستقبل الطلبات من كل محافظات اليمن.'),
  working_hours = COALESCE(NULLIF(working_hours,''),'يومياً من 9 صباحاً حتى 10 مساءً — الجمعة من 4 عصراً'),
  address = COALESCE(NULLIF(address,''),'صنعاء - شارع الزبيري - جوار مستشفى الثورة'),
  seo_title = COALESCE(NULLIF(seo_title,''),'إيهاب ستور | عطور ومكياج وعناية أصلية في اليمن'),
  seo_description = COALESCE(NULLIF(seo_description,''),'تسوق منتجات العناية بالبشرة والشعر، العطور، المكياج وأجهزة التجميل الأصلية من إيهاب ستور مع توصيل سريع لكل محافظات اليمن.'),
  seo_keywords = COALESCE(NULLIF(seo_keywords,''),'عطور اليمن, مكياج صنعاء, العناية بالبشرة, سيروم, واقي شمس, متجر تجميل يمني, إيهاب ستور')
WHERE true;