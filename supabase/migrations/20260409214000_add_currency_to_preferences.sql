ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
