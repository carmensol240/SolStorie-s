-- Add commercial abuse tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS commercial_abuse_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commercial_abuse_flagged_at timestamp with time zone DEFAULT NULL;

-- Create admin_alerts table for tracking flagged users
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid
);

-- Enable RLS on admin_alerts
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view alerts
CREATE POLICY "Admins can view alerts" 
ON public.admin_alerts 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update alerts (to resolve them)
CREATE POLICY "Admins can update alerts" 
ON public.admin_alerts 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert alerts (from edge functions)
CREATE POLICY "Service role can insert alerts" 
ON public.admin_alerts 
FOR INSERT 
WITH CHECK (current_setting('role'::text) = 'service_role'::text);