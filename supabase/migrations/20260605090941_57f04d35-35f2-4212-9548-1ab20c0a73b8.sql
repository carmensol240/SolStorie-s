
CREATE OR REPLACE FUNCTION public.auto_secure_new_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
  LOOP
    IF obj.schema_name = 'public' THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
      EXECUTE format('REVOKE ALL ON %s FROM anon, authenticated', obj.object_identity);
      EXECUTE format('GRANT ALL ON %s TO service_role', obj.object_identity);
      RAISE NOTICE 'auto_secure_new_table: locked down %', obj.object_identity;
    END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS auto_secure_new_table_trg;

CREATE EVENT TRIGGER auto_secure_new_table_trg
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION public.auto_secure_new_table();
