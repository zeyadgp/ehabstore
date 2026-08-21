ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS addresses jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS require_email_confirm boolean NOT NULL DEFAULT false;