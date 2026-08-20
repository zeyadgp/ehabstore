insert into public.banners (title, badge, placement, sort_order, is_active)
select * from (values
  ('خصومات مميزة على أفضل المنتجات','حتى 40%','ticker',1,true),
  ('منتجات أصلية 100% ومضمونة','ضمان','ticker',2,true),
  ('توصيل سريع لكل المحافظات','24-72 ساعة','ticker',3,true),
  ('نقاط ولاء مع كل طلب','مكافآت','ticker',4,true),
  ('دعم فوري عبر واتساب','خدمة','ticker',5,true)
) as t(title,badge,placement,sort_order,is_active)
where not exists (select 1 from public.banners where placement = 'ticker');