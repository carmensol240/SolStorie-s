
CREATE TABLE public.child_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  user_id uuid NOT NULL,
  original_image_url text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.child_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own child photos" ON public.child_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own child photos" ON public.child_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own child photos" ON public.child_photos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own child photos" ON public.child_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all child photos" ON public.child_photos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
