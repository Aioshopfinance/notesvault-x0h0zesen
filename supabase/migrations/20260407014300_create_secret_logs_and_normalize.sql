-- Create secrets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own secrets" ON public.secrets;
CREATE POLICY "Users can manage their own secrets" ON public.secrets
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create secret_access_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.secret_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_id UUID NOT NULL REFERENCES public.secrets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist in case table was already created
ALTER TABLE public.secret_access_logs 
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.secret_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own logs" ON public.secret_access_logs;
CREATE POLICY "Users can read their own logs" ON public.secret_access_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own logs" ON public.secret_access_logs;
CREATE POLICY "Users can insert their own logs" ON public.secret_access_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create normalization function
CREATE OR REPLACE FUNCTION public.normalize_secret_log_action()
RETURNS trigger AS $$
BEGIN
  IF NEW.action NOT IN ('view', 'copy', 'create', 'update', 'delete') THEN
    RAISE EXCEPTION 'Invalid action: %. Must be one of: view, copy, create, update, delete', NEW.action;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for normalization
DROP TRIGGER IF EXISTS trg_normalize_secret_log_action ON public.secret_access_logs;
CREATE TRIGGER trg_normalize_secret_log_action
BEFORE INSERT OR UPDATE ON public.secret_access_logs
FOR EACH ROW EXECUTE FUNCTION public.normalize_secret_log_action();

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_secret_logs_user_id ON public.secret_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_secret_logs_secret_id ON public.secret_access_logs(secret_id);
CREATE INDEX IF NOT EXISTS idx_secret_logs_timestamp ON public.secret_access_logs("timestamp");
