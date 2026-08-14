INSERT INTO public.store_settings (store_name, logo, grid_columns, card_style)
SELECT 'إيهاب ستور للعناية والتجميل', 'branding/ehab-store-logo.png', 2, 'classic'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

UPDATE public.store_settings SET logo = COALESCE(logo, 'branding/ehab-store-logo.png');