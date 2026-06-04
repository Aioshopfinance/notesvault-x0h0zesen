ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS master_password_hash TEXT;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS recovery_key_hash TEXT;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS recovery_key_created_at TIMESTAMPTZ;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS recovery_key_used_at TIMESTAMPTZ;
