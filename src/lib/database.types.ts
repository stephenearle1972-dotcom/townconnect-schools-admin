export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bus_routes: {
        Row: {
          afternoon_dropoff_times: Json | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          monthly_fee: number | null
          morning_pickup_times: Json | null
          route_name: string
          school_id: string
          stops: Json | null
          updated_at: string
        }
        Insert: {
          afternoon_dropoff_times?: Json | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          monthly_fee?: number | null
          morning_pickup_times?: Json | null
          route_name: string
          school_id: string
          stops?: Json | null
          updated_at?: string
        }
        Update: {
          afternoon_dropoff_times?: Json | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          monthly_fee?: number | null
          morning_pickup_times?: Json | null
          route_name?: string
          school_id?: string
          stops?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_routes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          event_date: string
          event_end_date: string | null
          id: string
          is_public: boolean | null
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date: string
          event_end_date?: string | null
          id?: string
          is_public?: boolean | null
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          event_date?: string
          event_end_date?: string | null
          id?: string
          is_public?: boolean | null
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          fee_type: string
          grade: string
          id: string
          school_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          fee_type: string
          grade: string
          id?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          fee_type?: string
          grade?: string
          id?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          extracted_text: string | null
          extraction_error: string | null
          extraction_status: string | null
          filename: string
          id: string
          mime_type: string | null
          processed_at: string | null
          school_id: string
          size_bytes: number | null
          storage_path: string
          summary: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_status?: string | null
          filename: string
          id?: string
          mime_type?: string | null
          processed_at?: string | null
          school_id: string
          size_bytes?: number | null
          storage_path: string
          summary?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          extracted_text?: string | null
          extraction_error?: string | null
          extraction_status?: string | null
          filename?: string
          id?: string
          mime_type?: string | null
          processed_at?: string | null
          school_id?: string
          size_bytes?: number | null
          storage_path?: string
          summary?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_content: {
        Row: {
          body: string
          created_at: string
          deleted_at: string | null
          display_order: number | null
          id: string
          school_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          school_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          deleted_at?: string | null
          display_order?: number | null
          id?: string
          school_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_content_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          attachment_url: string | null
          body: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_published: boolean | null
          publish_at: string | null
          school_id: string
          title: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          attachment_url?: string | null
          body: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          publish_at?: string | null
          school_id: string
          title: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          attachment_url?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          publish_at?: string | null
          school_id?: string
          title?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_admins: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          school_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          bot_phone_e164: string | null
          bot_phone_number_id: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          paid_until: string | null
          principal_name: string | null
          short_code: string | null
          slug: string
          subscription_status: string
          trial_bot_prefix: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bot_phone_e164?: string | null
          bot_phone_number_id?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          paid_until?: string | null
          principal_name?: string | null
          short_code?: string | null
          slug: string
          subscription_status?: string
          trial_bot_prefix?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bot_phone_e164?: string | null
          bot_phone_number_id?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          paid_until?: string | null
          principal_name?: string | null
          short_code?: string | null
          slug?: string
          subscription_status?: string
          trial_bot_prefix?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sport_fixtures: {
        Row: {
          age_group: string | null
          created_at: string
          deleted_at: string | null
          fixture_date: string
          fixture_time: string | null
          id: string
          is_home: boolean | null
          notes: string | null
          opponent: string | null
          result: string | null
          school_id: string
          sport: string
          team: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          deleted_at?: string | null
          fixture_date: string
          fixture_time?: string | null
          id?: string
          is_home?: boolean | null
          notes?: string | null
          opponent?: string | null
          result?: string | null
          school_id: string
          sport: string
          team?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          age_group?: string | null
          created_at?: string
          deleted_at?: string | null
          fixture_date?: string
          fixture_time?: string | null
          id?: string
          is_home?: boolean | null
          notes?: string | null
          opponent?: string | null
          result?: string | null
          school_id?: string
          sport?: string
          team?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_fixtures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          deleted_at: string | null
          display_order: number | null
          email: string | null
          full_name: string
          grades: string[] | null
          id: string
          phone: string | null
          photo_url: string | null
          school_id: string
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number | null
          email?: string | null
          full_name: string
          grades?: string[] | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          school_id: string
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_order?: number | null
          email?: string | null
          full_name?: string
          grades?: string[] | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          school_id?: string
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_super_admins: {
        Row: {
          created_at: string | null
          email: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_super_admin: { Args: never; Returns: boolean }
      user_school_ids: { Args: never; Returns: string[] }
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
