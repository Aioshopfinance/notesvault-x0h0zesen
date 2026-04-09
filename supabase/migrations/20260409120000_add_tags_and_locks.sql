DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#808080',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS public.note_tags (
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
  );

  ALTER TABLE public.notes 
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lock_password TEXT;
END $$;

-- Security tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
CREATE POLICY "Users can manage their own tags" ON public.tags
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Security note_tags
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage note tags" ON public.note_tags;
CREATE POLICY "Users can manage note tags" ON public.note_tags
  FOR ALL TO authenticated 
  USING (note_id IN (SELECT id FROM public.notes WHERE user_id = auth.uid()))
  WITH CHECK (note_id IN (SELECT id FROM public.notes WHERE user_id = auth.uid()));
