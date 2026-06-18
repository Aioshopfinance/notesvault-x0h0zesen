// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
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
            foreignKeyName: 'attachments_note_id_fkey'
            columns: ['note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
        ]
      }
      daily_records: {
        Row: {
          category: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          daily_type: string
          due_date: string | null
          gross_amount: number
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string
          pending_amount: number
          quantity: number
          received_amount: number
          reference_code: string | null
          service_location: string | null
          service_status: string
          unit_value: number
          updated_at: string
          user_id: string
          work_date: string
          worker_name: string
        }
        Insert: {
          category?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          daily_type?: string
          due_date?: string | null
          gross_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          pending_amount?: number
          quantity?: number
          received_amount?: number
          reference_code?: string | null
          service_location?: string | null
          service_status?: string
          unit_value?: number
          updated_at?: string
          user_id: string
          work_date: string
          worker_name: string
        }
        Update: {
          category?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          daily_type?: string
          due_date?: string | null
          gross_amount?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          pending_amount?: number
          quantity?: number
          received_amount?: number
          reference_code?: string | null
          service_location?: string | null
          service_status?: string
          unit_value?: number
          updated_at?: string
          user_id?: string
          work_date?: string
          worker_name?: string
        }
        Relationships: []
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
            foreignKeyName: 'folders_parent_folder_id_fkey'
            columns: ['parent_folder_id']
            isOneToOne: false
            referencedRelation: 'folders'
            referencedColumns: ['id']
          },
        ]
      }
      note_tags: {
        Row: {
          note_id: string
          tag_id: string
        }
        Insert: {
          note_id: string
          tag_id: string
        }
        Update: {
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'note_tags_note_id_fkey'
            columns: ['note_id']
            isOneToOne: false
            referencedRelation: 'notes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'note_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          folder_id: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          lock_password: string | null
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
          is_locked?: boolean
          is_pinned?: boolean
          lock_password?: string | null
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
          is_locked?: boolean
          is_pinned?: boolean
          lock_password?: string | null
          pinned_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notes_folder_id_fkey'
            columns: ['folder_id']
            isOneToOne: false
            referencedRelation: 'folders'
            referencedColumns: ['id']
          },
        ]
      }
      scans: {
        Row: {
          created_at: string
          display_name: string | null
          extracted_text: string | null
          file_name: string | null
          folder_id: string | null
          id: string
          image_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          extracted_text?: string | null
          file_name?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          extracted_text?: string | null
          file_name?: string | null
          folder_id?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scans_folder_id_fkey'
            columns: ['folder_id']
            isOneToOne: false
            referencedRelation: 'folders'
            referencedColumns: ['id']
          },
        ]
      }
      secret_access_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: string | null
          secret_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          secret_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          secret_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'secret_access_logs_secret_id_fkey'
            columns: ['secret_id']
            isOneToOne: false
            referencedRelation: 'secrets'
            referencedColumns: ['id']
          },
        ]
      }
      secrets: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          environment: string | null
          id: string
          name: string
          notes: string | null
          password_origin: string | null
          platform: string | null
          recovery_phrase: string | null
          updated_at: string
          url: string | null
          user_id: string
          username: string | null
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          environment?: string | null
          id?: string
          name: string
          notes?: string | null
          password_origin?: string | null
          platform?: string | null
          recovery_phrase?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          username?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          environment?: string | null
          id?: string
          name?: string
          notes?: string | null
          password_origin?: string | null
          platform?: string | null
          recovery_phrase?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          username?: string | null
          value?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      time_record_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
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
          status_id: string
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
          status_id: string
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
          status_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'timesheets_status_id_fkey'
            columns: ['status_id']
            isOneToOne: false
            referencedRelation: 'time_record_statuses'
            referencedColumns: ['id']
          },
        ]
      }
      user_preferences: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          full_name: string | null
          id: string
          master_password: string | null
          master_password_hash: string | null
          phone: string | null
          recovery_key_created_at: string | null
          recovery_key_hash: string | null
          recovery_key_used_at: string | null
          secondary_email: string | null
          state: string | null
          theme: string | null
          timesheet_columns: Json | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id: string
          master_password?: string | null
          master_password_hash?: string | null
          phone?: string | null
          recovery_key_created_at?: string | null
          recovery_key_hash?: string | null
          recovery_key_used_at?: string | null
          secondary_email?: string | null
          state?: string | null
          theme?: string | null
          timesheet_columns?: Json | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id?: string
          master_password?: string | null
          master_password_hash?: string | null
          phone?: string | null
          recovery_key_created_at?: string | null
          recovery_key_hash?: string | null
          recovery_key_used_at?: string | null
          secondary_email?: string | null
          state?: string | null
          theme?: string | null
          timesheet_columns?: Json | null
          updated_at?: string
          zip_code?: string | null
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
