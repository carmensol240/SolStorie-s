CREATE TABLE public.child_portrait_coloring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  coloring_image_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.child_portrait_coloring TO authenticated;
GRANT ALL ON public.child_portrait_coloring TO service_role;
ALTER TABLE public.child_portrait_coloring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read their child portrait coloring" ON public.child_portrait_coloring
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));