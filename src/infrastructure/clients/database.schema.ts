export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            admin_users: {
                Row: {
                    id: string
                    email: string
                    role: 'super_admin' | 'admin' | 'receptionist'
                    display_name: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    role?: 'super_admin' | 'admin' | 'receptionist'
                    display_name?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'super_admin' | 'admin' | 'receptionist'
                    display_name?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            appointments: {
                Row: {
                    id: string
                    patient_id: string
                    patient_name: string | null
                    patient_phone: string | null
                    appointment_date: string
                    appointment_time: string | null
                    type: string | null
                    status: string | null
                    notes: string | null
                    booked_by: string | null
                    daily_number: number | null
                    duration: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    patient_name?: string | null
                    patient_phone?: string | null
                    appointment_date: string
                    appointment_time?: string | null
                    type?: string | null
                    status?: string | null
                    notes?: string | null
                    booked_by?: string | null
                    daily_number?: number | null
                    duration?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    patient_name?: string | null
                    patient_phone?: string | null
                    appointment_date?: string
                    appointment_time?: string | null
                    type?: string | null
                    status?: string | null
                    notes?: string | null
                    booked_by?: string | null
                    daily_number?: number | null
                    duration?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            audit_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    user_email: string | null
                    user_role: string | null
                    action: string
                    entity_type: string
                    entity_id: string | null
                    old_values: Json | null
                    new_values: Json | null
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    user_email?: string | null
                    user_role?: string | null
                    action: string
                    entity_type: string
                    entity_id?: string | null
                    old_values?: Json | null
                    new_values?: Json | null
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    user_email?: string | null
                    user_role?: string | null
                    action?: string
                    entity_type?: string
                    entity_id?: string | null
                    old_values?: Json | null
                    new_values?: Json | null
                    reason?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            clinic_services: {
                Row: {
                    id: string
                    name: string
                    name_en: string
                    icon: string
                    description: string | null
                    default_price: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    name_en: string
                    icon?: string
                    description?: string | null
                    default_price?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    name_en?: string
                    icon?: string
                    description?: string | null
                    default_price?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            closures: {
                Row: {
                    id: string
                    start_date: string
                    end_date: string
                    reason: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    start_date: string
                    end_date: string
                    reason?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    start_date?: string
                    end_date?: string
                    reason?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            daily_counters: {
                Row: {
                    date: string
                    count: number
                }
                Insert: {
                    date: string
                    count?: number
                }
                Update: {
                    date?: string
                    count?: number
                }
                Relationships: []
            }
            installments: {
                Row: {
                    id: string
                    invoice_id: string
                    patient_id: string
                    amount: number
                    due_date: string
                    paid_date: string | null
                    paid: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    invoice_id: string
                    patient_id: string
                    amount: number
                    due_date: string
                    paid_date?: string | null
                    paid?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    invoice_id?: string
                    patient_id?: string
                    amount?: number
                    due_date?: string
                    paid_date?: string | null
                    paid?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            invoices: {
                Row: {
                    id: string
                    patient_id: string
                    patient_name: string | null
                    appointment_id: string | null
                    invoice_number: string | null
                    subtotal: number
                    discount: number
                    discount_reason: string | null
                    total_amount: number
                    total_paid: number
                    balance: number
                    status: string | null
                    items: Json | null
                    payments: Json | null
                    notes: string | null
                    invoice_date: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    patient_name?: string | null
                    appointment_id?: string | null
                    invoice_number?: string | null
                    subtotal?: number
                    discount?: number
                    discount_reason?: string | null
                    total_amount?: number
                    total_paid?: number
                    balance?: number
                    status?: string | null
                    items?: Json | null
                    payments?: Json | null
                    notes?: string | null
                    invoice_date?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    patient_name?: string | null
                    appointment_id?: string | null
                    invoice_number?: string | null
                    subtotal?: number
                    discount?: number
                    discount_reason?: string | null
                    total_amount?: number
                    total_paid?: number
                    balance?: number
                    status?: string | null
                    items?: Json | null
                    payments?: Json | null
                    notes?: string | null
                    invoice_date?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            landing_content: {
                Row: {
                    id: string
                    section: string
                    key: string
                    content: string | null
                    type: string | null
                    updated_at: string
                }
                Insert: {
                    id: string
                    section: string
                    key: string
                    content?: string | null
                    type?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    section?: string
                    key?: string
                    content?: string | null
                    type?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            medical_records: {
                Row: {
                    id: string
                    patient_id: string
                    appointment_id: string | null
                    visit_date: string | null
                    chief_complaint: string | null
                    diagnosis: string | null
                    treatment_done: string | null
                    treatment_plan: string | null
                    teeth_chart: Json | null
                    prescription: string | null
                    xray_report: string | null
                    lab_report: string | null
                    doctor_notes: string | null
                    follow_up_date: string | null
                    attachments: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    patient_id: string
                    appointment_id?: string | null
                    visit_date?: string | null
                    chief_complaint?: string | null
                    diagnosis?: string | null
                    treatment_done?: string | null
                    treatment_plan?: string | null
                    teeth_chart?: Json | null
                    prescription?: string | null
                    xray_report?: string | null
                    lab_report?: string | null
                    doctor_notes?: string | null
                    follow_up_date?: string | null
                    attachments?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    patient_id?: string
                    appointment_id?: string | null
                    visit_date?: string | null
                    chief_complaint?: string | null
                    diagnosis?: string | null
                    treatment_done?: string | null
                    treatment_plan?: string | null
                    teeth_chart?: Json | null
                    prescription?: string | null
                    xray_report?: string | null
                    lab_report?: string | null
                    doctor_notes?: string | null
                    follow_up_date?: string | null
                    attachments?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            patients: {
                Row: {
                    id: string
                    name: string
                    phone: string | null
                    email: string | null
                    date_of_birth: string | null
                    gender: string | null
                    address: string | null
                    medical_history: Json | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    date_of_birth?: string | null
                    gender?: string | null
                    address?: string | null
                    medical_history?: Json | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    date_of_birth?: string | null
                    gender?: string | null
                    address?: string | null
                    medical_history?: Json | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            settings: {
                Row: {
                    id: number
                    clinic_name: string | null
                    doctor_name: string | null
                    phone: string | null
                    whatsapp: string | null
                    address: string | null
                    working_days: number[] | null
                    shifts: Json | null
                    slot_duration: number | null
                    max_daily_appointments: number | null
                    is_booking_enabled: boolean | null
                    booking_advance_days: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    clinic_name?: string | null
                    doctor_name?: string | null
                    phone?: string | null
                    whatsapp?: string | null
                    address?: string | null
                    working_days?: number[] | null
                    shifts?: Json | null
                    slot_duration?: number | null
                    max_daily_appointments?: number | null
                    is_booking_enabled?: boolean | null
                    booking_advance_days?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    clinic_name?: string | null
                    doctor_name?: string | null
                    phone?: string | null
                    whatsapp?: string | null
                    address?: string | null
                    working_days?: number[] | null
                    shifts?: Json | null
                    slot_duration?: number | null
                    max_daily_appointments?: number | null
                    is_booking_enabled?: boolean | null
                    booking_advance_days?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            slot_locks: {
                Row: {
                    id: string
                    lock_key: string
                    session_id: string
                    expires_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    lock_key: string
                    session_id: string
                    expires_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    lock_key?: string
                    session_id?: string
                    expires_at?: string
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            book_appointment_safe: {
                Args: {
                    p_patient_id: string
                    p_date: string
                    p_time: string
                    p_type: string
                    p_notes: string
                    p_session_id: string
                    p_lock_id: string
                    p_max_daily: number
                }
                Returns: Json
            }
            find_or_create_patient: {
                Args: {
                    p_phone: string
                    p_name: string
                }
                Returns: string
            }
            log_audit_trail: {
                Args: {
                    p_user_id: string
                    p_user_email: string
                    p_user_role: string
                    p_action: string
                    p_entity_type: string
                    p_entity_id: string
                    p_old_values?: Json
                    p_new_values?: Json
                    p_reason?: string
                }
                Returns: undefined
            }
            get_patient_financial_summary: {
                Args: {
                    p_patient_id: string
                }
                Returns: Json
            }
            find_patient_by_phone: {
                Args: {
                    p_phone: string
                }
                Returns: Json
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

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
    }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never
