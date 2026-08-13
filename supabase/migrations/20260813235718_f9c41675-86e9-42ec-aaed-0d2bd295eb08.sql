ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS grid_columns integer NOT NULL DEFAULT 2;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS card_style text NOT NULL DEFAULT 'classic';