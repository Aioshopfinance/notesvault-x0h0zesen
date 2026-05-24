CREATE OR REPLACE FUNCTION public.normalize_secret_log_action()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.action NOT IN ('view', 'copy', 'create', 'update', 'delete', 'moved_to_trash', 'restored_from_trash', 'permanently_deleted') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be one of: view, copy, create, update, delete, moved_to_trash, restored_from_trash, permanently_deleted', NEW.action;
  END IF;
  RETURN NEW;
END;
$function$;
