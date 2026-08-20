ALTER TABLE public.product_reviews ALTER COLUMN is_approved SET DEFAULT true;
UPDATE public.product_reviews SET is_approved = true WHERE is_approved = false;