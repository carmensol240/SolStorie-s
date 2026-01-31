-- Create unique index on user_id + name to enable upsert functionality
CREATE UNIQUE INDEX IF NOT EXISTS children_user_id_name_unique 
ON public.children (user_id, name);