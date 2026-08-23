ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;

WITH numbered AS (
  SELECT id, 1000 + row_number() OVER (ORDER BY created_at) AS n
  FROM public.products WHERE sku IS NULL
)
UPDATE public.products p SET sku = 'PR-' || numbered.n
FROM numbered WHERE p.id = numbered.id;

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON public.products (sku) WHERE sku IS NOT NULL;