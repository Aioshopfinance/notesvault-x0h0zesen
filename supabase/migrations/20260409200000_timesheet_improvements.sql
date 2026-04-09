DO $block$
BEGIN
    -- 1. Create time_record_statuses table
    CREATE TABLE IF NOT EXISTS public.time_record_statuses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#FFA500',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, name)
    );
END $block$;

-- Enable RLS
ALTER TABLE public.time_record_statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own statuses" ON public.time_record_statuses;
CREATE POLICY "Users can manage their own statuses" ON public.time_record_statuses
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Add timesheet_columns to user_preferences
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS timesheet_columns JSONB DEFAULT '["date", "start_time", "end_time", "break_time", "wh", "hourly_rate", "client", "location", "status", "dt"]'::jsonb;

-- 3. Add status_id to timesheets
ALTER TABLE public.timesheets ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES public.time_record_statuses(id) ON DELETE RESTRICT;

-- 4. Create default statuses and migrate existing data idempotently
DO $block$
DECLARE
    u RECORD;
    t RECORD;
    pendente_id UUID;
    pago_id UUID;
    s_id UUID;
    column_exists BOOLEAN;
BEGIN
    -- Seed statuses for existing users safely
    FOR u IN SELECT id FROM auth.users LOOP
        INSERT INTO public.time_record_statuses (user_id, name, color)
        VALUES (u.id, 'Pendente', '#FFA500')
        ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color
        RETURNING id INTO pendente_id;

        INSERT INTO public.time_record_statuses (user_id, name, color)
        VALUES (u.id, 'Pago', '#4CAF50')
        ON CONFLICT (user_id, name) DO UPDATE SET color = EXCLUDED.color
        RETURNING id INTO pago_id;
    END LOOP;

    -- Check if status column still exists before trying to migrate data
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'timesheets' 
        AND column_name = 'status'
    ) INTO column_exists;

    IF column_exists THEN
        FOR t IN EXECUTE 'SELECT id, user_id, status FROM public.timesheets WHERE status_id IS NULL' LOOP
            SELECT id INTO s_id FROM public.time_record_statuses WHERE user_id = t.user_id AND name = t.status LIMIT 1;
            IF s_id IS NULL THEN
                INSERT INTO public.time_record_statuses (user_id, name, color) VALUES (t.user_id, t.status, '#808080') RETURNING id INTO s_id;
            END IF;
            EXECUTE 'UPDATE public.timesheets SET status_id = $1 WHERE id = $2' USING s_id, t.id;
        END LOOP;
    END IF;
END $block$;

-- 5. Drop status column and make status_id NOT NULL
ALTER TABLE public.timesheets DROP COLUMN IF EXISTS status;
ALTER TABLE public.timesheets ALTER COLUMN status_id SET NOT NULL;

-- 6. Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_statuses()
RETURNS trigger AS $function$
BEGIN
    INSERT INTO public.time_record_statuses (user_id, name, color)
    VALUES 
        (NEW.id, 'Pendente', '#FFA500'),
        (NEW.id, 'Pago', '#4CAF50');
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_statuses ON auth.users;
CREATE TRIGGER on_auth_user_created_statuses
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_statuses();
