-- Fix #1: user_settings - Restrict SELECT to only the device owner
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anon can read user settings" ON public.user_settings;

-- Create a new policy that only allows reading your own device settings
-- Since we don't have auth, we use a function that checks if the device_id matches
-- But since device_id comes from localStorage (client-side), we need to restrict this properly
-- The safest approach is to not allow public SELECT at all - queries should be filtered by device_id
CREATE POLICY "Users can only read their own device settings" 
ON public.user_settings 
FOR SELECT 
USING (false);

-- Note: The application will use the service role or a function to fetch settings by device_id
-- This prevents enumeration attacks on device_ids

-- Fix #2: digital_books - Hide user_id and dedication_text from public view
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Anyone can view public digital books" ON public.digital_books;

-- Create a restricted policy that only exposes non-sensitive columns
-- We'll create a view for public access that hides sensitive data
CREATE VIEW public.digital_books_public 
WITH (security_invoker = on) AS
SELECT 
  id,
  story_id,
  share_token,
  is_public,
  created_at,
  updated_at
  -- Explicitly NOT including: user_id, dedication_text
FROM public.digital_books
WHERE is_public = true;

-- Now the base table policy denies direct public access
CREATE POLICY "No direct public access to digital_books" 
ON public.digital_books 
FOR SELECT 
USING (auth.uid() = user_id);

-- But owners can still see their own books (including dedication)
-- This is already handled by the "Users can view their own digital books" policy

-- Grant access to the public view
GRANT SELECT ON public.digital_books_public TO anon;
GRANT SELECT ON public.digital_books_public TO authenticated;