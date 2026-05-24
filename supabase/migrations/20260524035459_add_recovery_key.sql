DO $$
BEGIN
    ALTER TABLE public.user_preferences 
    ADD COLUMN IF NOT EXISTS master_password_hash TEXT,
    ADD COLUMN IF NOT EXISTS recovery_key_hash TEXT,
    ADD COLUMN IF NOT EXISTS recovery_key_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS recovery_key_used_at TIMESTAMPTZ;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_secret_log_action()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.action NOT IN ('view', 'copy', 'create', 'update', 'delete', 'moved_to_trash', 'restored_from_trash', 'permanently_deleted', 'master_password_created', 'recovery_key_generated', 'master_password_unlocked', 'master_password_locked', 'master_password_expired') THEN
    RAISE EXCEPTION 'Invalid action: %', NEW.action;
  END IF;
  RETURN NEW;
END;
$function$;
