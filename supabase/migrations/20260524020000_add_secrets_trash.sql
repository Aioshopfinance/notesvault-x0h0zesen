-- 1. Add deleted_at and deleted_by columns to secrets table
ALTER TABLE public.secrets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.secrets ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Modify secret_access_logs to prevent logs from being deleted when a secret is permanently deleted
ALTER TABLE public.secret_access_logs ALTER COLUMN secret_id DROP NOT NULL;

-- Drop existing foreign key constraint if it exists (assuming default name, we use a DO block to be safe)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'secret_access_logs'
    AND kcu.column_name = 'secret_id';

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.secret_access_logs DROP CONSTRAINT ' || fk_name;
  END IF;
END $$;

-- Recreate the foreign key with ON DELETE SET NULL
ALTER TABLE public.secret_access_logs
  ADD CONSTRAINT secret_access_logs_secret_id_fkey
  FOREIGN KEY (secret_id)
  REFERENCES public.secrets(id)
  ON DELETE SET NULL;
