CREATE TABLE IF NOT EXISTS public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_time NUMERIC NOT NULL DEFAULT 0,
    hourly_rate NUMERIC NOT NULL DEFAULT 17,
    client TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own timesheets" ON public.timesheets;
CREATE POLICY "Users can manage their own timesheets"
    ON public.timesheets
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON public.timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON public.timesheets(date);
