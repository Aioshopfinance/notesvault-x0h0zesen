// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          note_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          note_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          folder_id: string
          id: string
          is_pinned: boolean
          pinned_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          folder_id: string
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          folder_id?: string
          id?: string
          is_pinned?: boolean
          pinned_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_access_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: string | null
          secret_id: string
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          secret_id: string
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          secret_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_access_logs_secret_id_fkey"
            columns: ["secret_id"]
            isOneToOne: false
            referencedRelation: "secrets"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          break_time: number
          client: string | null
          created_at: string
          date: string
          end_time: string
          hourly_rate: number
          id: string
          location: string | null
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_time?: number
          client?: string | null
          created_at?: string
          date: string
          end_time: string
          hourly_rate?: number
          id?: string
          location?: string | null
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          break_time?: number
          client?: string | null
          created_at?: string
          date?: string
          end_time?: string
          hourly_rate?: number
          id?: string
          location?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: attachments
//   id: uuid (not null, default: gen_random_uuid())
//   note_id: uuid (not null)
//   file_name: text (not null)
//   file_type: text (not null)
//   file_size: integer (not null)
//   file_url: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: folders
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   name: text (not null)
//   parent_folder_id: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: notes
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   folder_id: uuid (not null)
//   title: text (not null, default: ''::text)
//   content: text (not null, default: ''::text)
//   is_pinned: boolean (not null, default: false)
//   pinned_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: secret_access_logs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   secret_id: uuid (not null)
//   action: text (not null)
//   ip_address: text (nullable)
//   user_agent: text (nullable)
//   details: jsonb (nullable, default: '{}'::jsonb)
//   timestamp: timestamp with time zone (not null, default: now())
// Table: secrets
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   name: text (not null)
//   value: text (not null)
//   category: text (not null, default: 'Outro'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: timesheets
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   date: date (not null)
//   start_time: time without time zone (not null)
//   end_time: time without time zone (not null)
//   break_time: numeric (not null, default: 0)
//   hourly_rate: numeric (not null, default: 17)
//   client: text (nullable)
//   location: text (nullable)
//   status: text (not null, default: 'Pendente'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: user_preferences
//   id: uuid (not null)
//   full_name: text (nullable, default: ''::text)
//   avatar_url: text (nullable, default: ''::text)
//   theme: text (nullable, default: 'system'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())

// --- CONSTRAINTS ---
// Table: attachments
//   FOREIGN KEY attachments_note_id_fkey: FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
//   PRIMARY KEY attachments_pkey: PRIMARY KEY (id)
// Table: folders
//   FOREIGN KEY folders_parent_folder_id_fkey: FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE
//   PRIMARY KEY folders_pkey: PRIMARY KEY (id)
//   FOREIGN KEY folders_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: notes
//   FOREIGN KEY notes_folder_id_fkey: FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
//   PRIMARY KEY notes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY notes_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: secret_access_logs
//   PRIMARY KEY secret_access_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY secret_access_logs_secret_id_fkey: FOREIGN KEY (secret_id) REFERENCES secrets(id) ON DELETE CASCADE
//   FOREIGN KEY secret_access_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: secrets
//   PRIMARY KEY secrets_pkey: PRIMARY KEY (id)
//   FOREIGN KEY secrets_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: timesheets
//   PRIMARY KEY timesheets_pkey: PRIMARY KEY (id)
//   FOREIGN KEY timesheets_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: user_preferences
//   FOREIGN KEY user_preferences_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY user_preferences_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: attachments
//   Policy "Users can manage attachments of their notes" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM notes   WHERE ((notes.id = attachments.note_id) AND (notes.user_id = auth.uid()))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM notes   WHERE ((notes.id = attachments.note_id) AND (notes.user_id = auth.uid()))))
// Table: folders
//   Policy "Users can manage their own folders" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: notes
//   Policy "Users can manage their own notes" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: secret_access_logs
//   Policy "Users can insert their own logs" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "Users can read their own logs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
// Table: secrets
//   Policy "Users can manage their own secrets" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: timesheets
//   Policy "Users can manage their own timesheets" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
//     WITH CHECK: (auth.uid() = user_id)
// Table: user_preferences
//   Policy "Users can insert their own preferences" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = id)
//   Policy "Users can update their own preferences" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)
//     WITH CHECK: (auth.uid() = id)
//   Policy "Users can view their own preferences" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)

// --- DATABASE FUNCTIONS ---
// FUNCTION handle_new_user_folder()
//   CREATE OR REPLACE FUNCTION public.handle_new_user_folder()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.folders (user_id, name)
//     VALUES (NEW.id, 'Minhas Notas');
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION handle_new_user_preferences()
//   CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.user_preferences (id, full_name)
//     VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
//     ON CONFLICT (id) DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION normalize_secret_log_action()
//   CREATE OR REPLACE FUNCTION public.normalize_secret_log_action()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     IF NEW.action NOT IN ('view', 'copy', 'create', 'update', 'delete') THEN
//       RAISE EXCEPTION 'Invalid action: %. Must be one of: view, copy, create, update, delete', NEW.action;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: secret_access_logs
//   trg_normalize_secret_log_action: CREATE TRIGGER trg_normalize_secret_log_action BEFORE INSERT OR UPDATE ON public.secret_access_logs FOR EACH ROW EXECUTE FUNCTION normalize_secret_log_action()

// --- INDEXES ---
// Table: secret_access_logs
//   CREATE INDEX idx_secret_logs_secret_id ON public.secret_access_logs USING btree (secret_id)
//   CREATE INDEX idx_secret_logs_timestamp ON public.secret_access_logs USING btree ("timestamp")
//   CREATE INDEX idx_secret_logs_user_id ON public.secret_access_logs USING btree (user_id)
// Table: timesheets
//   CREATE INDEX idx_timesheets_date ON public.timesheets USING btree (date)
//   CREATE INDEX idx_timesheets_user_id ON public.timesheets USING btree (user_id)

