-- Fix user_feedback: Ensure INSERT sets user_id correctly to prevent spoofing
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.user_feedback;

-- Allow anonymous feedback (user_id NULL) or authenticated feedback (user_id = auth.uid())
CREATE POLICY "Submit own or anonymous feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (
  user_id IS NULL  -- Anonymous feedback allowed
  OR user_id = auth.uid()  -- Or must be the authenticated user
);