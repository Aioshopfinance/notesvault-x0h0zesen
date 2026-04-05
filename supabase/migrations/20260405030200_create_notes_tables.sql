DO $$
BEGIN
  -- Create folders table
  CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Create notes table
  CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    pinned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Create attachments table
  CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
END $$;

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policies for folders
DROP POLICY IF EXISTS "Users can manage their own folders" ON public.folders;
CREATE POLICY "Users can manage their own folders" ON public.folders
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
CREATE POLICY "Users can manage their own notes" ON public.notes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for attachments
DROP POLICY IF EXISTS "Users can manage attachments of their notes" ON public.attachments;
CREATE POLICY "Users can manage attachments of their notes" ON public.attachments
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_id AND notes.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));

-- Create default folder on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_folder()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.folders (user_id, name)
  VALUES (NEW.id, 'Minhas Notas');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_folder ON auth.users;
CREATE TRIGGER on_auth_user_created_folder
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_folder();

-- Seed default folders for existing users
DO $$
BEGIN
  INSERT INTO public.folders (user_id, name)
  SELECT id, 'Minhas Notas' FROM auth.users
  WHERE NOT EXISTS (
    SELECT 1 FROM public.folders WHERE folders.user_id = auth.users.id
  );
END $$;
