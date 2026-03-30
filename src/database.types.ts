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
      admin_users: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          is_active: boolean | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          is_active?: boolean | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          role?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          booked_by: string | null
          created_at: string | null
          daily_number: number | null
          duration: number | null
          id: string
          medical_record_id: string | null
          notes: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          reason: string | null
          status: string | null
          treatment_type: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          booked_by?: string | null
          created_at?: string | null
          daily_number?: number | null
          duration?: number | null
          id?: string
          medical_record_id?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          reason?: string | null
          status?: string | null
          treatment_type?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          booked_by?: string | null
          created_at?: string | null
          daily_number?: number | null
          duration?: number | null
          id?: string
          medical_record_id?: string | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          reason?: string | null
          status?: string | null
          treatment_type?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      clinic_services: {
        Row: {
          created_at: string | null
          default_price: number
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          name_en: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_price?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          name_en: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_price?: number
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      closures: {
        Row: {
          end_date: string | null
          id: string
          reason: string | null
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          id?: string
          reason?: string | null
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          id?: string
          reason?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      daily_counters: {
        Row: {
          count: number | null
          date: string
        }
        Insert: {
          count?: number | null
          date: string
        }
        Update: {
          count?: number | null
          date?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          invoice_id: string
          notes: string | null
          paid: boolean | null
          paid_date: string | null
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          invoice_id: string
          notes?: string | null
          paid?: boolean | null
          paid_date?: string | null
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          paid?: boolean | null
          paid_date?: string | null
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          balance: number | null
          created_at: string | null
          discount: number | null
          discount_reason: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          items: Json | null
          notes: string | null
          patient_id: string | null
          patient_name: string | null
          payment_method: string | null
          payments: Json | null
          status: string | null
          subtotal: number | null
          tax: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          total_paid: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          balance?: number | null
          created_at?: string | null
          discount?: number | null
          discount_reason?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          payment_method?: string | null
          payments?: Json | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          balance?: number | null
          created_at?: string | null
          discount?: number | null
          discount_reason?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          payment_method?: string | null
          payments?: Json | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_content: {
        Row: {
          content: string | null
          id: string
          key: string | null
          section: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          key?: string | null
          section?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          key?: string | null
          section?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          attachments: Json | null
          chief_complaint: string | null
          created_at: string | null
          diagnosis: string | null
          doctor_notes: string | null
          follow_up_date: string | null
          id: string
          lab_report: string | null
          patient_id: string | null
          prescription: string | null
          teeth_chart: string | null
          treatment_done: string | null
          treatment_plan: string | null
          updated_at: string | null
          visit_date: string | null
          xray_report: string | null
        }
        Insert: {
          appointment_id?: string | null
          attachments?: Json | null
          chief_complaint?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_notes?: string | null
          follow_up_date?: string | null
          id?: string
          lab_report?: string | null
          patient_id?: string | null
          prescription?: string | null
          teeth_chart?: string | null
          treatment_done?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          visit_date?: string | null
          xray_report?: string | null
        }
        Update: {
          appointment_id?: string | null
          attachments?: Json | null
          chief_complaint?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_notes?: string | null
          follow_up_date?: string | null
          id?: string
          lab_report?: string | null
          patient_id?: string | null
          prescription?: string | null
          teeth_chart?: string | null
          treatment_done?: string | null
          treatment_plan?: string | null
          updated_at?: string | null
          visit_date?: string | null
          xray_report?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          medical_history: Json | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          medical_history?: Json | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          medical_history?: Json | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string | null
          booking_advance_days: number | null
          clinic_name: string | null
          created_at: string | null
          doctor_name: string | null
          id: number
          is_booking_enabled: boolean | null
          max_daily_appointments: number | null
          phone: string | null
          shifts: Json | null
          slot_duration: number | null
          updated_at: string | null
          whatsapp: string | null
          working_days: number[] | null
        }
        Insert: {
          address?: string | null
          booking_advance_days?: number | null
          clinic_name?: string | null
          created_at?: string | null
          doctor_name?: string | null
          id?: number
          is_booking_enabled?: boolean | null
          max_daily_appointments?: number | null
          phone?: string | null
          shifts?: Json | null
          slot_duration?: number | null
          updated_at?: string | null
          whatsapp?: string | null
          working_days?: number[] | null
        }
        Update: {
          address?: string | null
          booking_advance_days?: number | null
          clinic_name?: string | null
          created_at?: string | null
          doctor_name?: string | null
          id?: number
          is_booking_enabled?: boolean | null
          max_daily_appointments?: number | null
          phone?: string | null
          shifts?: Json | null
          slot_duration?: number | null
          updated_at?: string | null
          whatsapp?: string | null
          working_days?: number[] | null
        }
        Relationships: []
      }
      slot_locks: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          lock_key: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          lock_key?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          lock_key?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      booked_slots: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      append_payment: {
        Args: { p_invoice_id: string; p_payment: Json }
        Returns: undefined
      }
      book_appointment: {
        Args: {
          p_date: string
          p_lock_id: string
          p_max_daily: number
          p_notes: string
          p_patient_id: string
          p_session_id: string
          p_time: string
          p_type: string
        }
        Returns: Json
      }
      book_appointment_safe: {
        Args: {
          p_date: string
          p_lock_id: string
          p_max_daily?: number
          p_notes: string
          p_patient_id: string
          p_session_id: string
          p_time: string
          p_type: string
        }
        Returns: Json
      }
      check_booking_rate_limit: { Args: { p_phone: string }; Returns: boolean }
      cleanup_expired_slot_locks: { Args: never; Returns: number }
      factory_reset_data: { Args: never; Returns: undefined }
      find_or_create_patient: {
        Args: { p_name: string; p_phone: string }
        Returns: string
      }
      find_patient_by_phone: {
        Args: { p_phone: string }
        Returns: {
          patient_id: string
          patient_name: string
        }[]
      }
      get_daily_appointment_number: {
        Args: { p_date: string }
        Returns: number
      }
      get_dashboard_kpis: {
        Args: { p_month_start: string; p_today: string }
        Returns: Json
      }
      get_financial_summary: { Args: never; Returns: Json }
      get_my_role: { Args: never; Returns: string }
      get_next_invoice_number: { Args: never; Returns: string }
      get_patient_financial_summary: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      log_audit_trail: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_new_values: Json
          p_old_values: Json
          p_reason: string
          p_user_email: string
          p_user_id: string
          p_user_role: string
        }
        Returns: string
      }
      release_slot_lock: {
        Args: { p_lock_id: string; p_session_id: string }
        Returns: undefined
      }
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
