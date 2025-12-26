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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      backup_history: {
        Row: {
          backup_format: Database["public"]["Enums"]["backup_format"]
          backup_type: Database["public"]["Enums"]["backup_type"]
          checksum: string | null
          completed_at: string | null
          compression_enabled: boolean | null
          connection_id: string | null
          created_at: string
          encryption_enabled: boolean | null
          error_message: string | null
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          retry_count: number | null
          schedule_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"]
          storage_id: string | null
          tables_backed_up: number | null
          user_id: string
        }
        Insert: {
          backup_format: Database["public"]["Enums"]["backup_format"]
          backup_type: Database["public"]["Enums"]["backup_type"]
          checksum?: string | null
          completed_at?: string | null
          compression_enabled?: boolean | null
          connection_id?: string | null
          created_at?: string
          encryption_enabled?: boolean | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          retry_count?: number | null
          schedule_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          storage_id?: string | null
          tables_backed_up?: number | null
          user_id: string
        }
        Update: {
          backup_format?: Database["public"]["Enums"]["backup_format"]
          backup_type?: Database["public"]["Enums"]["backup_type"]
          checksum?: string | null
          completed_at?: string | null
          compression_enabled?: boolean | null
          connection_id?: string | null
          created_at?: string
          encryption_enabled?: boolean | null
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          retry_count?: number | null
          schedule_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          storage_id?: string | null
          tables_backed_up?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_history_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "database_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_history_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "backup_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_history_storage_id_fkey"
            columns: ["storage_id"]
            isOneToOne: false
            referencedRelation: "storage_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          backup_format: Database["public"]["Enums"]["backup_format"]
          backup_type: Database["public"]["Enums"]["backup_type"]
          compression_enabled: boolean | null
          connection_id: string
          created_at: string
          cron_expression: string | null
          encryption_enabled: boolean | null
          frequency: Database["public"]["Enums"]["schedule_frequency"]
          id: string
          is_active: boolean | null
          last_run_at: string | null
          max_backups: number | null
          name: string
          next_run_at: string | null
          retention_days: number | null
          selected_schemas: string[] | null
          selected_tables: string[] | null
          storage_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_format?: Database["public"]["Enums"]["backup_format"]
          backup_type?: Database["public"]["Enums"]["backup_type"]
          compression_enabled?: boolean | null
          connection_id: string
          created_at?: string
          cron_expression?: string | null
          encryption_enabled?: boolean | null
          frequency?: Database["public"]["Enums"]["schedule_frequency"]
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          max_backups?: number | null
          name: string
          next_run_at?: string | null
          retention_days?: number | null
          selected_schemas?: string[] | null
          selected_tables?: string[] | null
          storage_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_format?: Database["public"]["Enums"]["backup_format"]
          backup_type?: Database["public"]["Enums"]["backup_type"]
          compression_enabled?: boolean | null
          connection_id?: string
          created_at?: string
          cron_expression?: string | null
          encryption_enabled?: boolean | null
          frequency?: Database["public"]["Enums"]["schedule_frequency"]
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          max_backups?: number | null
          name?: string
          next_run_at?: string | null
          retention_days?: number | null
          selected_schemas?: string[] | null
          selected_tables?: string[] | null
          storage_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_schedules_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "database_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_schedules_storage_id_fkey"
            columns: ["storage_id"]
            isOneToOne: false
            referencedRelation: "storage_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      database_connections: {
        Row: {
          created_at: string
          database_name: string
          host: string
          id: string
          is_active: boolean | null
          last_connected_at: string | null
          name: string
          password_encrypted: string
          port: number
          ssl_mode: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          database_name: string
          host: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          name: string
          password_encrypted: string
          port?: number
          ssl_mode?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          database_name?: string
          host?: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          name?: string
          password_encrypted?: string
          port?: number
          ssl_mode?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          backup_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          backup_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          backup_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "backup_history"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restore_history: {
        Row: {
          backup_id: string | null
          completed_at: string | null
          connection_id: string | null
          created_at: string
          error_message: string | null
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"]
          user_id: string
        }
        Insert: {
          backup_id?: string | null
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          user_id: string
        }
        Update: {
          backup_id?: string | null
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restore_history_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "backup_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restore_history_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "database_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_configurations: {
        Row: {
          access_key_encrypted: string | null
          bucket_name: string | null
          created_at: string
          endpoint_url: string | null
          id: string
          is_default: boolean | null
          name: string
          region: string | null
          secret_key_encrypted: string | null
          storage_type: Database["public"]["Enums"]["storage_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          access_key_encrypted?: string | null
          bucket_name?: string | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          region?: string | null
          secret_key_encrypted?: string | null
          storage_type?: Database["public"]["Enums"]["storage_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          access_key_encrypted?: string | null
          bucket_name?: string | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          region?: string | null
          secret_key_encrypted?: string | null
          storage_type?: Database["public"]["Enums"]["storage_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      backup_format: "sql" | "dump" | "backup"
      backup_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      backup_type: "full" | "schema" | "tables"
      schedule_frequency:
        | "manual"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "custom"
      storage_type: "local" | "s3" | "gcs" | "azure"
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
    Enums: {
      app_role: ["admin", "user"],
      backup_format: ["sql", "dump", "backup"],
      backup_status: ["pending", "running", "completed", "failed", "cancelled"],
      backup_type: ["full", "schema", "tables"],
      schedule_frequency: [
        "manual",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "custom",
      ],
      storage_type: ["local", "s3", "gcs", "azure"],
    },
  },
} as const
