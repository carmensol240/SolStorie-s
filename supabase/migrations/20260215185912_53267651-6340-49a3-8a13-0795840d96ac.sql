
-- Add approval and display fields to user_feedback
ALTER TABLE public.user_feedback 
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name text;

-- Allow anyone (including anonymous/guest) to read approved high-rated reviews
CREATE POLICY "Anyone can view approved reviews"
  ON public.user_feedback
  FOR SELECT
  USING (is_approved = true AND rating >= 4);

-- Allow admins to update feedback (approve/reject)
CREATE POLICY "Admins can update feedback"
  ON public.user_feedback
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.user_feedback
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
