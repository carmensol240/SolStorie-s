ALTER TABLE public.children ADD COLUMN IF NOT EXISTS kippah boolean NOT NULL DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS kippah boolean NOT NULL DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS kippah_color text;