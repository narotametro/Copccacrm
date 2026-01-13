export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          industry: string | null
          size: string | null
          website: string | null
          phone: string | null
          email: string | null
          address: string | null
          status: 'active' | 'inactive' | 'prospect'
          health_score: number | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          size?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          health_score?: number | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          size?: string | null
          website?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          health_score?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'manager' | 'user'
          avatar_url: string | null
          phone: string | null
          department: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'manager' | 'user'
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'manager' | 'user'
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          company_id: string
          title: string
          value: number
          stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          probability: number
          expected_close_date: string | null
          assigned_to: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          value: number
          stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          probability?: number
          expected_close_date?: string | null
          assigned_to: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          value?: number
          stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          probability?: number
          expected_close_date?: string | null
          assigned_to?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      after_sales: {
        Row: {
          id: string
          company_id: string
          order_id: string
          product: string
          status: 'pending' | 'in_progress' | 'completed' | 'issue'
          follow_up_date: string | null
          satisfaction_score: number | null
          notes: string | null
          assigned_to: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          order_id: string
          product: string
          status?: 'pending' | 'in_progress' | 'completed' | 'issue'
          follow_up_date?: string | null
          satisfaction_score?: number | null
          notes?: string | null
          assigned_to: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          order_id?: string
          product?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'issue'
          follow_up_date?: string | null
          satisfaction_score?: number | null
          notes?: string | null
          assigned_to?: string
          created_at?: string
          updated_at?: string
        }
      }
      after_sales_tasks: {
        Row: {
          id: string
          company_id: string | null
          title: string
          description: string | null
          status: 'todo' | 'in-progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          assigned_by: string | null
          linked_type: 'customer' | 'deal' | 'competitor' | 'product' | null
          linked_id: string | null
          linked_name: string | null
          due_date: string | null
          completed_at: string | null
          ai_priority_score: number | null
          ai_suggested_priority: string | null
          is_overdue: boolean
          days_overdue: number | null
          estimated_hours: number | null
          actual_hours: number | null
          tags: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          title: string
          description?: string | null
          status?: 'todo' | 'in-progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          assigned_by?: string | null
          linked_type?: 'customer' | 'deal' | 'competitor' | 'product' | null
          linked_id?: string | null
          linked_name?: string | null
          due_date?: string | null
          completed_at?: string | null
          ai_priority_score?: number | null
          ai_suggested_priority?: string | null
          is_overdue?: boolean
          days_overdue?: number | null
          estimated_hours?: number | null
          actual_hours?: number | null
          tags?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          title?: string
          description?: string | null
          status?: 'todo' | 'in-progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          assigned_by?: string | null
          linked_type?: 'customer' | 'deal' | 'competitor' | 'product' | null
          linked_id?: string | null
          linked_name?: string | null
          due_date?: string | null
          completed_at?: string | null
          ai_priority_score?: number | null
          ai_suggested_priority?: string | null
          is_overdue?: boolean
          days_overdue?: number | null
          estimated_hours?: number | null
          actual_hours?: number | null
          tags?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      after_sales_feedback: {
        Row: {
          id: string
          task_id: string
          user_name: string
          comment: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_name: string
          comment: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_name?: string
          comment?: string
          created_by?: string | null
          created_at?: string
        }
      }
      debt_collection: {
        Row: {
          id: string
          company_id: string
          invoice_number: string
          amount: number
          due_date: string
          status: 'pending' | 'reminded' | 'overdue' | 'paid' | 'written_off'
          days_overdue: number
          last_reminder_date: string | null
          notes: string | null
          assigned_to: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          invoice_number: string
          amount: number
          due_date: string
          status?: 'pending' | 'reminded' | 'overdue' | 'paid' | 'written_off'
          days_overdue?: number
          last_reminder_date?: string | null
          notes?: string | null
          assigned_to: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          invoice_number?: string
          amount?: number
          due_date?: string
          status?: 'pending' | 'reminded' | 'overdue' | 'paid' | 'written_off'
          days_overdue?: number
          last_reminder_date?: string | null
          notes?: string | null
          assigned_to?: string
          created_at?: string
          updated_at?: string
        }
      }
      marketing_kpis: {
        Row: {
          id: string
          company_id: string | null
          label: string
          value: string
          change: string
          trend: 'up' | 'down'
          color: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          label: string
          value: string
          change: string
          trend: 'up' | 'down'
          color: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          label?: string
          value?: string
          change?: string
          trend?: 'up' | 'down'
          color?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      competitors: {
        Row: {
          id: string
          name: string
          industry: string
          strengths: string | null
          weaknesses: string | null
          market_share: number | null
          pricing_strategy: string | null
          target_customers: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry: string
          strengths?: string | null
          weaknesses?: string | null
          market_share?: number | null
          pricing_strategy?: string | null
          target_customers?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string
          strengths?: string | null
          weaknesses?: string | null
          market_share?: number | null
          pricing_strategy?: string | null
          target_customers?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales_strategies: {
        Row: {
          id: string
          name: string
          type: 'campaign' | 'promotion' | 'outreach' | 'event'
          status: 'planned' | 'active' | 'completed' | 'cancelled'
          budget: number | null
          target_audience: string | null
          start_date: string
          end_date: string | null
          roi: number | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'campaign' | 'promotion' | 'outreach' | 'event'
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          budget?: number | null
          target_audience?: string | null
          start_date: string
          end_date?: string | null
          roi?: number | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'campaign' | 'promotion' | 'outreach' | 'event'
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          budget?: number | null
          target_audience?: string | null
          start_date?: string
          end_date?: string | null
          roi?: number | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      kpi_data: {
        Row: {
          id: string
          metric_name: string
          value: number
          target: number | null
          period: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          metric_name: string
          value: number
          target?: number | null
          period: string
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          metric_name?: string
          value?: number
          target?: number | null
          period?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      interactions: {
        Row: {
          id: string
          company_id: string
          type: 'call' | 'email' | 'meeting' | 'note'
          subject: string
          description: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: 'call' | 'email' | 'meeting' | 'note'
          subject: string
          description?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: 'call' | 'email' | 'meeting' | 'note'
          subject?: string
          description?: string | null
          user_id?: string
          created_at?: string
        }
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          module_name: string
          can_view: boolean
          can_edit: boolean
          can_delete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_name: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_name?: string
          can_view?: boolean
          can_edit?: boolean
          can_delete?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invitation_links: {
        Row: {
          id: string
          token: string
          email: string
          role: 'admin' | 'manager' | 'user'
          created_by: string | null
          expires_at: string
          used: boolean
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          email: string
          role: 'admin' | 'manager' | 'user'
          created_by?: string | null
          expires_at: string
          used?: boolean
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          email?: string
          role?: 'admin' | 'manager' | 'user'
          created_by?: string | null
          expires_at?: string
          used?: boolean
          used_at?: string | null
          created_at?: string
        }
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
  }
}
