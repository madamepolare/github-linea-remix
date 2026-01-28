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
      ai_prospects: {
        Row: {
          company_address: string | null
          company_city: string | null
          company_email: string | null
          company_industry: string | null
          company_name: string
          company_phone: string | null
          company_postal_code: string | null
          company_website: string | null
          confidence_score: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_role: string | null
          converted_company_id: string | null
          converted_contact_id: string | null
          converted_lead_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          source_query: string
          source_url: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_industry?: string | null
          company_name: string
          company_phone?: string | null
          company_postal_code?: string | null
          company_website?: string | null
          confidence_score?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          converted_company_id?: string | null
          converted_contact_id?: string | null
          converted_lead_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          source_query: string
          source_url?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_industry?: string | null
          company_name?: string
          company_phone?: string | null
          company_postal_code?: string | null
          company_website?: string | null
          confidence_score?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          converted_company_id?: string | null
          converted_contact_id?: string | null
          converted_lead_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          source_query?: string
          source_url?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prospects_converted_company_id_fkey"
            columns: ["converted_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prospects_converted_contact_id_fkey"
            columns: ["converted_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prospects_converted_lead_id_fkey"
            columns: ["converted_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prospects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      company_departments: {
        Row: {
          billing_contact_id: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          manager_contact_id: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          billing_contact_id?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          manager_contact_id?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          billing_contact_id?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          manager_contact_id?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_departments_billing_contact_id_fkey"
            columns: ["billing_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_departments_manager_contact_id_fkey"
            columns: ["manager_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_departments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_pipeline_emails: {
        Row: {
          body_html: string
          clicked_at: string | null
          created_at: string | null
          entry_id: string
          id: string
          opened_at: string | null
          sent_at: string | null
          stage_id: string
          status: string | null
          subject: string
          template_id: string | null
          to_email: string
          workspace_id: string
        }
        Insert: {
          body_html: string
          clicked_at?: string | null
          created_at?: string | null
          entry_id: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          stage_id: string
          status?: string | null
          subject: string
          template_id?: string | null
          to_email: string
          workspace_id: string
        }
        Update: {
          body_html?: string
          clicked_at?: string | null
          created_at?: string | null
          entry_id?: string
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          stage_id?: string
          status?: string | null
          subject?: string
          template_id?: string | null
          to_email?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_pipeline_emails_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "contact_pipeline_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_pipeline_emails_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_pipeline_emails_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_pipeline_entries: {
        Row: {
          awaiting_response: boolean | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          entered_at: string | null
          id: string
          last_email_sent_at: string | null
          last_inbound_email_at: string | null
          notes: string | null
          pipeline_id: string
          stage_id: string
          unread_replies_count: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          awaiting_response?: boolean | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          entered_at?: string | null
          id?: string
          last_email_sent_at?: string | null
          last_inbound_email_at?: string | null
          notes?: string | null
          pipeline_id: string
          stage_id: string
          unread_replies_count?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          awaiting_response?: boolean | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          entered_at?: string | null
          id?: string
          last_email_sent_at?: string | null
          last_inbound_email_at?: string | null
          notes?: string | null
          pipeline_id?: string
          stage_id?: string
          unread_replies_count?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_pipeline_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_pipeline_entries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_pipeline_entries_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_pipeline_entries_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_pipeline_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          assigned_to: string | null
          avatar_url: string | null
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          crm_company_id: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          is_billing_contact: boolean | null
          is_primary: boolean | null
          is_sensitive: boolean | null
          job_title: string | null
          last_contact_at: string | null
          last_name: string | null
          linkedin_url: string | null
          mobile: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferences: Json | null
          role: string | null
          salutation: string | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_billing_contact?: boolean | null
          is_primary?: boolean | null
          is_sensitive?: boolean | null
          job_title?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          role?: string | null
          salutation?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_billing_contact?: boolean | null
          is_primary?: boolean | null
          is_sensitive?: boolean | null
          job_title?: string | null
          last_contact_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          role?: string | null
          salutation?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          address: string | null
          annual_revenue: number | null
          assigned_to: string | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          employee_count: number | null
          facebook_url: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notes: string | null
          parent_company_id: string | null
          phone: string | null
          postal_code: string | null
          siren: string | null
          siret: string | null
          size: string | null
          source: string | null
          sub_category: string | null
          tags: string[] | null
          twitter_url: string | null
          type: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          parent_company_id?: string | null
          phone?: string | null
          postal_code?: string | null
          siren?: string | null
          siret?: string | null
          size?: string | null
          source?: string | null
          sub_category?: string | null
          tags?: string[] | null
          twitter_url?: string | null
          type?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          parent_company_id?: string | null
          phone?: string | null
          postal_code?: string | null
          siren?: string | null
          siret?: string | null
          size?: string | null
          source?: string | null
          sub_category?: string | null
          tags?: string[] | null
          twitter_url?: string | null
          type?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_companies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_emails: {
        Row: {
          attachments: Json | null
          bcc: string | null
          body_html: string | null
          body_text: string | null
          cc: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          direction: string
          from_email: string | null
          gmail_message_id: string | null
          gmail_thread_id: string | null
          id: string
          is_read: boolean | null
          labels: string[] | null
          received_at: string | null
          sent_at: string | null
          subject: string | null
          to_email: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          bcc?: string | null
          body_html?: string | null
          body_text?: string | null
          cc?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string
          from_email?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          labels?: string[] | null
          received_at?: string | null
          sent_at?: string | null
          subject?: string | null
          to_email?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          bcc?: string | null
          body_html?: string | null
          body_text?: string | null
          cc?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string
          from_email?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          labels?: string[] | null
          received_at?: string | null
          sent_at?: string | null
          subject?: string | null
          to_email?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          auto_actions: Json | null
          color: string | null
          created_at: string | null
          delay_days: number | null
          description: string | null
          email_template_id: string | null
          icon: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          pipeline_id: string
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          auto_actions?: Json | null
          color?: string | null
          created_at?: string | null
          delay_days?: number | null
          description?: string | null
          email_template_id?: string | null
          icon?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          pipeline_id: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          auto_actions?: Json | null
          color?: string | null
          created_at?: string | null
          delay_days?: number | null
          description?: string | null
          email_template_id?: string | null
          icon?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          pipeline_id?: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipeline_stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          settings: Json | null
          type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          settings?: Json | null
          type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          settings?: Json | null
          type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
          variables: Json | null
          workspace_id: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: Json | null
          workspace_id: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string
          outcome: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          outcome?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          outcome?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          company_name: string | null
          contact_email: string | null
          contact_id: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_to_project_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lost_at: string | null
          lost_reason: string | null
          notes: string | null
          priority: string | null
          probability: number | null
          source: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          won_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          priority?: string | null
          probability?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          won_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_to_project_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          notes?: string | null
          priority?: string | null
          probability?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          won_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          dnd_end: string | null
          dnd_start: string | null
          do_not_disturb: boolean | null
          email_digest: boolean | null
          email_digest_frequency: string | null
          id: string
          notify_mentions: boolean | null
          notify_new_messages: boolean | null
          notify_project_updates: boolean | null
          notify_task_updates: boolean | null
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          dnd_end?: string | null
          dnd_start?: string | null
          do_not_disturb?: boolean | null
          email_digest?: boolean | null
          email_digest_frequency?: string | null
          id?: string
          notify_mentions?: boolean | null
          notify_new_messages?: boolean | null
          notify_project_updates?: boolean | null
          notify_task_updates?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          dnd_end?: string | null
          dnd_start?: string | null
          do_not_disturb?: boolean | null
          email_digest?: boolean | null
          email_digest_frequency?: string | null
          id?: string
          notify_mentions?: boolean | null
          notify_new_messages?: boolean | null
          notify_project_updates?: boolean | null
          notify_task_updates?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          related_entity_id: string | null
          related_entity_name: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          action_url?: string | null
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action_url?: string | null
          actor_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      phase_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_phase_id: string
          id: string
          lag_days: number | null
          phase_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_phase_id: string
          id?: string
          lag_days?: number | null
          phase_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_phase_id?: string
          id?: string
          lag_days?: number | null
          phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_dependencies_depends_on_phase_id_fkey"
            columns: ["depends_on_phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_dependencies_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_templates: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          default_budget_hours: number | null
          default_duration_days: number | null
          deliverables: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          tasks: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          default_budget_hours?: number | null
          default_duration_days?: number | null
          deliverables?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          tasks?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          default_budget_hours?: number | null
          default_duration_days?: number | null
          deliverables?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          tasks?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_actions: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          id: string
          is_active: boolean | null
          pipeline_id: string
          sort_order: number | null
          stage_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          pipeline_id: string
          sort_order?: number | null
          stage_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          is_active?: boolean | null
          pipeline_id?: string
          sort_order?: number | null
          stage_id?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_actions_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_actions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_workspace_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          locale: string | null
          onboarding_completed: boolean | null
          phone: string | null
          preferences: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          locale?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          locale?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_workspace_id_fkey"
            columns: ["active_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budget_envelopes: {
        Row: {
          budget_amount: number
          category: string | null
          consumed_amount: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          envelope_type: string | null
          id: string
          name: string
          project_id: string
          remaining_amount: number | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          budget_amount?: number
          category?: string | null
          consumed_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          envelope_type?: string | null
          id?: string
          name: string
          project_id: string
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          budget_amount?: number
          category?: string | null
          consumed_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          envelope_type?: string | null
          id?: string
          name?: string
          project_id?: string
          remaining_amount?: number | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budget_envelopes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budget_envelopes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          project_id: string
          role: string | null
          workspace_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          project_id: string
          role?: string | null
          workspace_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          project_id?: string
          role?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_deliverables: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          deliverable_type: string | null
          description: string | null
          due_date: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          name: string
          phase_id: string | null
          priority: string | null
          project_id: string
          revision_notes: string | null
          sort_order: number | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          version: number | null
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_type?: string | null
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name: string
          phase_id?: string | null
          priority?: string | null
          project_id: string
          revision_notes?: string | null
          sort_order?: number | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          version?: number | null
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_type?: string | null
          description?: string | null
          due_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
          phase_id?: string | null
          priority?: string | null
          project_id?: string
          revision_notes?: string | null
          sort_order?: number | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          version?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deliverables_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deliverables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_elements: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          element_type: Database["public"]["Enums"]["element_type"]
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_pinned: boolean | null
          metadata: Json | null
          phase_id: string | null
          project_id: string
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
          visibility: Database["public"]["Enums"]["element_visibility"] | null
          workspace_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          element_type: Database["public"]["Enums"]["element_type"]
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          phase_id?: string | null
          project_id: string
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
          visibility?: Database["public"]["Enums"]["element_visibility"] | null
          workspace_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          element_type?: Database["public"]["Enums"]["element_type"]
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          phase_id?: string | null
          project_id?: string
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
          visibility?: Database["public"]["Enums"]["element_visibility"] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_elements_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_elements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_elements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_meetings: {
        Row: {
          action_items: Json | null
          agenda_items: Json | null
          attachments: Json | null
          attendee_ids: string[] | null
          created_at: string | null
          created_by: string | null
          decisions: Json | null
          description: string | null
          duration_minutes: number | null
          external_attendees: Json | null
          id: string
          location: string | null
          meeting_type: string | null
          notes: string | null
          organizer_id: string | null
          project_id: string
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
          video_link: string | null
          workspace_id: string
        }
        Insert: {
          action_items?: Json | null
          agenda_items?: Json | null
          attachments?: Json | null
          attendee_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          decisions?: Json | null
          description?: string | null
          duration_minutes?: number | null
          external_attendees?: Json | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          notes?: string | null
          organizer_id?: string | null
          project_id: string
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
          video_link?: string | null
          workspace_id: string
        }
        Update: {
          action_items?: Json | null
          agenda_items?: Json | null
          attachments?: Json | null
          attendee_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          decisions?: Json | null
          description?: string | null
          duration_minutes?: number | null
          external_attendees?: Json | null
          id?: string
          location?: string | null
          meeting_type?: string | null
          notes?: string | null
          organizer_id?: string | null
          project_id?: string
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          video_link?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_meetings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          client_daily_rate: number | null
          created_at: string | null
          hours_allocated: number | null
          id: string
          is_lead: boolean | null
          joined_at: string | null
          left_at: string | null
          project_id: string
          responsibilities: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_daily_rate?: number | null
          created_at?: string | null
          hours_allocated?: number | null
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          project_id: string
          responsibilities?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_daily_rate?: number | null
          created_at?: string | null
          hours_allocated?: number | null
          id?: string
          is_lead?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          project_id?: string
          responsibilities?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_amount: number | null
          actual_end: string | null
          actual_hours: number | null
          actual_start: string | null
          budget_amount: number | null
          budget_hours: number | null
          code: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          depends_on: string[] | null
          description: string | null
          id: string
          name: string
          planned_end: string | null
          planned_start: string | null
          progress: number | null
          project_id: string
          sort_order: number | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          actual_amount?: number | null
          actual_end?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          budget_amount?: number | null
          budget_hours?: number | null
          code?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          depends_on?: string[] | null
          description?: string | null
          id?: string
          name: string
          planned_end?: string | null
          planned_start?: string | null
          progress?: number | null
          project_id: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          actual_amount?: number | null
          actual_end?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          budget_amount?: number | null
          budget_hours?: number | null
          code?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          depends_on?: string[] | null
          description?: string | null
          id?: string
          name?: string
          planned_end?: string | null
          planned_start?: string | null
          progress?: number | null
          project_id?: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_purchases: {
        Row: {
          amount_ht: number
          amount_ttc: number | null
          budget_envelope_id: string | null
          category: Database["public"]["Enums"]["purchase_category"] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_file_url: string | null
          notes: string | null
          paid_at: string | null
          project_id: string
          purchase_type: Database["public"]["Enums"]["purchase_type"] | null
          reference: string | null
          status: Database["public"]["Enums"]["purchase_status"] | null
          supplier_company_id: string | null
          supplier_name: string | null
          title: string
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          vat_rate: number | null
          workspace_id: string
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number | null
          budget_envelope_id?: string | null
          category?: Database["public"]["Enums"]["purchase_category"] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_file_url?: string | null
          notes?: string | null
          paid_at?: string | null
          project_id: string
          purchase_type?: Database["public"]["Enums"]["purchase_type"] | null
          reference?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          supplier_company_id?: string | null
          supplier_name?: string | null
          title: string
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          vat_rate?: number | null
          workspace_id: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number | null
          budget_envelope_id?: string | null
          category?: Database["public"]["Enums"]["purchase_category"] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_file_url?: string | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string
          purchase_type?: Database["public"]["Enums"]["purchase_type"] | null
          reference?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          supplier_company_id?: string | null
          supplier_name?: string | null
          title?: string
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          vat_rate?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_purchases_budget_envelope_id_fkey"
            columns: ["budget_envelope_id"]
            isOneToOne: false
            referencedRelation: "project_budget_envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_purchases_supplier_company_id_fkey"
            columns: ["supplier_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_purchases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          archived_at: string | null
          budget: number | null
          category: string | null
          city: string | null
          client_company_id: string | null
          client_contact_id: string | null
          code: string | null
          color: string | null
          completed_at: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          end_date: string | null
          estimated_hours: number | null
          hourly_rate: number | null
          icon: string | null
          id: string
          is_archived: boolean | null
          is_template: boolean | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          name: string
          postal_code: string | null
          priority: string | null
          profit_margin: number | null
          project_type: string | null
          settings: Json | null
          start_date: string | null
          status: string | null
          sub_category: string | null
          surface: number | null
          tags: string[] | null
          template_id: string | null
          total_costs: number | null
          total_revenue: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          budget?: number | null
          category?: string | null
          city?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          code?: string | null
          color?: string | null
          completed_at?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_template?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          postal_code?: string | null
          priority?: string | null
          profit_margin?: number | null
          project_type?: string | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          sub_category?: string | null
          surface?: number | null
          tags?: string[] | null
          template_id?: string | null
          total_costs?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          budget?: number | null
          category?: string | null
          city?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          code?: string | null
          color?: string | null
          completed_at?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          is_template?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          postal_code?: string | null
          priority?: string | null
          profit_margin?: number | null
          project_type?: string | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          sub_category?: string | null
          surface?: number | null
          tags?: string[] | null
          template_id?: string | null
          total_costs?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_name: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_name?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_name?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          sort_order: number | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          sort_order?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          sort_order?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          mentions: string[] | null
          parent_id: string | null
          task_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          task_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          task_id?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_exchanges: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          exchange_type: string | null
          id: string
          is_internal: boolean | null
          sender_email: string | null
          sender_id: string | null
          sender_name: string | null
          sender_type: string
          task_id: string
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          exchange_type?: string | null
          id?: string
          is_internal?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
          task_id: string
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          exchange_type?: string | null
          id?: string
          is_internal?: boolean | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
          task_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_exchanges_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_exchanges_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_time_entries: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          duration_minutes: number
          hourly_rate: number | null
          id: string
          is_billable: boolean | null
          task_id: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          description?: string | null
          duration_minutes: number
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          task_id: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          duration_minutes?: number
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_time_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          assignee_ids: string[] | null
          color: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deliverable_id: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          labels: Json | null
          metadata: Json | null
          parent_id: string | null
          phase_id: string | null
          position: number | null
          priority: string | null
          project_id: string | null
          sort_order: number | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          assignee_ids?: string[] | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: Json | null
          metadata?: Json | null
          parent_id?: string | null
          phase_id?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          assignee_ids?: string[] | null
          color?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: Json | null
          metadata?: Json | null
          parent_id?: string | null
          phase_id?: string | null
          position?: number | null
          priority?: string | null
          project_id?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "project_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_enabled_modules: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          module_id: string
          settings: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_id: string
          settings?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_id?: string
          settings?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_enabled_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_enabled_modules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_role_permissions: {
        Row: {
          created_at: string | null
          granted: boolean
          id: string
          permission_code: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          granted?: boolean
          id?: string
          permission_code: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          granted?: boolean
          id?: string
          permission_code?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_role_permissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          address: string | null
          billing_email: string | null
          capital_social: number | null
          city: string | null
          country: string | null
          created_at: string | null
          default_currency: string | null
          default_vat_rate: number | null
          description: string | null
          email: string | null
          features: Json | null
          id: string
          industry: string | null
          legal_form: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          rcs_city: string | null
          settings: Json | null
          siren: string | null
          siret: string | null
          slug: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          capital_social?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_vat_rate?: number | null
          description?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          industry?: string | null
          legal_form?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          rcs_city?: string | null
          settings?: Json | null
          siren?: string | null
          siret?: string | null
          slug?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          capital_social?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: string | null
          default_vat_rate?: number | null
          description?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          industry?: string | null
          legal_form?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          rcs_city?: string | null
          settings?: Json | null
          siren?: string | null
          siret?: string | null
          slug?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
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
      app_role: "owner" | "admin" | "member" | "viewer"
      element_type:
        | "link"
        | "file"
        | "email"
        | "note"
        | "order"
        | "letter"
        | "other"
        | "credential"
        | "image_ref"
      element_visibility: "all" | "admin" | "owner"
      french_leave_type:
        | "cp"
        | "rtt"
        | "anciennete"
        | "fractionnement"
        | "maladie"
        | "maternite"
        | "paternite"
        | "parental"
        | "enfant_malade"
        | "evenement_familial"
        | "sans_solde"
        | "formation"
        | "compte_epargne"
        | "autre"
      invitation_response: "pending" | "accepted" | "declined"
      payroll_period_status:
        | "draft"
        | "pending"
        | "validated"
        | "exported"
        | "closed"
      procedure_type:
        | "ouvert"
        | "restreint"
        | "adapte"
        | "concours"
        | "dialogue"
        | "partenariat"
        | "mapa"
        | "ppp"
        | "conception_realisation"
        | "autre"
        | "concours_restreint"
        | "concours_ouvert"
        | "dialogue_competitif"
        | "partenariat_innovation"
        | "appel_offres_ouvert"
        | "appel_offres_restreint"
        | "negociee"
      purchase_category:
        | "subcontract"
        | "printing"
        | "rental"
        | "transport"
        | "material"
        | "service"
        | "other"
      purchase_status:
        | "draft"
        | "pending_validation"
        | "validated"
        | "invoice_received"
        | "payment_pending"
        | "paid"
        | "cancelled"
      purchase_type: "provision" | "supplier_invoice"
      tender_status:
        | "repere"
        | "en_analyse"
        | "go"
        | "no_go"
        | "en_montage"
        | "depose"
        | "gagne"
        | "perdu"
      tender_team_role: "mandataire" | "cotraitant" | "sous_traitant"
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
      app_role: ["owner", "admin", "member", "viewer"],
      element_type: [
        "link",
        "file",
        "email",
        "note",
        "order",
        "letter",
        "other",
        "credential",
        "image_ref",
      ],
      element_visibility: ["all", "admin", "owner"],
      french_leave_type: [
        "cp",
        "rtt",
        "anciennete",
        "fractionnement",
        "maladie",
        "maternite",
        "paternite",
        "parental",
        "enfant_malade",
        "evenement_familial",
        "sans_solde",
        "formation",
        "compte_epargne",
        "autre",
      ],
      invitation_response: ["pending", "accepted", "declined"],
      payroll_period_status: [
        "draft",
        "pending",
        "validated",
        "exported",
        "closed",
      ],
      procedure_type: [
        "ouvert",
        "restreint",
        "adapte",
        "concours",
        "dialogue",
        "partenariat",
        "mapa",
        "ppp",
        "conception_realisation",
        "autre",
        "concours_restreint",
        "concours_ouvert",
        "dialogue_competitif",
        "partenariat_innovation",
        "appel_offres_ouvert",
        "appel_offres_restreint",
        "negociee",
      ],
      purchase_category: [
        "subcontract",
        "printing",
        "rental",
        "transport",
        "material",
        "service",
        "other",
      ],
      purchase_status: [
        "draft",
        "pending_validation",
        "validated",
        "invoice_received",
        "payment_pending",
        "paid",
        "cancelled",
      ],
      purchase_type: ["provision", "supplier_invoice"],
      tender_status: [
        "repere",
        "en_analyse",
        "go",
        "no_go",
        "en_montage",
        "depose",
        "gagne",
        "perdu",
      ],
      tender_team_role: ["mandataire", "cotraitant", "sous_traitant"],
    },
  },
} as const
