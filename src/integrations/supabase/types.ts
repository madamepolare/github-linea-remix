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
      agency_documents: {
        Row: {
          attachments: Json | null
          category: string
          company_id: string | null
          contact_id: string | null
          content: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_number: string | null
          document_type: string
          id: string
          pdf_url: string | null
          project_id: string | null
          related_document_id: string | null
          sent_at: string | null
          signed_at: string | null
          status: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          category: string
          company_id?: string | null
          contact_id?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_number?: string | null
          document_type: string
          id?: string
          pdf_url?: string | null
          project_id?: string | null
          related_document_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          category?: string
          company_id?: string | null
          contact_id?: string | null
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_number?: string | null
          document_type?: string
          id?: string
          pdf_url?: string | null
          project_id?: string | null
          related_document_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
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
      apprentice_schedules: {
        Row: {
          company_days_per_week: number | null
          created_at: string
          created_by: string | null
          custom_pattern: Json | null
          end_date: string
          id: string
          pattern_type: string
          pdf_filename: string | null
          pdf_url: string | null
          schedule_name: string
          school_days_per_week: number | null
          start_date: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          company_days_per_week?: number | null
          created_at?: string
          created_by?: string | null
          custom_pattern?: Json | null
          end_date: string
          id?: string
          pattern_type?: string
          pdf_filename?: string | null
          pdf_url?: string | null
          schedule_name?: string
          school_days_per_week?: number | null
          start_date: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          company_days_per_week?: number | null
          created_at?: string
          created_by?: string | null
          custom_pattern?: Json | null
          end_date?: string
          id?: string
          pattern_type?: string
          pdf_filename?: string | null
          pdf_url?: string | null
          schedule_name?: string
          school_days_per_week?: number | null
          start_date?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apprentice_schedules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_profiles: {
        Row: {
          bank_name: string | null
          bic: string | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          billing_phone: string | null
          billing_postal_code: string | null
          capital_social: number | null
          code_naf: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          default_discount_percent: number | null
          department_id: string | null
          iban: string | null
          id: string
          legal_form: string | null
          notes: string | null
          payment_method: string | null
          payment_terms: string | null
          rcs_city: string | null
          siren: string | null
          siret: string | null
          updated_at: string | null
          vat_number: string | null
          vat_rate: number | null
          vat_type: string | null
          workspace_id: string
        }
        Insert: {
          bank_name?: string | null
          bic?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          capital_social?: number | null
          code_naf?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          default_discount_percent?: number | null
          department_id?: string | null
          iban?: string | null
          id?: string
          legal_form?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          rcs_city?: string | null
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          vat_type?: string | null
          workspace_id: string
        }
        Update: {
          bank_name?: string | null
          bic?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          capital_social?: number | null
          code_naf?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          default_discount_percent?: number | null
          department_id?: string | null
          iban?: string | null
          id?: string
          legal_form?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          rcs_city?: string | null
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          vat_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_profiles_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string | null
          calendar_color: string | null
          calendar_name: string
          created_at: string | null
          id: string
          is_shared: boolean | null
          last_sync_at: string | null
          provider: string
          provider_account_email: string | null
          provider_account_name: string | null
          refresh_token: string | null
          settings: Json | null
          sync_direction: string | null
          sync_enabled: boolean | null
          sync_error: string | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_color?: string | null
          calendar_name?: string
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          last_sync_at?: string | null
          provider: string
          provider_account_email?: string | null
          provider_account_name?: string | null
          refresh_token?: string | null
          settings?: Json | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          access_token?: string | null
          calendar_color?: string | null
          calendar_name?: string
          created_at?: string | null
          id?: string
          is_shared?: boolean | null
          last_sync_at?: string | null
          provider?: string
          provider_account_email?: string | null
          provider_account_name?: string | null
          refresh_token?: string | null
          settings?: Json | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_deliverables: {
        Row: {
          assigned_to: string | null
          campaign_id: string
          created_at: string | null
          created_by: string | null
          deliverable_type: string
          description: string | null
          due_date: string | null
          files: Json | null
          id: string
          name: string
          preview_url: string | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          deliverable_type: string
          description?: string | null
          due_date?: string | null
          files?: Json | null
          id?: string
          name: string
          preview_url?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          deliverable_type?: string
          description?: string | null
          due_date?: string | null
          files?: Json | null
          id?: string
          name?: string
          preview_url?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_deliverables_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_deliverables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          actual_kpis: Json | null
          brief_attachments: Json | null
          brief_content: string | null
          budget_spent: number | null
          budget_total: number | null
          campaign_type: string | null
          client_company_id: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          id: string
          launch_date: string | null
          name: string
          objectives: Json | null
          project_id: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          target_kpis: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          actual_kpis?: Json | null
          brief_attachments?: Json | null
          brief_content?: string | null
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type?: string | null
          client_company_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          launch_date?: string | null
          name: string
          objectives?: Json | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          target_kpis?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          actual_kpis?: Json | null
          brief_attachments?: Json | null
          brief_content?: string | null
          budget_spent?: number | null
          budget_total?: number | null
          campaign_type?: string | null
          client_company_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          launch_date?: string | null
          name?: string
          objectives?: Json | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          target_kpis?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_links: {
        Row: {
          can_add_tasks: boolean | null
          can_view_invoices: boolean | null
          can_view_projects: boolean | null
          can_view_quotes: boolean | null
          can_view_tasks: boolean | null
          can_view_time_entries: boolean | null
          contact_id: string
          created_at: string | null
          created_by: string | null
          custom_slug: string | null
          expires_at: string | null
          framework_project_id: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          project_ids: string[] | null
          token: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          can_add_tasks?: boolean | null
          can_view_invoices?: boolean | null
          can_view_projects?: boolean | null
          can_view_quotes?: boolean | null
          can_view_tasks?: boolean | null
          can_view_time_entries?: boolean | null
          contact_id: string
          created_at?: string | null
          created_by?: string | null
          custom_slug?: string | null
          expires_at?: string | null
          framework_project_id?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          project_ids?: string[] | null
          token: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          can_add_tasks?: boolean | null
          can_view_invoices?: boolean | null
          can_view_projects?: boolean | null
          can_view_quotes?: boolean | null
          can_view_tasks?: boolean | null
          can_view_time_entries?: boolean | null
          contact_id?: string
          created_at?: string | null
          created_by?: string | null
          custom_slug?: string | null
          expires_at?: string | null
          framework_project_id?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          project_ids?: string[] | null
          token?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_links_framework_project_id_fkey"
            columns: ["framework_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_document_phases: {
        Row: {
          amount: number | null
          assigned_member_id: string | null
          assigned_skill: string | null
          billing_type: string | null
          created_at: string | null
          deliverables: Json | null
          document_id: string
          end_date: string | null
          id: string
          is_included: boolean | null
          line_type: string | null
          margin_percentage: number | null
          percentage_fee: number | null
          phase_code: string
          phase_description: string | null
          phase_name: string
          pricing_mode: string | null
          purchase_price: number | null
          quantity: number | null
          recurrence_months: number | null
          skill_id: string | null
          sort_order: number | null
          start_date: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          assigned_member_id?: string | null
          assigned_skill?: string | null
          billing_type?: string | null
          created_at?: string | null
          deliverables?: Json | null
          document_id: string
          end_date?: string | null
          id?: string
          is_included?: boolean | null
          line_type?: string | null
          margin_percentage?: number | null
          percentage_fee?: number | null
          phase_code: string
          phase_description?: string | null
          phase_name: string
          pricing_mode?: string | null
          purchase_price?: number | null
          quantity?: number | null
          recurrence_months?: number | null
          skill_id?: string | null
          sort_order?: number | null
          start_date?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          assigned_member_id?: string | null
          assigned_skill?: string | null
          billing_type?: string | null
          created_at?: string | null
          deliverables?: Json | null
          document_id?: string
          end_date?: string | null
          id?: string
          is_included?: boolean | null
          line_type?: string | null
          margin_percentage?: number | null
          percentage_fee?: number | null
          phase_code?: string
          phase_description?: string | null
          phase_name?: string
          pricing_mode?: string | null
          purchase_price?: number | null
          quantity?: number | null
          recurrence_months?: number | null
          skill_id?: string | null
          sort_order?: number | null
          start_date?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_document_phases_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "commercial_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_document_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_id: string
          document_snapshot: Json
          id: string
          notes: string | null
          phases_snapshot: Json | null
          version_number: number
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_id: string
          document_snapshot: Json
          id?: string
          notes?: string | null
          phases_snapshot?: Json | null
          version_number?: number
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          document_snapshot?: Json
          id?: string
          notes?: string | null
          phases_snapshot?: Json | null
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "commercial_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_document_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_documents: {
        Row: {
          accepted_at: string | null
          billing_contact_id: string | null
          client_company_id: string | null
          client_contact_id: string | null
          construction_budget: number | null
          construction_budget_disclosed: boolean | null
          contract_type_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          deposit_percentage: number | null
          description: string | null
          document_number: string
          document_type: string
          expected_end_date: string | null
          expected_signature_date: string | null
          expected_start_date: string | null
          fee_mode: string
          fee_percentage: number | null
          footer_text: string | null
          general_conditions: string | null
          header_text: string | null
          hourly_rate: number | null
          id: string
          internal_owner_id: string | null
          invoice_schedule: Json | null
          is_amendment: boolean | null
          is_public_market: boolean | null
          market_reference: string | null
          notes: string | null
          payment_terms: string | null
          pdf_url: string | null
          postal_code: string | null
          project_address: string | null
          project_budget: number | null
          project_city: string | null
          project_id: string | null
          project_surface: number | null
          project_type: string | null
          quote_theme_id: string | null
          reference_client: string | null
          requires_deposit: boolean | null
          retention_guarantee_amount: number | null
          retention_guarantee_percentage: number | null
          sent_at: string | null
          signed_at: string | null
          signed_pdf_url: string | null
          special_conditions: string | null
          status: string
          title: string
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
          validity_days: number | null
          vat_rate: number | null
          vat_type: string | null
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          billing_contact_id?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          construction_budget?: number | null
          construction_budget_disclosed?: boolean | null
          contract_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_percentage?: number | null
          description?: string | null
          document_number: string
          document_type?: string
          expected_end_date?: string | null
          expected_signature_date?: string | null
          expected_start_date?: string | null
          fee_mode?: string
          fee_percentage?: number | null
          footer_text?: string | null
          general_conditions?: string | null
          header_text?: string | null
          hourly_rate?: number | null
          id?: string
          internal_owner_id?: string | null
          invoice_schedule?: Json | null
          is_amendment?: boolean | null
          is_public_market?: boolean | null
          market_reference?: string | null
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          postal_code?: string | null
          project_address?: string | null
          project_budget?: number | null
          project_city?: string | null
          project_id?: string | null
          project_surface?: number | null
          project_type?: string | null
          quote_theme_id?: string | null
          reference_client?: string | null
          requires_deposit?: boolean | null
          retention_guarantee_amount?: number | null
          retention_guarantee_percentage?: number | null
          sent_at?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          special_conditions?: string | null
          status?: string
          title: string
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          validity_days?: number | null
          vat_rate?: number | null
          vat_type?: string | null
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          billing_contact_id?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          construction_budget?: number | null
          construction_budget_disclosed?: boolean | null
          contract_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deposit_percentage?: number | null
          description?: string | null
          document_number?: string
          document_type?: string
          expected_end_date?: string | null
          expected_signature_date?: string | null
          expected_start_date?: string | null
          fee_mode?: string
          fee_percentage?: number | null
          footer_text?: string | null
          general_conditions?: string | null
          header_text?: string | null
          hourly_rate?: number | null
          id?: string
          internal_owner_id?: string | null
          invoice_schedule?: Json | null
          is_amendment?: boolean | null
          is_public_market?: boolean | null
          market_reference?: string | null
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          postal_code?: string | null
          project_address?: string | null
          project_budget?: number | null
          project_city?: string | null
          project_id?: string | null
          project_surface?: number | null
          project_type?: string | null
          quote_theme_id?: string | null
          reference_client?: string | null
          requires_deposit?: boolean | null
          retention_guarantee_amount?: number | null
          retention_guarantee_percentage?: number | null
          sent_at?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          special_conditions?: string | null
          status?: string
          title?: string
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
          validity_days?: number | null
          vat_rate?: number | null
          vat_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_documents_billing_contact_id_fkey"
            columns: ["billing_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_documents_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_documents_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_documents_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_documents_quote_theme_id_fkey"
            columns: ["quote_theme_id"]
            isOneToOne: false
            referencedRelation: "quote_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_reactions: {
        Row: {
          communication_id: string
          created_at: string | null
          emoji: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          communication_id: string
          created_at?: string | null
          emoji: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          communication_id?: string
          created_at?: string | null
          emoji?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_reactions_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_reactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          attachments: Json | null
          communication_type: string
          content: string
          content_html: string | null
          context_entity_id: string | null
          context_entity_type: string | null
          created_at: string | null
          created_by: string | null
          email_metadata: Json | null
          entity_id: string
          entity_type: string
          id: string
          is_pinned: boolean | null
          is_read: boolean | null
          mentions: string[] | null
          parent_id: string | null
          sent_via: string | null
          thread_id: string | null
          title: string | null
          updated_at: string | null
          workspace_email_account_id: string | null
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          communication_type: string
          content: string
          content_html?: string | null
          context_entity_id?: string | null
          context_entity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          email_metadata?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          sent_via?: string | null
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          workspace_email_account_id?: string | null
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          communication_type?: string
          content?: string
          content_html?: string | null
          context_entity_id?: string | null
          context_entity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          email_metadata?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          sent_via?: string | null
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          workspace_email_account_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_workspace_id_fkey"
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
      company_portal_links: {
        Row: {
          can_add_tasks: boolean | null
          can_view_contacts: boolean | null
          can_view_invoices: boolean | null
          can_view_projects: boolean | null
          can_view_quotes: boolean | null
          can_view_tasks: boolean | null
          can_view_time_entries: boolean | null
          company_id: string
          created_at: string | null
          created_by: string | null
          custom_slug: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          project_ids: string[] | null
          token: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          can_add_tasks?: boolean | null
          can_view_contacts?: boolean | null
          can_view_invoices?: boolean | null
          can_view_projects?: boolean | null
          can_view_quotes?: boolean | null
          can_view_tasks?: boolean | null
          can_view_time_entries?: boolean | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          custom_slug?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          project_ids?: string[] | null
          token: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          can_add_tasks?: boolean | null
          can_view_contacts?: boolean | null
          can_view_invoices?: boolean | null
          can_view_projects?: boolean | null
          can_view_quotes?: boolean | null
          can_view_tasks?: boolean | null
          can_view_time_entries?: boolean | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          custom_slug?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          project_ids?: string[] | null
          token?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_portal_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_portal_links_workspace_id_fkey"
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
      contract_types: {
        Row: {
          code: string
          created_at: string | null
          default_phases: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          default_phases?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          default_phases?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_types_workspace_id_fkey"
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
      dashboard_layouts: {
        Row: {
          created_at: string | null
          dashboard_type: string
          id: string
          layout: Json
          settings: Json | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          dashboard_type?: string
          id?: string
          layout?: Json
          settings?: Json | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          dashboard_type?: string
          id?: string
          layout?: Json
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_modules: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discipline_id: string
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discipline_id: string
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discipline_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipline_modules_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_modules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          sort_order?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          created_at: string | null
          created_by: string | null
          document_id: string
          document_type: string
          expires_at: string | null
          id: string
          reminder_sent_at: string | null
          signature_data: Json | null
          signature_ip: string | null
          signed_at: string | null
          signer_company: string | null
          signer_email: string | null
          signer_name: string | null
          status: string | null
          token: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          document_id: string
          document_type: string
          expires_at?: string | null
          id?: string
          reminder_sent_at?: string | null
          signature_data?: Json | null
          signature_ip?: string | null
          signed_at?: string | null
          signer_company?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string | null
          token?: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          document_type?: string
          expires_at?: string | null
          id?: string
          reminder_sent_at?: string | null
          signature_data?: Json | null
          signature_ip?: string | null
          signed_at?: string | null
          signer_company?: string | null
          signer_email?: string | null
          signer_name?: string | null
          status?: string | null
          token?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string | null
          content_html: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          variables: Json | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          variables?: Json | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          variables?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          document_types: string[] | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_types?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          steps?: Json
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_types?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_workflows_workspace_id_fkey"
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
      employee_contracts: {
        Row: {
          contract_type: string
          created_at: string | null
          created_by: string | null
          department: string | null
          end_date: string | null
          file_url: string | null
          id: string
          job_title: string | null
          manager_id: string | null
          metadata: Json | null
          notes: string | null
          salary_amount: number | null
          salary_type: string | null
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          weekly_hours: number | null
          workspace_id: string
        }
        Insert: {
          contract_type: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          end_date?: string | null
          file_url?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          metadata?: Json | null
          notes?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          weekly_hours?: number | null
          workspace_id: string
        }
        Update: {
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          end_date?: string | null
          file_url?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          metadata?: Json | null
          notes?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          weekly_hours?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_objectives: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          current_value: number | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string | null
          user_id: string
          weight: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
          weight?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
          weight?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_objectives_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          workspace_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          workspace_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          scale_max: number | null
          scale_min: number | null
          sort_order: number | null
          updated_at: string | null
          weight: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number | null
          updated_at?: string | null
          weight?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number | null
          updated_at?: string | null
          weight?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_panel_feedback: {
        Row: {
          acknowledged_at: string | null
          comments: string | null
          created_at: string | null
          criteria_scores: Json | null
          evaluated_user_id: string
          evaluator_id: string
          goals: string | null
          id: string
          improvements: string | null
          overall_score: number | null
          period_end: string
          period_start: string
          status: string | null
          strengths: string | null
          submitted_at: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          comments?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          evaluated_user_id: string
          evaluator_id: string
          goals?: string | null
          id?: string
          improvements?: string | null
          overall_score?: number | null
          period_end: string
          period_start: string
          status?: string | null
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          acknowledged_at?: string | null
          comments?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          evaluated_user_id?: string
          evaluator_id?: string
          goals?: string | null
          id?: string
          improvements?: string | null
          overall_score?: number | null
          period_end?: string
          period_start?: string
          status?: string | null
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_panel_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_entries: {
        Row: {
          browser_info: Json | null
          content: string
          created_at: string | null
          created_by: string | null
          feedback_type: string
          id: string
          page_url: string | null
          rating: number | null
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string | null
          title: string | null
          workspace_id: string
        }
        Insert: {
          browser_info?: Json | null
          content: string
          created_at?: string | null
          created_by?: string | null
          feedback_type?: string
          id?: string
          page_url?: string | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string | null
          title?: string | null
          workspace_id: string
        }
        Update: {
          browser_info?: Json | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          feedback_type?: string
          id?: string
          page_url?: string | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string | null
          title?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      french_holidays: {
        Row: {
          created_at: string | null
          holiday_date: string
          id: string
          is_regional: boolean | null
          is_worked: boolean | null
          name: string
          region: string | null
          workspace_id: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          holiday_date: string
          id?: string
          is_regional?: boolean | null
          is_worked?: boolean | null
          name: string
          region?: string | null
          workspace_id: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          holiday_date?: string
          id?: string
          is_regional?: boolean | null
          is_worked?: boolean | null
          name?: string
          region?: string | null
          workspace_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "french_holidays_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_connections: {
        Row: {
          access_token: string | null
          created_at: string | null
          gmail_email: string
          history_id: string | null
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          gmail_email: string
          history_id?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          gmail_email?: string
          history_id?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmail_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          phase_id: string | null
          quantity: number | null
          sort_order: number | null
          unit: string | null
          unit_price: number | null
          vat_rate: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          phase_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          unit_price?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          phase_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          unit_price?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference: string | null
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          bank_details: Json | null
          billing_profile_id: string | null
          cancelled_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          discount_amount: number | null
          discount_percentage: number | null
          document_id: string | null
          due_date: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          invoice_number: string
          invoice_type: string | null
          issue_date: string | null
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          payment_terms: string | null
          pdf_url: string | null
          project_id: string | null
          sent_at: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          total_ht: number | null
          total_ttc: number | null
          total_vat: number | null
          updated_at: string | null
          vat_rate: number | null
          workspace_id: string
        }
        Insert: {
          bank_details?: Json | null
          billing_profile_id?: string | null
          cancelled_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          document_id?: string | null
          due_date?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          invoice_number: string
          invoice_type?: string | null
          issue_date?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          workspace_id: string
        }
        Update: {
          bank_details?: Json | null
          billing_profile_id?: string | null
          cancelled_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          document_id?: string | null
          due_date?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string | null
          issue_date?: string | null
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_id?: string | null
          sent_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          total_ht?: number | null
          total_ttc?: number | null
          total_vat?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "commercial_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_email: string
          applicant_linkedin: string | null
          applicant_name: string
          applicant_phone: string | null
          cover_letter: string | null
          created_at: string | null
          id: string
          interview_notes: Json | null
          job_offer_id: string
          notes: string | null
          rating: number | null
          resume_url: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          applicant_email: string
          applicant_linkedin?: string | null
          applicant_name: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          interview_notes?: Json | null
          job_offer_id: string
          notes?: string | null
          rating?: number | null
          resume_url?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          applicant_email?: string
          applicant_linkedin?: string | null
          applicant_name?: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          interview_notes?: Json | null
          job_offer_id?: string
          notes?: string | null
          rating?: number | null
          resume_url?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          closes_at: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          employment_type: string | null
          experience_required: string | null
          hiring_manager_id: string | null
          id: string
          location: string | null
          published_at: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          skills_required: string[] | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string | null
          experience_required?: string | null
          hiring_manager_id?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          employment_type?: string | null
          experience_required?: string | null
          hiring_manager_id?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills_required?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_entries: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_public: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_public?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_entries_workspace_id_fkey"
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
      leave_balance_transactions: {
        Row: {
          absence_id: string | null
          amount: number
          balance_id: string
          created_at: string | null
          created_by: string | null
          id: string
          reason: string | null
          transaction_type: string
          workspace_id: string
        }
        Insert: {
          absence_id?: string | null
          amount: number
          balance_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          transaction_type: string
          workspace_id: string
        }
        Update: {
          absence_id?: string | null
          amount?: number
          balance_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          transaction_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_balance_transactions_absence_id_fkey"
            columns: ["absence_id"]
            isOneToOne: false
            referencedRelation: "team_absences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balance_transactions_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "leave_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balance_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          acquired: number
          created_at: string | null
          id: string
          initial_balance: number
          leave_type: Database["public"]["Enums"]["french_leave_type"]
          pending: number
          remaining: number | null
          taken: number
          updated_at: string | null
          user_id: string
          workspace_id: string
          year: number
        }
        Insert: {
          acquired?: number
          created_at?: string | null
          id?: string
          initial_balance?: number
          leave_type: Database["public"]["Enums"]["french_leave_type"]
          pending?: number
          remaining?: number | null
          taken?: number
          updated_at?: string | null
          user_id: string
          workspace_id: string
          year: number
        }
        Update: {
          acquired?: number
          created_at?: string | null
          id?: string
          initial_balance?: number
          leave_type?: Database["public"]["Enums"]["french_leave_type"]
          pending?: number
          remaining?: number | null
          taken?: number
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_type_config: {
        Row: {
          annual_allocation: number | null
          can_carry_over: boolean | null
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          leave_type: Database["public"]["Enums"]["french_leave_type"]
          max_carry_over_days: number | null
          min_notice_days: number | null
          requires_approval: boolean | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          annual_allocation?: number | null
          can_carry_over?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          leave_type: Database["public"]["Enums"]["french_leave_type"]
          max_carry_over_days?: number | null
          min_notice_days?: number | null
          requires_approval?: boolean | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          annual_allocation?: number | null
          can_carry_over?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          leave_type?: Database["public"]["Enums"]["french_leave_type"]
          max_carry_over_days?: number | null
          min_notice_days?: number | null
          requires_approval?: boolean | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_type_config_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_employment_info: {
        Row: {
          bank_name: string | null
          bic: string | null
          client_daily_rate: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_number: string | null
          employment_type: string | null
          iban: string | null
          id: string
          internal_cost_rate: number | null
          metadata: Json | null
          notes: string | null
          probation_end_date: string | null
          salary_annual: number | null
          salary_monthly: number | null
          updated_at: string | null
          user_id: string
          weekly_hours: number | null
          work_days: string[] | null
          workspace_id: string
        }
        Insert: {
          bank_name?: string | null
          bic?: string | null
          client_daily_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number?: string | null
          employment_type?: string | null
          iban?: string | null
          id?: string
          internal_cost_rate?: number | null
          metadata?: Json | null
          notes?: string | null
          probation_end_date?: string | null
          salary_annual?: number | null
          salary_monthly?: number | null
          updated_at?: string | null
          user_id: string
          weekly_hours?: number | null
          work_days?: string[] | null
          workspace_id: string
        }
        Update: {
          bank_name?: string | null
          bic?: string | null
          client_daily_rate?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_number?: string | null
          employment_type?: string | null
          iban?: string | null
          id?: string
          internal_cost_rate?: number | null
          metadata?: Json | null
          notes?: string | null
          probation_end_date?: string | null
          salary_annual?: number | null
          salary_monthly?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_hours?: number | null
          work_days?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_employment_info_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_rate_history: {
        Row: {
          change_type: string
          changed_by: string | null
          created_at: string | null
          effective_date: string
          id: string
          new_value: number | null
          old_value: number | null
          project_id: string | null
          reason: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          effective_date: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          project_id?: string | null
          reason?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          effective_date?: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          project_id?: string | null
          reason?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_rate_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_rate_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_skills: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          level: number | null
          notes: string | null
          skill_id: string
          updated_at: string | null
          user_id: string
          workspace_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          level?: number | null
          notes?: string | null
          skill_id: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          level?: number | null
          notes?: string | null
          skill_id?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_skills_workspace_id_fkey"
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
      payroll_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          end_date: string
          exported_at: string | null
          id: string
          notes: string | null
          period_name: string
          start_date: string
          status: Database["public"]["Enums"]["payroll_period_status"] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date: string
          exported_at?: string | null
          id?: string
          notes?: string | null
          period_name: string
          start_date: string
          status?: Database["public"]["Enums"]["payroll_period_status"] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date?: string
          exported_at?: string | null
          id?: string
          notes?: string | null
          period_name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["payroll_period_status"] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_variables: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          period_id: string
          updated_at: string | null
          user_id: string
          variable_type: string
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          period_id: string
          updated_at?: string | null
          user_id: string
          variable_type: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          period_id?: string
          updated_at?: string | null
          user_id?: string
          variable_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_variables_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_variables_workspace_id_fkey"
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
      plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          limits: Json | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      quote_themes: {
        Row: {
          accent_color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          font_family: string | null
          footer_style: Json | null
          header_font_family: string | null
          header_style: Json | null
          id: string
          is_default: boolean | null
          logo_position: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          show_page_numbers: boolean | null
          table_style: Json | null
          text_color: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          font_family?: string | null
          footer_style?: Json | null
          header_font_family?: string | null
          header_style?: Json | null
          id?: string
          is_default?: boolean | null
          logo_position?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          show_page_numbers?: boolean | null
          table_style?: Json | null
          text_color?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          font_family?: string | null
          footer_style?: Json | null
          header_font_family?: string | null
          header_style?: Json | null
          id?: string
          is_default?: boolean | null
          logo_position?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          show_page_numbers?: boolean | null
          table_style?: Json | null
          text_color?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_themes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_feedback: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          idea_id: string | null
          roadmap_item_id: string | null
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          idea_id?: string | null
          roadmap_item_id?: string | null
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          idea_id?: string | null
          roadmap_item_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_feedback_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "roadmap_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_feedback_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_ideas: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          promoted_to_item_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          votes_count: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          promoted_to_item_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          votes_count?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          promoted_to_item_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          votes_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_ideas_promoted_to_item_id_fkey"
            columns: ["promoted_to_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_ideas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          priority: string | null
          sort_order: number | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
          votes_count: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          sort_order?: number | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          votes_count?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          sort_order?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          votes_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_votes: {
        Row: {
          created_at: string | null
          id: string
          idea_id: string | null
          roadmap_item_id: string | null
          user_id: string
          vote_type: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idea_id?: string | null
          roadmap_item_id?: string | null
          user_id: string
          vote_type?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idea_id?: string | null
          roadmap_item_id?: string | null
          user_id?: string
          vote_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "roadmap_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_votes_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_votes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_workspace_id_fkey"
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
      team_absences: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          days_count: number
          end_date: string
          end_half_day: boolean | null
          file_url: string | null
          id: string
          leave_type: Database["public"]["Enums"]["french_leave_type"]
          notes: string | null
          reason: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          start_date: string
          start_half_day: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          days_count: number
          end_date: string
          end_half_day?: boolean | null
          file_url?: string | null
          id?: string
          leave_type: Database["public"]["Enums"]["french_leave_type"]
          notes?: string | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date: string
          start_half_day?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          days_count?: number
          end_date?: string
          end_half_day?: boolean | null
          file_url?: string | null
          id?: string
          leave_type?: Database["public"]["Enums"]["french_leave_type"]
          notes?: string | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          start_date?: string
          start_half_day?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_absences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          notifications_enabled: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      team_channels: {
        Row: {
          channel_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          name: string
          settings: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          channel_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          channel_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          attachments: Json | null
          channel_id: string
          content: string
          content_type: string | null
          created_at: string | null
          created_by: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_pinned: boolean | null
          mentions: string[] | null
          parent_id: string | null
          reactions: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          channel_id: string
          content: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          channel_id?: string
          content?: string
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          parent_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_time_entries: {
        Row: {
          budget_envelope_id: string | null
          created_at: string | null
          date: string
          description: string | null
          duration_minutes: number
          entry_type: string | null
          hourly_rate: number | null
          id: string
          is_billable: boolean | null
          project_id: string | null
          status: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string
          validated_at: string | null
          validated_by: string | null
          workspace_id: string
        }
        Insert: {
          budget_envelope_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          duration_minutes: number
          entry_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
          workspace_id: string
        }
        Update: {
          budget_envelope_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          duration_minutes?: number
          entry_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          status?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_time_entries_budget_envelope_id_fkey"
            columns: ["budget_envelope_id"]
            isOneToOne: false
            referencedRelation: "project_budget_envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_time_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_typing_indicators: {
        Row: {
          channel_id: string
          id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_typing_indicators_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_documents: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          due_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          name: string
          sort_order: number | null
          status: string | null
          tender_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          due_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          name: string
          sort_order?: number | null
          status?: string | null
          tender_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          due_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          status?: string | null
          tender_id?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_evaluation_criteria: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          our_score: number | null
          sort_order: number | null
          tender_id: string
          updated_at: string | null
          weight: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          our_score?: number | null
          sort_order?: number | null
          tender_id: string
          updated_at?: string | null
          weight?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          our_score?: number | null
          sort_order?: number | null
          tender_id?: string
          updated_at?: string | null
          weight?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_evaluation_criteria_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_evaluation_criteria_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_synthesis: {
        Row: {
          block_label: string | null
          block_type: string
          content: Json | null
          created_at: string | null
          id: string
          sort_order: number | null
          tender_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          block_label?: string | null
          block_type: string
          content?: Json | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          tender_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          block_label?: string | null
          block_type?: string
          content?: Json | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          tender_id?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_synthesis_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_synthesis_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_team: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          fee_percentage: number | null
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["tender_team_role"] | null
          sort_order: number | null
          specialty: string | null
          tender_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          fee_percentage?: number | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["tender_team_role"] | null
          sort_order?: number | null
          specialty?: string | null
          tender_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          fee_percentage?: number | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["tender_team_role"] | null
          sort_order?: number | null
          specialty?: string | null
          tender_id?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_team_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_team_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_team_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_team_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          city: string | null
          client_company_id: string | null
          client_contact_id: string | null
          construction_budget: number | null
          converted_project_id: string | null
          created_at: string | null
          created_by: string | null
          dce_url: string | null
          department: string | null
          description: string | null
          discipline_id: string | null
          estimated_end: string | null
          estimated_fee: number | null
          estimated_start: string | null
          fee_percentage: number | null
          id: string
          is_public_market: boolean | null
          lead_company_id: string | null
          location: string | null
          lost_at: string | null
          lost_reason: string | null
          no_go_date: string | null
          no_go_reason: string | null
          notes: string | null
          pipeline_status: Database["public"]["Enums"]["tender_status"] | null
          postal_code: string | null
          procedure_type: Database["public"]["Enums"]["procedure_type"] | null
          project_surface: number | null
          publication_date: string | null
          reference: string | null
          region: string | null
          response_deadline: string | null
          response_url: string | null
          source: string | null
          source_url: string | null
          submission_deadline: string | null
          tags: string[] | null
          team_role: Database["public"]["Enums"]["tender_team_role"] | null
          title: string
          updated_at: string | null
          won_at: string | null
          workspace_id: string
        }
        Insert: {
          city?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          construction_budget?: number | null
          converted_project_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dce_url?: string | null
          department?: string | null
          description?: string | null
          discipline_id?: string | null
          estimated_end?: string | null
          estimated_fee?: number | null
          estimated_start?: string | null
          fee_percentage?: number | null
          id?: string
          is_public_market?: boolean | null
          lead_company_id?: string | null
          location?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          no_go_date?: string | null
          no_go_reason?: string | null
          notes?: string | null
          pipeline_status?: Database["public"]["Enums"]["tender_status"] | null
          postal_code?: string | null
          procedure_type?: Database["public"]["Enums"]["procedure_type"] | null
          project_surface?: number | null
          publication_date?: string | null
          reference?: string | null
          region?: string | null
          response_deadline?: string | null
          response_url?: string | null
          source?: string | null
          source_url?: string | null
          submission_deadline?: string | null
          tags?: string[] | null
          team_role?: Database["public"]["Enums"]["tender_team_role"] | null
          title: string
          updated_at?: string | null
          won_at?: string | null
          workspace_id: string
        }
        Update: {
          city?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          construction_budget?: number | null
          converted_project_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dce_url?: string | null
          department?: string | null
          description?: string | null
          discipline_id?: string | null
          estimated_end?: string | null
          estimated_fee?: number | null
          estimated_start?: string | null
          fee_percentage?: number | null
          id?: string
          is_public_market?: boolean | null
          lead_company_id?: string | null
          location?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          no_go_date?: string | null
          no_go_reason?: string | null
          notes?: string | null
          pipeline_status?: Database["public"]["Enums"]["tender_status"] | null
          postal_code?: string | null
          procedure_type?: Database["public"]["Enums"]["procedure_type"] | null
          project_surface?: number | null
          publication_date?: string | null
          reference?: string | null
          region?: string | null
          response_deadline?: string | null
          response_url?: string | null
          source?: string | null
          source_url?: string | null
          submission_deadline?: string | null
          tags?: string[] | null
          team_role?: Database["public"]["Enums"]["tender_team_role"] | null
          title?: string
          updated_at?: string | null
          won_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_lead_company_id_fkey"
            columns: ["lead_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_workspace_id_fkey"
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
      workspace_email_accounts: {
        Row: {
          access_token: string | null
          connected_by: string | null
          created_at: string | null
          gmail_email: string
          history_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          connected_by?: string | null
          created_at?: string | null
          gmail_email: string
          history_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          access_token?: string | null
          connected_by?: string | null
          created_at?: string | null
          gmail_email?: string
          history_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_email_accounts_workspace_id_fkey"
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
      calculate_working_days: {
        Args: {
          p_end_date: string
          p_end_half_day?: boolean
          p_start_date: string
          p_start_half_day?: boolean
          p_workspace_id: string
        }
        Returns: number
      }
      can_access_crm_data: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      can_view_element: {
        Args: {
          _element_created_by: string
          _element_visibility: Database["public"]["Enums"]["element_visibility"]
          _element_workspace_id: string
        }
        Returns: boolean
      }
      can_view_sensitive_contacts: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      generate_document_number: {
        Args: { doc_type: string; ws_id: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: { inv_type: string; ws_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_workspace_ids: { Args: { _user_id: string }; Returns: string[] }
      has_permission: {
        Args: {
          _permission_code: string
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
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
