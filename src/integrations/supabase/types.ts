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
          campaign_type: string
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
          status: string
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
          campaign_type?: string
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
          status?: string
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
          campaign_type?: string
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
          status?: string
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
      commercial_document_items: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string
          document_id: string
          id: string
          is_optional: boolean | null
          item_type: string
          phase_id: string | null
          quantity: number | null
          sort_order: number | null
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description: string
          document_id: string
          id?: string
          is_optional?: boolean | null
          item_type?: string
          phase_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string
          document_id?: string
          id?: string
          is_optional?: boolean | null
          item_type?: string
          phase_id?: string | null
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_document_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "commercial_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_document_items_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "commercial_document_phases"
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
          {
            foreignKeyName: "commercial_document_phases_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
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
          client_company_id: string | null
          client_contact_id: string | null
          construction_budget: number | null
          construction_budget_disclosed: boolean | null
          contract_type_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          document_number: string
          document_type: string
          fee_mode: string
          fee_percentage: number | null
          footer_text: string | null
          general_conditions: string | null
          header_text: string | null
          hourly_rate: number | null
          id: string
          notes: string | null
          payment_terms: string | null
          pdf_url: string | null
          project_address: string | null
          project_budget: number | null
          project_city: string | null
          project_id: string | null
          project_surface: number | null
          project_type: string
          quote_theme_id: string | null
          sent_at: string | null
          signed_at: string | null
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
          client_company_id?: string | null
          client_contact_id?: string | null
          construction_budget?: number | null
          construction_budget_disclosed?: boolean | null
          contract_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          document_number: string
          document_type?: string
          fee_mode?: string
          fee_percentage?: number | null
          footer_text?: string | null
          general_conditions?: string | null
          header_text?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_address?: string | null
          project_budget?: number | null
          project_city?: string | null
          project_id?: string | null
          project_surface?: number | null
          project_type?: string
          quote_theme_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
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
          client_company_id?: string | null
          client_contact_id?: string | null
          construction_budget?: number | null
          construction_budget_disclosed?: boolean | null
          contract_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          document_number?: string
          document_type?: string
          fee_mode?: string
          fee_percentage?: number | null
          footer_text?: string | null
          general_conditions?: string | null
          header_text?: string | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_address?: string | null
          project_budget?: number | null
          project_city?: string | null
          project_id?: string | null
          project_surface?: number | null
          project_type?: string
          quote_theme_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
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
      commercial_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_clauses: Json | null
          default_phases: Json | null
          document_type: string
          footer_text: string | null
          header_text: string | null
          id: string
          is_default: boolean | null
          name: string
          project_type: string
          terms_conditions: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_clauses?: Json | null
          default_phases?: Json | null
          document_type?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          project_type?: string
          terms_conditions?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_clauses?: Json | null
          default_phases?: Json | null
          document_type?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          project_type?: string
          terms_conditions?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_templates_workspace_id_fkey"
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
          created_at: string
          emoji: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          communication_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          communication_id?: string
          created_at?: string
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
          thread_id: string | null
          title: string | null
          updated_at: string | null
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
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
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
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
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
            foreignKeyName: "contact_pipeline_emails_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
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
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          entered_at: string | null
          id: string
          last_email_sent_at: string | null
          notes: string | null
          pipeline_id: string
          stage_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          entered_at?: string | null
          id?: string
          last_email_sent_at?: string | null
          notes?: string | null
          pipeline_id: string
          stage_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          entered_at?: string | null
          id?: string
          last_email_sent_at?: string | null
          notes?: string | null
          pipeline_id?: string
          stage_id?: string
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
          avatar_url: string | null
          contact_type: string | null
          created_at: string | null
          created_by: string | null
          crm_company_id: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          contact_type?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          contact_type?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
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
          builder_tabs: Json | null
          code: string
          color: string | null
          created_at: string | null
          default_clauses: Json | null
          default_fields: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          pdf_config: Json | null
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          builder_tabs?: Json | null
          code: string
          color?: string | null
          created_at?: string | null
          default_clauses?: Json | null
          default_fields?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          pdf_config?: Json | null
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          builder_tabs?: Json | null
          code?: string
          color?: string | null
          created_at?: string | null
          default_clauses?: Json | null
          default_fields?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          pdf_config?: Json | null
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
          bet_specialties: string[] | null
          billing_email: string | null
          capital_social: number | null
          city: string | null
          code_naf: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          forme_juridique: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          rcs_city: string | null
          siren: string | null
          siret: string | null
          updated_at: string | null
          vat_number: string | null
          vat_rate: number | null
          vat_type: string | null
          website: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          bet_specialties?: string[] | null
          billing_email?: string | null
          capital_social?: number | null
          city?: string | null
          code_naf?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          forme_juridique?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          rcs_city?: string | null
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          vat_type?: string | null
          website?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          bet_specialties?: string[] | null
          billing_email?: string | null
          capital_social?: number | null
          city?: string | null
          code_naf?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          forme_juridique?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          rcs_city?: string | null
          siren?: string | null
          siret?: string | null
          updated_at?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          vat_type?: string | null
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
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
          bcc: string[] | null
          body: string
          cc: string[] | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          direction: string | null
          from_email: string | null
          gmail_message_id: string | null
          gmail_thread_id: string | null
          id: string
          is_read: boolean | null
          labels: string[] | null
          lead_id: string | null
          opened_at: string | null
          project_id: string | null
          received_at: string | null
          reply_to_email_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          synced_from_gmail: boolean | null
          tender_id: string | null
          to_email: string
          workspace_id: string
        }
        Insert: {
          attachments?: Json | null
          bcc?: string[] | null
          body: string
          cc?: string[] | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          from_email?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          labels?: string[] | null
          lead_id?: string | null
          opened_at?: string | null
          project_id?: string | null
          received_at?: string | null
          reply_to_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          synced_from_gmail?: boolean | null
          tender_id?: string | null
          to_email: string
          workspace_id: string
        }
        Update: {
          attachments?: Json | null
          bcc?: string[] | null
          body?: string
          cc?: string[] | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          from_email?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          id?: string
          is_read?: boolean | null
          labels?: string[] | null
          lead_id?: string | null
          opened_at?: string | null
          project_id?: string | null
          received_at?: string | null
          reply_to_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          synced_from_gmail?: boolean | null
          tender_id?: string | null
          to_email?: string
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
            foreignKeyName: "crm_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_reply_to_email_id_fkey"
            columns: ["reply_to_email_id"]
            isOneToOne: false
            referencedRelation: "crm_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
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
          color: string | null
          created_at: string | null
          email_template_id: string | null
          id: string
          is_final_stage: boolean | null
          name: string
          pipeline_id: string
          probability: number | null
          requires_email_on_enter: boolean | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          email_template_id?: string | null
          id?: string
          is_final_stage?: boolean | null
          name: string
          pipeline_id: string
          probability?: number | null
          requires_email_on_enter?: boolean | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          email_template_id?: string | null
          id?: string
          is_final_stage?: boolean | null
          name?: string
          pipeline_id?: string
          probability?: number | null
          requires_email_on_enter?: boolean | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          pipeline_type: string | null
          sort_order: number | null
          target_contact_type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          pipeline_type?: string | null
          sort_order?: number | null
          target_contact_type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          pipeline_type?: string | null
          sort_order?: number | null
          target_contact_type?: string | null
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
      deliverable_email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          phase_type: string
          subject: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          phase_type: string
          subject: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          phase_type?: string
          subject?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_email_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      design_objects: {
        Row: {
          brand: string | null
          category_id: string | null
          colors: string[] | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          designer: string | null
          dimensions: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_favorite: boolean | null
          materials: string | null
          name: string
          notes: string | null
          price_max: number | null
          price_min: number | null
          source_name: string | null
          source_url: string | null
          tags: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          designer?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_favorite?: boolean | null
          materials?: string | null
          name: string
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          source_name?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          designer?: string | null
          dimensions?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_favorite?: boolean | null
          materials?: string | null
          name?: string
          notes?: string | null
          price_max?: number | null
          price_min?: number | null
          source_name?: string | null
          source_url?: string | null
          tags?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_objects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "object_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_objects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_modules: {
        Row: {
          created_at: string | null
          custom_description: string | null
          custom_name: string | null
          discipline_id: string
          id: string
          is_available: boolean | null
          is_default_enabled: boolean | null
          is_recommended: boolean | null
          module_key: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          custom_description?: string | null
          custom_name?: string | null
          discipline_id: string
          id?: string
          is_available?: boolean | null
          is_default_enabled?: boolean | null
          is_recommended?: boolean | null
          module_key: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          custom_description?: string | null
          custom_name?: string | null
          discipline_id?: string
          id?: string
          is_available?: boolean | null
          is_default_enabled?: boolean | null
          is_recommended?: boolean | null
          module_key?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_modules_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_approval_instances: {
        Row: {
          completed_at: string | null
          current_step: number | null
          document_id: string
          id: string
          started_at: string | null
          started_by: string
          status: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          document_id: string
          id?: string
          started_at?: string | null
          started_by: string
          status?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          document_id?: string
          id?: string
          started_at?: string | null
          started_by?: string
          status?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_approval_instances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "agency_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approval_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "document_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      document_approvals: {
        Row: {
          approved_at: string | null
          approver_id: string
          comment: string | null
          created_at: string | null
          id: string
          instance_id: string
          status: string | null
          step_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          instance_id: string
          status?: string | null
          step_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          instance_id?: string
          status?: string | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "document_approval_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "document_workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      document_expiration_reminders: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          is_read: boolean | null
          is_sent: boolean | null
          reminder_date: string
          reminder_type: string
          sent_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          reminder_date: string
          reminder_type: string
          sent_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          reminder_date?: string
          reminder_type?: string
          sent_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_expiration_reminders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "agency_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_expiration_reminders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signature_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          signature_id: string
          signer_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          signature_id: string
          signer_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          signature_id?: string
          signer_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signature_events_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "document_signatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signature_events_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "document_signers"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          completed_at: string | null
          created_at: string | null
          document_id: string
          expires_at: string | null
          id: string
          message: string | null
          requested_by: string
          signature_type: string
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          document_id: string
          expires_at?: string | null
          id?: string
          message?: string | null
          requested_by: string
          signature_type?: string
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          document_id?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          requested_by?: string
          signature_type?: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "agency_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signers: {
        Row: {
          created_at: string | null
          id: string
          sign_order: number | null
          signature_data: Json | null
          signature_id: string
          signature_image: string | null
          signed_at: string | null
          signer_email: string
          signer_name: string
          signer_role: string | null
          status: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          sign_order?: number | null
          signature_data?: Json | null
          signature_id: string
          signature_image?: string | null
          signed_at?: string | null
          signer_email: string
          signer_name: string
          signer_role?: string | null
          status?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          sign_order?: number | null
          signature_data?: Json | null
          signature_id?: string
          signature_image?: string | null
          signed_at?: string | null
          signer_email?: string
          signer_name?: string
          signer_role?: string | null
          status?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signers_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "document_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          body_template: string | null
          category: string
          content_schema: Json
          created_at: string | null
          created_by: string | null
          default_content: Json | null
          description: string | null
          document_type: string
          footer_html: string | null
          header_html: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          pdf_template: Json | null
          preview_image: string | null
          styles: Json | null
          updated_at: string | null
          variables: Json | null
          workspace_id: string
        }
        Insert: {
          body_template?: string | null
          category: string
          content_schema?: Json
          created_at?: string | null
          created_by?: string | null
          default_content?: Json | null
          description?: string | null
          document_type: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          pdf_template?: Json | null
          preview_image?: string | null
          styles?: Json | null
          updated_at?: string | null
          variables?: Json | null
          workspace_id: string
        }
        Update: {
          body_template?: string | null
          category?: string
          content_schema?: Json
          created_at?: string | null
          created_by?: string | null
          default_content?: Json | null
          description?: string | null
          document_type?: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          pdf_template?: Json | null
          preview_image?: string | null
          styles?: Json | null
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
      document_workflow_steps: {
        Row: {
          approver_role: string | null
          approver_type: string
          approver_user_id: string | null
          auto_approve_after_days: number | null
          created_at: string | null
          id: string
          is_required: boolean | null
          name: string
          step_order: number
          workflow_id: string
        }
        Insert: {
          approver_role?: string | null
          approver_type: string
          approver_user_id?: string | null
          auto_approve_after_days?: number | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          step_order: number
          workflow_id: string
        }
        Update: {
          approver_role?: string | null
          approver_type?: string
          approver_user_id?: string | null
          auto_approve_after_days?: number | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          step_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "document_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflows: {
        Row: {
          created_at: string | null
          description: string | null
          document_types: string[]
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_types: string[]
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_types?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
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
      documentation_categories: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
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
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
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
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documentation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_category_templates: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          discipline: string
          icon: string | null
          id: string
          name: string
          parent_slug: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          discipline: string
          icon?: string | null
          id?: string
          name: string
          parent_slug?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          discipline?: string
          icon?: string | null
          id?: string
          name?: string
          parent_slug?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      documentation_pages: {
        Row: {
          category_id: string | null
          checklist: Json | null
          content: string | null
          context: string | null
          created_at: string | null
          created_by: string | null
          emoji: string | null
          id: string
          is_published: boolean | null
          is_template: boolean | null
          last_edited_by: string | null
          objective: string | null
          page_type: string | null
          parent_page_id: string | null
          slug: string
          sort_order: number | null
          steps: Json | null
          tags: string[] | null
          tips: string | null
          title: string
          updated_at: string | null
          view_count: number | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          checklist?: Json | null
          content?: string | null
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          emoji?: string | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          last_edited_by?: string | null
          objective?: string | null
          page_type?: string | null
          parent_page_id?: string | null
          slug: string
          sort_order?: number | null
          steps?: Json | null
          tags?: string[] | null
          tips?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          checklist?: Json | null
          content?: string | null
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          emoji?: string | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          last_edited_by?: string | null
          objective?: string | null
          page_type?: string | null
          parent_page_id?: string | null
          slug?: string
          sort_order?: number | null
          steps?: Json | null
          tags?: string[] | null
          tips?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_pages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "documentation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_pages_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "documentation_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_templates: {
        Row: {
          category_slug: string
          checklist: Json | null
          content: string | null
          context: string | null
          created_at: string | null
          discipline: string
          emoji: string | null
          id: string
          objective: string | null
          page_slug: string
          page_type: string | null
          sort_order: number | null
          steps: Json | null
          tags: string[] | null
          tips: string | null
          title: string
        }
        Insert: {
          category_slug: string
          checklist?: Json | null
          content?: string | null
          context?: string | null
          created_at?: string | null
          discipline: string
          emoji?: string | null
          id?: string
          objective?: string | null
          page_slug: string
          page_type?: string | null
          sort_order?: number | null
          steps?: Json | null
          tags?: string[] | null
          tips?: string | null
          title: string
        }
        Update: {
          category_slug?: string
          checklist?: Json | null
          content?: string | null
          context?: string | null
          created_at?: string | null
          discipline?: string
          emoji?: string | null
          id?: string
          objective?: string | null
          page_slug?: string
          page_type?: string | null
          sort_order?: number | null
          steps?: Json | null
          tags?: string[] | null
          tips?: string | null
          title?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string | null
          variables: Json | null
          workspace_id: string
        }
        Insert: {
          body_html: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
          workspace_id: string
        }
        Update: {
          body_html?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
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
      entity_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
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
      feedback_entries: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          feedback_type: string | null
          id: string
          is_resolved: boolean | null
          route_path: string
          status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          feedback_type?: string | null
          id?: string
          is_resolved?: boolean | null
          route_path: string
          status?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          feedback_type?: string | null
          id?: string
          is_resolved?: boolean | null
          route_path?: string
          status?: string | null
          updated_at?: string
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
      gmail_connections: {
        Row: {
          access_token: string | null
          created_at: string
          gmail_email: string
          history_id: number | null
          id: string
          is_active: boolean | null
          refresh_token: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
          watch_expiration: string | null
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          gmail_email: string
          history_id?: number | null
          id?: string
          is_active?: boolean | null
          refresh_token: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          watch_expiration?: string | null
          workspace_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          gmail_email?: string
          history_id?: number | null
          id?: string
          is_active?: boolean | null
          refresh_token?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          watch_expiration?: string | null
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
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount_ht: number
          amount_ttc: number
          amount_tva: number | null
          code: string | null
          created_at: string | null
          description: string
          detailed_description: string | null
          discount_percentage: number | null
          id: string
          invoice_id: string
          item_type: string | null
          percentage_completed: number | null
          phase_id: string | null
          phase_name: string | null
          quantity: number | null
          sort_order: number | null
          tva_rate: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          amount_ht: number
          amount_ttc: number
          amount_tva?: number | null
          code?: string | null
          created_at?: string | null
          description: string
          detailed_description?: string | null
          discount_percentage?: number | null
          id?: string
          invoice_id: string
          item_type?: string | null
          percentage_completed?: number | null
          phase_id?: string | null
          phase_name?: string | null
          quantity?: number | null
          sort_order?: number | null
          tva_rate?: number | null
          unit?: string | null
          unit_price: number
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          amount_tva?: number | null
          code?: string | null
          created_at?: string | null
          description?: string
          detailed_description?: string | null
          discount_percentage?: number | null
          id?: string
          invoice_id?: string
          item_type?: string | null
          percentage_completed?: number | null
          phase_id?: string | null
          phase_name?: string | null
          quantity?: number | null
          sort_order?: number | null
          tva_rate?: number | null
          unit?: string | null
          unit_price?: number
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
          payment_date: string
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
      invoice_reminders: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          invoice_id: string
          reminder_type: string
          scheduled_date: string
          sent_at: string | null
          subject: string | null
          workspace_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          invoice_id: string
          reminder_type: string
          scheduled_date: string
          sent_at?: string | null
          subject?: string | null
          workspace_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          reminder_type?: string
          scheduled_date?: string
          sent_at?: string | null
          subject?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_reminders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          bank_bic: string | null
          bank_iban: string | null
          bank_name: string | null
          chorus_pro_enabled: boolean | null
          chorus_pro_engagement_number: string | null
          chorus_pro_response: Json | null
          chorus_pro_service_code: string | null
          chorus_pro_status: string | null
          chorus_pro_submission_date: string | null
          client_address: string | null
          client_city: string | null
          client_company_id: string | null
          client_contact_id: string | null
          client_country: string | null
          client_name: string | null
          client_postal_code: string | null
          client_siret: string | null
          client_vat_number: string | null
          commercial_document_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          invoice_type: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_terms: string | null
          pdf_url: string | null
          project_id: string | null
          project_name: string | null
          project_reference: string | null
          sent_at: string | null
          status: string
          subtotal_ht: number | null
          total_ttc: number | null
          tva_amount: number | null
          tva_rate: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          chorus_pro_enabled?: boolean | null
          chorus_pro_engagement_number?: string | null
          chorus_pro_response?: Json | null
          chorus_pro_service_code?: string | null
          chorus_pro_status?: string | null
          chorus_pro_submission_date?: string | null
          client_address?: string | null
          client_city?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          client_country?: string | null
          client_name?: string | null
          client_postal_code?: string | null
          client_siret?: string | null
          client_vat_number?: string | null
          commercial_document_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          invoice_type?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_id?: string | null
          project_name?: string | null
          project_reference?: string | null
          sent_at?: string | null
          status?: string
          subtotal_ht?: number | null
          total_ttc?: number | null
          tva_amount?: number | null
          tva_rate?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          chorus_pro_enabled?: boolean | null
          chorus_pro_engagement_number?: string | null
          chorus_pro_response?: Json | null
          chorus_pro_service_code?: string | null
          chorus_pro_status?: string | null
          chorus_pro_submission_date?: string | null
          client_address?: string | null
          client_city?: string | null
          client_company_id?: string | null
          client_contact_id?: string | null
          client_country?: string | null
          client_name?: string | null
          client_postal_code?: string | null
          client_siret?: string | null
          client_vat_number?: string | null
          commercial_document_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          project_id?: string | null
          project_name?: string | null
          project_reference?: string | null
          sent_at?: string | null
          status?: string
          subtotal_ht?: number | null
          total_ttc?: number | null
          tva_amount?: number | null
          tva_rate?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_commercial_document_id_fkey"
            columns: ["commercial_document_id"]
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
          candidate_email: string
          candidate_name: string
          candidate_phone: string | null
          cover_letter: string | null
          created_at: string
          cv_url: string | null
          id: string
          interview_date: string | null
          job_offer_id: string
          linkedin_url: string | null
          notes: string | null
          portfolio_url: string | null
          rating: number | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          candidate_email: string
          candidate_name: string
          candidate_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          id?: string
          interview_date?: string | null
          job_offer_id: string
          linkedin_url?: string | null
          notes?: string | null
          portfolio_url?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          candidate_email?: string
          candidate_name?: string
          candidate_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          id?: string
          interview_date?: string | null
          job_offer_id?: string
          linkedin_url?: string | null
          notes?: string | null
          portfolio_url?: string | null
          rating?: number | null
          status?: string
          updated_at?: string
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
          contract_type: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          location: string | null
          published_at: string | null
          remote_policy: string | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          closes_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          remote_policy?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          closes_at?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          remote_policy?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          updated_at?: string
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
          project_types: string[] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          usage_count: number | null
          workspace_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_types?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
          workspace_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_types?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
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
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_completed: boolean | null
          lead_id: string | null
          meeting_link: string | null
          outcome: string | null
          scheduled_at: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          meeting_link?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          meeting_link?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
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
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          crm_company_id: string | null
          description: string | null
          estimated_value: number | null
          id: string
          lost_at: string | null
          lost_reason: string | null
          next_action: string | null
          next_action_date: string | null
          pipeline_id: string | null
          probability: number | null
          project_id: string | null
          source: string | null
          stage_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          won_at: string | null
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          next_action?: string | null
          next_action_date?: string | null
          pipeline_id?: string | null
          probability?: number | null
          project_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          won_at?: string | null
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          next_action?: string | null
          next_action_date?: string | null
          pipeline_id?: string | null
          probability?: number | null
          project_id?: string | null
          source?: string | null
          stage_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          won_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
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
      material_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category_id: string | null
          certifications: string[] | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          documents: string[] | null
          id: string
          images: string[] | null
          is_archived: boolean | null
          is_favorite: boolean | null
          last_used_at: string | null
          lead_time_days: number | null
          manufacturer: string | null
          min_order_quantity: number | null
          name: string
          price_currency: string | null
          price_unit: number | null
          reference: string | null
          specifications: Json | null
          supplier_id: string | null
          supplier_name: string | null
          sustainability_score: number | null
          tags: string[] | null
          unit: string | null
          updated_at: string | null
          weight: number | null
          weight_unit: string | null
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          documents?: string[] | null
          id?: string
          images?: string[] | null
          is_archived?: boolean | null
          is_favorite?: boolean | null
          last_used_at?: string | null
          lead_time_days?: number | null
          manufacturer?: string | null
          min_order_quantity?: number | null
          name: string
          price_currency?: string | null
          price_unit?: number | null
          reference?: string | null
          specifications?: Json | null
          supplier_id?: string | null
          supplier_name?: string | null
          sustainability_score?: number | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          certifications?: string[] | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          documents?: string[] | null
          id?: string
          images?: string[] | null
          is_archived?: boolean | null
          is_favorite?: boolean | null
          last_used_at?: string | null
          lead_time_days?: number | null
          manufacturer?: string | null
          min_order_quantity?: number | null
          name?: string
          price_currency?: string | null
          price_unit?: number | null
          reference?: string | null
          specifications?: Json | null
          supplier_id?: string | null
          supplier_name?: string | null
          sustainability_score?: number | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_channels: {
        Row: {
          channel_type: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          platform: string | null
          workspace_id: string
        }
        Insert: {
          channel_type: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform?: string | null
          workspace_id: string
        }
        Update: {
          channel_type?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_plan_items: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          attachments: Json | null
          budget: number | null
          campaign_id: string
          channel_id: string | null
          content_brief: string | null
          content_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          format: string | null
          id: string
          performance_data: Json | null
          publish_date: string
          publish_time: string | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          budget?: number | null
          campaign_id: string
          channel_id?: string | null
          content_brief?: string | null
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          format?: string | null
          id?: string
          performance_data?: Json | null
          publish_date: string
          publish_time?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          budget?: number | null
          campaign_id?: string
          channel_id?: string | null
          content_brief?: string | null
          content_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          format?: string | null
          id?: string
          performance_data?: Json | null
          publish_date?: string
          publish_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_plan_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_plan_items_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "media_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_plan_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attention_items: {
        Row: {
          assignee_company_ids: string[] | null
          assignee_lot_ids: string[] | null
          assignee_names: string[] | null
          assignee_type: string
          comment: string | null
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          meeting_id: string
          progress: number
          stakeholder_type: string
          updated_at: string | null
          urgency: string
          workspace_id: string
        }
        Insert: {
          assignee_company_ids?: string[] | null
          assignee_lot_ids?: string[] | null
          assignee_names?: string[] | null
          assignee_type?: string
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          meeting_id: string
          progress?: number
          stakeholder_type?: string
          updated_at?: string | null
          urgency?: string
          workspace_id: string
        }
        Update: {
          assignee_company_ids?: string[] | null
          assignee_lot_ids?: string[] | null
          assignee_names?: string[] | null
          assignee_type?: string
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          meeting_id?: string
          progress?: number
          stakeholder_type?: string
          updated_at?: string | null
          urgency?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attention_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "project_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attention_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_report_versions: {
        Row: {
          attendees: Json | null
          created_at: string
          created_by: string | null
          id: string
          meeting_id: string
          notes: string | null
          version_number: number
          workspace_id: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id: string
          notes?: string | null
          version_number?: number
          workspace_id: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id?: string
          notes?: string | null
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_report_versions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "project_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_report_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          meeting_id: string | null
          pdf_url: string | null
          project_id: string
          report_data: Json | null
          report_date: string
          report_number: number | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_id?: string | null
          pdf_url?: string | null
          project_id: string
          report_data?: Json | null
          report_date?: string
          report_number?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          meeting_id?: string | null
          pdf_url?: string | null
          project_id?: string
          report_data?: Json | null
          report_date?: string
          report_number?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_reports_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "project_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      member_employment_info: {
        Row: {
          client_daily_rate: number | null
          contract_type: string | null
          created_at: string | null
          end_date: string | null
          id: string
          notes: string | null
          salary_monthly: number | null
          start_date: string | null
          trial_end_date: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          client_daily_rate?: number | null
          contract_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          salary_monthly?: number | null
          start_date?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          client_daily_rate?: number | null
          contract_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          salary_monthly?: number | null
          start_date?: string | null
          trial_end_date?: string | null
          updated_at?: string | null
          user_id?: string
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
          created_at: string
          effective_date: string
          id: string
          new_value: number | null
          notes: string | null
          old_value: number | null
          project_id: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          change_type: string
          changed_by?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          new_value?: number | null
          notes?: string | null
          old_value?: number | null
          project_id?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          new_value?: number | null
          notes?: string | null
          old_value?: number | null
          project_id?: string | null
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
          created_at: string
          custom_daily_rate: number | null
          id: string
          proficiency_level: string | null
          skill_id: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          custom_daily_rate?: number | null
          id?: string
          proficiency_level?: string | null
          skill_id: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          custom_daily_rate?: number | null
          id?: string
          proficiency_level?: string | null
          skill_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "workspace_settings"
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
          features: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_core: boolean | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          required_plan: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          required_plan?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          required_plan?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
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
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          title: string
          type?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action_url?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
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
      object_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "object_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_milestones: {
        Row: {
          completed_date: string | null
          created_at: string | null
          description: string | null
          documents: string[] | null
          id: string
          notes: string | null
          permit_id: string
          sort_order: number | null
          status: string | null
          target_date: string | null
          title: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          notes?: string | null
          permit_id: string
          sort_order?: number | null
          status?: string | null
          target_date?: string | null
          title: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          notes?: string | null
          permit_id?: string
          sort_order?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "permit_milestones_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "project_permits"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_dependencies: {
        Row: {
          created_at: string | null
          depends_on_phase_id: string
          id: string
          lag_days: number | null
          phase_id: string
        }
        Insert: {
          created_at?: string | null
          depends_on_phase_id: string
          id?: string
          lag_days?: number | null
          phase_id: string
        }
        Update: {
          created_at?: string | null
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
          category: string
          code: string
          color: string | null
          created_at: string | null
          default_percentage: number | null
          deliverables: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          project_type: string
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          category?: string
          code: string
          color?: string | null
          created_at?: string | null
          default_percentage?: number | null
          deliverables?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_type?: string
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          category?: string
          code?: string
          color?: string | null
          created_at?: string | null
          default_percentage?: number | null
          deliverables?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_type?: string
          sort_order?: number | null
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
          action_type: string
          company_id: string | null
          completed_at: string | null
          completed_by: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          entry_id: string
          id: string
          priority: string | null
          reminder_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          action_type?: string
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entry_id: string
          id?: string
          priority?: string | null
          reminder_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          action_type?: string
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entry_id?: string
          id?: string
          priority?: string | null
          reminder_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_actions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_actions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "contact_pipeline_entries"
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
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_projects: number | null
          max_storage_gb: number | null
          max_users: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_projects?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_projects?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      pricing_grids: {
        Row: {
          billing_type: string | null
          contract_type_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          daily_rate: number | null
          description: string | null
          discipline_id: string | null
          experience_level: string | null
          grid_type: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          items: Json
          name: string
          skill_id: string | null
          sort_order: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          billing_type?: string | null
          contract_type_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          daily_rate?: number | null
          description?: string | null
          discipline_id?: string | null
          experience_level?: string | null
          grid_type?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name: string
          skill_id?: string | null
          sort_order?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          billing_type?: string | null
          contract_type_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          daily_rate?: number | null
          description?: string | null
          discipline_id?: string | null
          experience_level?: string | null
          grid_type?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name?: string
          skill_id?: string | null
          sort_order?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_grids_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_grids_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_grids_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_grids_workspace_id_fkey"
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
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
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
      project_calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          end_datetime: string | null
          event_type: string
          google_calendar_id: string | null
          google_event_id: string | null
          google_meet_link: string | null
          id: string
          is_all_day: boolean | null
          location: string | null
          parent_event_id: string | null
          project_id: string | null
          recurrence_end_date: string | null
          recurrence_rule: string | null
          start_datetime: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type?: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          parent_event_id?: string | null
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          start_datetime: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type?: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          parent_event_id?: string | null
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_calendar_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "project_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_calendar_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_deliverables: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          name: string
          phase_id: string | null
          project_id: string
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          name: string
          phase_id?: string | null
          project_id: string
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          name?: string
          phase_id?: string | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
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
          category: string | null
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
          project_id: string
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string | null
          visibility: Database["public"]["Enums"]["element_visibility"]
          workspace_id: string
        }
        Insert: {
          category?: string | null
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
          project_id: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url?: string | null
          visibility?: Database["public"]["Enums"]["element_visibility"]
          workspace_id: string
        }
        Update: {
          category?: string | null
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
          project_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string | null
          visibility?: Database["public"]["Enums"]["element_visibility"]
          workspace_id?: string
        }
        Relationships: [
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
      project_enabled_modules: {
        Row: {
          enabled_at: string
          enabled_by: string | null
          id: string
          module_key: string
          project_id: string
          workspace_id: string
        }
        Insert: {
          enabled_at?: string
          enabled_by?: string | null
          id?: string
          module_key: string
          project_id: string
          workspace_id: string
        }
        Update: {
          enabled_at?: string
          enabled_by?: string | null
          id?: string
          module_key?: string
          project_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_enabled_modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_enabled_modules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_insurances: {
        Row: {
          attestation_url: string | null
          broker_contact: string | null
          broker_name: string | null
          coverage_amount: number | null
          created_at: string | null
          custom_type: string | null
          deductible: number | null
          documents: string[] | null
          end_date: string | null
          id: string
          insurance_type: string
          insurer_contact: string | null
          insurer_email: string | null
          insurer_name: string
          insurer_phone: string | null
          notes: string | null
          policy_number: string | null
          premium: number | null
          premium_frequency: string | null
          project_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attestation_url?: string | null
          broker_contact?: string | null
          broker_name?: string | null
          coverage_amount?: number | null
          created_at?: string | null
          custom_type?: string | null
          deductible?: number | null
          documents?: string[] | null
          end_date?: string | null
          id?: string
          insurance_type: string
          insurer_contact?: string | null
          insurer_email?: string | null
          insurer_name: string
          insurer_phone?: string | null
          notes?: string | null
          policy_number?: string | null
          premium?: number | null
          premium_frequency?: string | null
          project_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          attestation_url?: string | null
          broker_contact?: string | null
          broker_name?: string | null
          coverage_amount?: number | null
          created_at?: string | null
          custom_type?: string | null
          deductible?: number | null
          documents?: string[] | null
          end_date?: string | null
          id?: string
          insurance_type?: string
          insurer_contact?: string | null
          insurer_email?: string | null
          insurer_name?: string
          insurer_phone?: string | null
          notes?: string | null
          policy_number?: string | null
          premium?: number | null
          premium_frequency?: string | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_insurances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_insurances_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_lot_interventions: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          lot_id: string
          notes: string | null
          project_id: string
          start_date: string
          status: string | null
          sub_row: number
          team_size: number | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          lot_id: string
          notes?: string | null
          project_id: string
          start_date: string
          status?: string | null
          sub_row?: number
          team_size?: number | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          lot_id?: string
          notes?: string | null
          project_id?: string
          start_date?: string
          status?: string | null
          sub_row?: number
          team_size?: number | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_lot_interventions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "project_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_lot_interventions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_lot_interventions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_lots: {
        Row: {
          budget: number | null
          color: string | null
          created_at: string | null
          crm_company_id: string | null
          end_date: string | null
          id: string
          name: string
          project_id: string
          sort_order: number | null
          start_date: string | null
          status: string | null
          sub_row_names: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          budget?: number | null
          color?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          end_date?: string | null
          id?: string
          name: string
          project_id: string
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          sub_row_names?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          budget?: number | null
          color?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          end_date?: string | null
          id?: string
          name?: string
          project_id?: string
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          sub_row_names?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_lots_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_lots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_lots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          created_at: string | null
          id: string
          location_notes: string | null
          material_id: string
          notes: string | null
          project_id: string
          quantity: number | null
          status: string | null
          supplier_quote: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_notes?: string | null
          material_id: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          status?: string | null
          supplier_quote?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location_notes?: string | null
          material_id?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          status?: string | null
          supplier_quote?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_meetings: {
        Row: {
          attendees: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_number: number | null
          notes: string | null
          pdf_url: string | null
          project_id: string
          report_data: Json | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_number?: number | null
          notes?: string | null
          pdf_url?: string | null
          project_id: string
          report_data?: Json | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_number?: number | null
          notes?: string | null
          pdf_url?: string | null
          project_id?: string
          report_data?: Json | null
          title?: string
          updated_at?: string | null
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
          id: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          client_daily_rate?: number | null
          created_at?: string | null
          id?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          client_daily_rate?: number | null
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
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
      project_moe_team: {
        Row: {
          contact_id: string | null
          created_at: string | null
          crm_company_id: string | null
          id: string
          is_lead: boolean | null
          notes: string | null
          project_id: string
          role: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          id?: string
          is_lead?: boolean | null
          notes?: string | null
          project_id: string
          role: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          id?: string
          is_lead?: boolean | null
          notes?: string | null
          project_id?: string
          role?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_moe_team_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_moe_team_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_moe_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_moe_team_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_objects: {
        Row: {
          actual_delivery_date: string | null
          added_by: string | null
          alert_days_before: number | null
          alert_enabled: boolean | null
          attachments: Json | null
          created_at: string
          currency: string | null
          expected_delivery_date: string | null
          id: string
          installation_date: string | null
          installed_by: string | null
          notes: string | null
          object_id: string
          order_date: string | null
          order_reference: string | null
          order_status: string | null
          price_total: number | null
          price_unit: number | null
          priority: string | null
          project_id: string
          quantity: number | null
          room: string | null
          status: string | null
          supplier_name: string | null
          supplier_url: string | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          added_by?: string | null
          alert_days_before?: number | null
          alert_enabled?: boolean | null
          attachments?: Json | null
          created_at?: string
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          installation_date?: string | null
          installed_by?: string | null
          notes?: string | null
          object_id: string
          order_date?: string | null
          order_reference?: string | null
          order_status?: string | null
          price_total?: number | null
          price_unit?: number | null
          priority?: string | null
          project_id: string
          quantity?: number | null
          room?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_url?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          added_by?: string | null
          alert_days_before?: number | null
          alert_enabled?: boolean | null
          attachments?: Json | null
          created_at?: string
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          installation_date?: string | null
          installed_by?: string | null
          notes?: string | null
          object_id?: string
          order_date?: string | null
          order_reference?: string | null
          order_status?: string | null
          price_total?: number | null
          price_unit?: number | null
          priority?: string | null
          project_id?: string
          quantity?: number | null
          room?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_url?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_objects_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "design_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_objects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_observations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          lot_id: string | null
          meeting_id: string | null
          photo_urls: string[] | null
          priority: string | null
          project_id: string
          resolved_at: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          lot_id?: string | null
          meeting_id?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          project_id: string
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          lot_id?: string | null
          meeting_id?: string | null
          photo_urls?: string[] | null
          priority?: string | null
          project_id?: string
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_observations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "project_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_observations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "project_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_observations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_permits: {
        Row: {
          acknowledgment_date: string | null
          actual_response_date: string | null
          authority_address: string | null
          authority_contact: string | null
          authority_email: string | null
          authority_name: string | null
          authority_phone: string | null
          conditions: string | null
          construction_type: string | null
          created_at: string | null
          custom_type: string | null
          documents: string[] | null
          expected_response_date: string | null
          granted_date: string | null
          id: string
          notes: string | null
          permit_type: string
          preparation_start_date: string | null
          prescriptions: string[] | null
          project_id: string
          reference_number: string | null
          reserves: string[] | null
          status: string | null
          submission_date: string | null
          surface_plancher: number | null
          updated_at: string | null
          validity_end_date: string | null
          work_start_deadline: string | null
          workspace_id: string
        }
        Insert: {
          acknowledgment_date?: string | null
          actual_response_date?: string | null
          authority_address?: string | null
          authority_contact?: string | null
          authority_email?: string | null
          authority_name?: string | null
          authority_phone?: string | null
          conditions?: string | null
          construction_type?: string | null
          created_at?: string | null
          custom_type?: string | null
          documents?: string[] | null
          expected_response_date?: string | null
          granted_date?: string | null
          id?: string
          notes?: string | null
          permit_type: string
          preparation_start_date?: string | null
          prescriptions?: string[] | null
          project_id: string
          reference_number?: string | null
          reserves?: string[] | null
          status?: string | null
          submission_date?: string | null
          surface_plancher?: number | null
          updated_at?: string | null
          validity_end_date?: string | null
          work_start_deadline?: string | null
          workspace_id: string
        }
        Update: {
          acknowledgment_date?: string | null
          actual_response_date?: string | null
          authority_address?: string | null
          authority_contact?: string | null
          authority_email?: string | null
          authority_name?: string | null
          authority_phone?: string | null
          conditions?: string | null
          construction_type?: string | null
          created_at?: string | null
          custom_type?: string | null
          documents?: string[] | null
          expected_response_date?: string | null
          granted_date?: string | null
          id?: string
          notes?: string | null
          permit_type?: string
          preparation_start_date?: string | null
          prescriptions?: string[] | null
          project_id?: string
          reference_number?: string | null
          reserves?: string[] | null
          status?: string | null
          submission_date?: string | null
          surface_plancher?: number | null
          updated_at?: string | null
          validity_end_date?: string | null
          work_start_deadline?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_permits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          color: string | null
          created_at: string | null
          deliverables: Json | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          percentage_fee: number | null
          phase_code: string | null
          project_id: string
          sort_order: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deliverables?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          percentage_fee?: number | null
          phase_code?: string | null
          project_id: string
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deliverables?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          percentage_fee?: number | null
          phase_code?: string | null
          project_id?: string
          sort_order?: number | null
          start_date?: string | null
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
      project_planning_versions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          snapshot: Json
          version_number: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          snapshot: Json
          version_number?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          snapshot?: Json
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_planning_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_planning_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_references: {
        Row: {
          awards: string[] | null
          budget_range: string | null
          building_type: string | null
          client_name: string | null
          client_type: string | null
          collaborators: string[] | null
          completion_date: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          location: string | null
          press_mentions: string[] | null
          project_id: string | null
          project_type: string | null
          slug: string | null
          sort_order: number | null
          surface_m2: number | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          awards?: string[] | null
          budget_range?: string | null
          building_type?: string | null
          client_name?: string | null
          client_type?: string | null
          collaborators?: string[] | null
          completion_date?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          location?: string | null
          press_mentions?: string[] | null
          project_id?: string | null
          project_type?: string | null
          slug?: string | null
          sort_order?: number | null
          surface_m2?: number | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          awards?: string[] | null
          budget_range?: string | null
          building_type?: string | null
          client_name?: string | null
          client_type?: string | null
          collaborators?: string[] | null
          completion_date?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          location?: string | null
          press_mentions?: string[] | null
          project_id?: string | null
          project_type?: string | null
          slug?: string | null
          sort_order?: number | null
          surface_m2?: number | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_references_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_references_workspace_id_fkey"
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
          ai_summary: string | null
          budget: number | null
          city: string | null
          client: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          crm_company_id: string | null
          current_phase_id: string | null
          description: string | null
          end_date: string | null
          fee_calculation: Json | null
          id: string
          is_archived: boolean | null
          is_internal: boolean
          lead_id: string | null
          name: string
          phase: string | null
          project_type: string | null
          start_date: string | null
          status: string | null
          surface_area: number | null
          surfaces: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          budget?: number | null
          city?: string | null
          client?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          current_phase_id?: string | null
          description?: string | null
          end_date?: string | null
          fee_calculation?: Json | null
          id?: string
          is_archived?: boolean | null
          is_internal?: boolean
          lead_id?: string | null
          name: string
          phase?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string | null
          surface_area?: number | null
          surfaces?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          budget?: number | null
          city?: string | null
          client?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          current_phase_id?: string | null
          description?: string | null
          end_date?: string | null
          fee_calculation?: Json | null
          id?: string
          is_archived?: boolean | null
          is_internal?: boolean
          lead_id?: string | null
          name?: string
          phase?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: string | null
          surface_area?: number | null
          surfaces?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      quick_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          status: string | null
          title: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title?: string
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
      quote_line_templates: {
        Row: {
          billing_type: string | null
          category: string | null
          contract_type_id: string | null
          created_at: string | null
          default_quantity: number | null
          default_unit: string | null
          default_unit_price: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          workspace_id: string
        }
        Insert: {
          billing_type?: string | null
          category?: string | null
          contract_type_id?: string | null
          created_at?: string | null
          default_quantity?: number | null
          default_unit?: string | null
          default_unit_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          workspace_id: string
        }
        Update: {
          billing_type?: string | null
          category?: string | null
          contract_type_id?: string | null
          created_at?: string | null
          default_quantity?: number | null
          default_unit?: string | null
          default_unit_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_templates_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_templates: {
        Row: {
          contract_type_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discipline_id: string | null
          id: string
          is_ai_generated: boolean | null
          is_default: boolean | null
          name: string
          phases: Json
          project_type: string
          sort_order: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contract_type_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_default?: boolean | null
          name: string
          phases?: Json
          project_type?: string
          sort_order?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contract_type_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discipline_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_default?: boolean | null
          name?: string
          phases?: Json
          project_type?: string
          sort_order?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_templates_contract_type_id_fkey"
            columns: ["contract_type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_templates_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_templates_workspace_id_fkey"
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
          ai_generated_css: string | null
          background_color: string | null
          body_font: string | null
          body_size: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          footer_style: string | null
          header_bg_color: string | null
          header_style: string | null
          heading_font: string | null
          heading_size: string | null
          id: string
          is_ai_generated: boolean | null
          is_default: boolean | null
          logo_position: string | null
          logo_size: string | null
          name: string
          primary_color: string | null
          reference_image_url: string | null
          secondary_color: string | null
          show_logo: boolean | null
          show_signature_area: boolean | null
          table_border_style: string | null
          table_header_bg: string | null
          table_stripe_rows: boolean | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          accent_color?: string | null
          ai_generated_css?: string | null
          background_color?: string | null
          body_font?: string | null
          body_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          footer_style?: string | null
          header_bg_color?: string | null
          header_style?: string | null
          heading_font?: string | null
          heading_size?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_default?: boolean | null
          logo_position?: string | null
          logo_size?: string | null
          name: string
          primary_color?: string | null
          reference_image_url?: string | null
          secondary_color?: string | null
          show_logo?: boolean | null
          show_signature_area?: boolean | null
          table_border_style?: string | null
          table_header_bg?: string | null
          table_stripe_rows?: boolean | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          accent_color?: string | null
          ai_generated_css?: string | null
          background_color?: string | null
          body_font?: string | null
          body_size?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          footer_style?: string | null
          header_bg_color?: string | null
          header_style?: string | null
          heading_font?: string | null
          heading_size?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_default?: boolean | null
          logo_position?: string | null
          logo_size?: string | null
          name?: string
          primary_color?: string | null
          reference_image_url?: string | null
          secondary_color?: string | null
          show_logo?: boolean | null
          show_signature_area?: boolean | null
          table_border_style?: string | null
          table_header_bg?: string | null
          table_stripe_rows?: boolean | null
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
      reference_images: {
        Row: {
          caption: string | null
          created_at: string | null
          credits: string | null
          id: string
          is_cover: boolean | null
          reference_id: string
          sort_order: number | null
          storage_path: string | null
          url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          credits?: string | null
          id?: string
          is_cover?: boolean | null
          reference_id: string
          sort_order?: number | null
          storage_path?: string | null
          url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          credits?: string | null
          id?: string
          is_cover?: boolean | null
          reference_id?: string
          sort_order?: number | null
          storage_path?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_images_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "project_references"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_team_members: {
        Row: {
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          crm_company_id: string | null
          id: string
          reference_id: string
          role: string
          sort_order: number | null
        }
        Insert: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          id?: string
          reference_id: string
          role: string
          sort_order?: number | null
        }
        Update: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          id?: string
          reference_id?: string
          role?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_team_members_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_team_members_reference_id_fkey"
            columns: ["reference_id"]
            isOneToOne: false
            referencedRelation: "project_references"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          discipline_id: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          discipline_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discipline_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
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
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          mentions: string[] | null
          parent_id: string | null
          task_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          mentions?: string[] | null
          parent_id?: string | null
          task_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
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
          depends_on_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_id_fkey"
            columns: ["depends_on_id"]
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
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          parent_id: string | null
          task_id: string
          title: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          parent_id?: string | null
          task_id: string
          title?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          parent_id?: string | null
          task_id?: string
          title?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_exchanges_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_exchanges"
            referencedColumns: ["id"]
          },
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
      task_schedules: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          end_datetime: string
          id: string
          is_locked: boolean | null
          notes: string | null
          start_datetime: string
          task_id: string
          updated_at: string | null
          user_id: string
          work_description: string | null
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          end_datetime: string
          id?: string
          is_locked?: boolean | null
          notes?: string | null
          start_datetime: string
          task_id: string
          updated_at?: string | null
          user_id: string
          work_description?: string | null
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          end_datetime?: string
          id?: string
          is_locked?: boolean | null
          notes?: string | null
          start_datetime?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
          work_description?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_schedules_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_schedules_workspace_id_fkey"
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
          ended_at: string | null
          id: string
          is_billable: boolean | null
          started_at: string | null
          task_id: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          duration_minutes: number
          ended_at?: string | null
          id?: string
          is_billable?: boolean | null
          started_at?: string | null
          task_id: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          is_billable?: boolean | null
          started_at?: string | null
          task_id?: string
          user_id?: string | null
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
          assigned_to: string[] | null
          brief: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          crm_company_id: string | null
          description: string | null
          due_date: string | null
          end_date: string | null
          estimated_hours: number | null
          id: string
          lead_id: string | null
          module: string | null
          parent_id: string | null
          priority: string | null
          project_id: string | null
          related_id: string | null
          related_type: string | null
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
          assigned_to?: string[] | null
          brief?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          lead_id?: string | null
          module?: string | null
          parent_id?: string | null
          priority?: string | null
          project_id?: string | null
          related_id?: string | null
          related_type?: string | null
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
          assigned_to?: string[] | null
          brief?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crm_company_id?: string | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          lead_id?: string | null
          module?: string | null
          parent_id?: string | null
          priority?: string | null
          project_id?: string | null
          related_id?: string | null
          related_type?: string | null
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
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
          absence_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          end_half_day: boolean | null
          id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          start_half_day: boolean | null
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          absence_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          end_half_day?: boolean | null
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          start_half_day?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          absence_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          end_half_day?: boolean | null
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          start_half_day?: boolean | null
          status?: string
          updated_at?: string
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
      team_evaluations: {
        Row: {
          completed_date: string | null
          created_at: string
          evaluation_type: string
          evaluator_id: string
          id: string
          notes: string | null
          objectives: Json | null
          rating: number | null
          scheduled_date: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          evaluation_type?: string
          evaluator_id: string
          id?: string
          notes?: string | null
          objectives?: Json | null
          rating?: number | null
          scheduled_date: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          evaluation_type?: string
          evaluator_id?: string
          id?: string
          notes?: string | null
          objectives?: Json | null
          rating?: number | null
          scheduled_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_evaluations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          request_type: string
          response: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          request_type?: string
          response?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          request_type?: string
          response?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_time_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          duration_minutes: number
          ended_at: string | null
          id: string
          is_billable: boolean | null
          project_id: string | null
          rejection_reason: string | null
          started_at: string | null
          status: string
          task_id: string | null
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          rejection_reason?: string | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
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
      teams: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_calendar_events: {
        Row: {
          attendees: Json | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          end_datetime: string | null
          event_type: string
          id: string
          location: string | null
          start_datetime: string
          tender_id: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attendees?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          event_type?: string
          id?: string
          location?: string | null
          start_datetime: string
          tender_id: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attendees?: Json | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          event_type?: string
          id?: string
          location?: string | null
          start_datetime?: string
          tender_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_calendar_events_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_calendar_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_criteria: {
        Row: {
          created_at: string | null
          criterion_name: string
          criterion_type: string | null
          id: string
          notes: string | null
          parent_criterion_id: string | null
          sub_criteria: Json | null
          tender_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          criterion_name: string
          criterion_type?: string | null
          id?: string
          notes?: string | null
          parent_criterion_id?: string | null
          sub_criteria?: Json | null
          tender_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          criterion_name?: string
          criterion_type?: string | null
          id?: string
          notes?: string | null
          parent_criterion_id?: string | null
          sub_criteria?: Json | null
          tender_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_criteria_parent_criterion_id_fkey"
            columns: ["parent_criterion_id"]
            isOneToOne: false
            referencedRelation: "tender_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_criteria_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_deliverables: {
        Row: {
          created_at: string | null
          deliverable_type: string | null
          description: string | null
          due_date: string | null
          file_urls: string[] | null
          id: string
          is_completed: boolean | null
          member_completion: Json | null
          name: string
          responsible_company_ids: string[] | null
          responsible_type: string | null
          sort_order: number | null
          tender_id: string
        }
        Insert: {
          created_at?: string | null
          deliverable_type?: string | null
          description?: string | null
          due_date?: string | null
          file_urls?: string[] | null
          id?: string
          is_completed?: boolean | null
          member_completion?: Json | null
          name: string
          responsible_company_ids?: string[] | null
          responsible_type?: string | null
          sort_order?: number | null
          tender_id: string
        }
        Update: {
          created_at?: string | null
          deliverable_type?: string | null
          description?: string | null
          due_date?: string | null
          file_urls?: string[] | null
          id?: string
          is_completed?: boolean | null
          member_completion?: Json | null
          name?: string
          responsible_company_ids?: string[] | null
          responsible_type?: string | null
          sort_order?: number | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_deliverables_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_documents: {
        Row: {
          analyzed_at: string | null
          document_type: string | null
          extracted_data: Json | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_analyzed: boolean | null
          tender_id: string
          uploaded_at: string | null
        }
        Insert: {
          analyzed_at?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_analyzed?: boolean | null
          tender_id: string
          uploaded_at?: string | null
        }
        Update: {
          analyzed_at?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_analyzed?: boolean | null
          tender_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_partner_candidates: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          fee_amount: number | null
          fee_percentage: number | null
          id: string
          invitation_body: string | null
          invitation_sent_at: string | null
          invitation_subject: string | null
          priority: number | null
          response_notes: string | null
          role: string
          specialty: string
          status: string
          tender_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          fee_amount?: number | null
          fee_percentage?: number | null
          id?: string
          invitation_body?: string | null
          invitation_sent_at?: string | null
          invitation_subject?: string | null
          priority?: number | null
          response_notes?: string | null
          role?: string
          specialty: string
          status?: string
          tender_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          fee_amount?: number | null
          fee_percentage?: number | null
          id?: string
          invitation_body?: string | null
          invitation_sent_at?: string | null
          invitation_subject?: string | null
          priority?: number | null
          response_notes?: string | null
          role?: string
          specialty?: string
          status?: string
          tender_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_partner_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_partner_candidates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_partner_candidates_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_partner_candidates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_partner_invitations: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          email_body: string | null
          email_subject: string | null
          id: string
          opened_at: string | null
          response: Database["public"]["Enums"]["invitation_response"] | null
          response_date: string | null
          response_notes: string | null
          role_needed: Database["public"]["Enums"]["tender_team_role"] | null
          sent_at: string | null
          specialty_needed: string | null
          tender_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          opened_at?: string | null
          response?: Database["public"]["Enums"]["invitation_response"] | null
          response_date?: string | null
          response_notes?: string | null
          role_needed?: Database["public"]["Enums"]["tender_team_role"] | null
          sent_at?: string | null
          specialty_needed?: string | null
          tender_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          id?: string
          opened_at?: string | null
          response?: Database["public"]["Enums"]["invitation_response"] | null
          response_date?: string | null
          response_notes?: string | null
          role_needed?: Database["public"]["Enums"]["tender_team_role"] | null
          sent_at?: string | null
          specialty_needed?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_partner_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_partner_invitations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_partner_invitations_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_required_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_category: string
          document_type: string
          file_url: string | null
          id: string
          is_completed: boolean | null
          is_mandatory: boolean | null
          name: string
          sort_order: number | null
          template_url: string | null
          tender_id: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_category?: string
          document_type: string
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          is_mandatory?: boolean | null
          name: string
          sort_order?: number | null
          template_url?: string | null
          tender_id: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_category?: string
          document_type?: string
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          is_mandatory?: boolean | null
          name?: string
          sort_order?: number | null
          template_url?: string | null
          tender_id?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_required_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_required_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_required_team: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_mandatory: boolean | null
          notes: string | null
          specialty: string
          tender_id: string
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          specialty: string
          tender_id: string
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          specialty?: string
          tender_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_required_team_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_required_team_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_required_team_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_requirements: {
        Row: {
          ai_confidence: number | null
          created_at: string | null
          description: string
          id: string
          is_mandatory: boolean | null
          requirement_type: string | null
          source_document_id: string | null
          specialty: string | null
          tender_id: string
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string | null
          description: string
          id?: string
          is_mandatory?: boolean | null
          requirement_type?: string | null
          source_document_id?: string | null
          specialty?: string | null
          tender_id: string
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string | null
          description?: string
          id?: string
          is_mandatory?: boolean | null
          requirement_type?: string | null
          source_document_id?: string | null
          specialty?: string | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_requirements_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "tender_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_requirements_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_team_members: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          fee_percentage: number | null
          id: string
          invited_at: string | null
          notes: string | null
          parent_member_id: string | null
          responded_at: string | null
          role: Database["public"]["Enums"]["tender_team_role"] | null
          specialty: string | null
          status: Database["public"]["Enums"]["invitation_response"] | null
          tender_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          fee_percentage?: number | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          parent_member_id?: string | null
          responded_at?: string | null
          role?: Database["public"]["Enums"]["tender_team_role"] | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["invitation_response"] | null
          tender_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          fee_percentage?: number | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          parent_member_id?: string | null
          responded_at?: string | null
          role?: Database["public"]["Enums"]["tender_team_role"] | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["invitation_response"] | null
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_team_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_team_members_parent_member_id_fkey"
            columns: ["parent_member_id"]
            isOneToOne: false
            referencedRelation: "tender_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_team_members_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_technical_sections: {
        Row: {
          ai_generated: boolean | null
          ai_source_documents: string[] | null
          content: string | null
          created_at: string | null
          id: string
          last_edited_at: string | null
          last_edited_by: string | null
          section_type: string | null
          sort_order: number | null
          tender_id: string
          title: string
        }
        Insert: {
          ai_generated?: boolean | null
          ai_source_documents?: string[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_edited_at?: string | null
          last_edited_by?: string | null
          section_type?: string | null
          sort_order?: number | null
          tender_id: string
          title: string
        }
        Update: {
          ai_generated?: boolean | null
          ai_source_documents?: string[] | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_edited_at?: string | null
          last_edited_by?: string | null
          section_type?: string | null
          sort_order?: number | null
          tender_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_technical_sections_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          allows_joint_venture: boolean | null
          allows_negotiation: boolean | null
          allows_variants: boolean | null
          budget_disclosed: boolean | null
          client_address: string | null
          client_contact_email: string | null
          client_contact_name: string | null
          client_contact_phone: string | null
          client_direction: string | null
          client_name: string | null
          client_type: string | null
          consultation_number: string | null
          contracting_authority: string | null
          created_at: string | null
          created_by: string | null
          dce_delivery_deadline: string | null
          dce_delivery_duration_months: number | null
          dce_link: string | null
          description: string | null
          discipline_slug: string | null
          estimated_budget: number | null
          go_decision_by: string | null
          go_decision_date: string | null
          go_decision_notes: string | null
          group_code: string | null
          id: string
          joint_venture_type: string | null
          jury_date: string | null
          lead_id: string | null
          location: string | null
          mandataire_must_be_solidary: boolean | null
          market_object: string | null
          moa_company_id: string | null
          negotiation_candidates_count: number | null
          negotiation_method: string | null
          offer_validity_days: number | null
          pipeline_status: string | null
          procedure_other: string | null
          procedure_type: Database["public"]["Enums"]["procedure_type"] | null
          project_id: string | null
          questions_deadline_days: number | null
          reference: string
          region: string | null
          required_team: Json | null
          results_date: string | null
          site_visit_assigned_user_id: string | null
          site_visit_assigned_users: string[] | null
          site_visit_contact_email: string | null
          site_visit_contact_name: string | null
          site_visit_contact_phone: string | null
          site_visit_date: string | null
          site_visit_required: boolean | null
          site_visit_secondary_contact: Json | null
          source_contact_email: string | null
          source_platform: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["tender_status"] | null
          submission_deadline: string | null
          submission_type: string | null
          surface_area: number | null
          tender_type: string | null
          title: string
          updated_at: string | null
          work_nature_tags: string[] | null
          workspace_id: string
        }
        Insert: {
          allows_joint_venture?: boolean | null
          allows_negotiation?: boolean | null
          allows_variants?: boolean | null
          budget_disclosed?: boolean | null
          client_address?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          client_direction?: string | null
          client_name?: string | null
          client_type?: string | null
          consultation_number?: string | null
          contracting_authority?: string | null
          created_at?: string | null
          created_by?: string | null
          dce_delivery_deadline?: string | null
          dce_delivery_duration_months?: number | null
          dce_link?: string | null
          description?: string | null
          discipline_slug?: string | null
          estimated_budget?: number | null
          go_decision_by?: string | null
          go_decision_date?: string | null
          go_decision_notes?: string | null
          group_code?: string | null
          id?: string
          joint_venture_type?: string | null
          jury_date?: string | null
          lead_id?: string | null
          location?: string | null
          mandataire_must_be_solidary?: boolean | null
          market_object?: string | null
          moa_company_id?: string | null
          negotiation_candidates_count?: number | null
          negotiation_method?: string | null
          offer_validity_days?: number | null
          pipeline_status?: string | null
          procedure_other?: string | null
          procedure_type?: Database["public"]["Enums"]["procedure_type"] | null
          project_id?: string | null
          questions_deadline_days?: number | null
          reference: string
          region?: string | null
          required_team?: Json | null
          results_date?: string | null
          site_visit_assigned_user_id?: string | null
          site_visit_assigned_users?: string[] | null
          site_visit_contact_email?: string | null
          site_visit_contact_name?: string | null
          site_visit_contact_phone?: string | null
          site_visit_date?: string | null
          site_visit_required?: boolean | null
          site_visit_secondary_contact?: Json | null
          source_contact_email?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["tender_status"] | null
          submission_deadline?: string | null
          submission_type?: string | null
          surface_area?: number | null
          tender_type?: string | null
          title: string
          updated_at?: string | null
          work_nature_tags?: string[] | null
          workspace_id: string
        }
        Update: {
          allows_joint_venture?: boolean | null
          allows_negotiation?: boolean | null
          allows_variants?: boolean | null
          budget_disclosed?: boolean | null
          client_address?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          client_direction?: string | null
          client_name?: string | null
          client_type?: string | null
          consultation_number?: string | null
          contracting_authority?: string | null
          created_at?: string | null
          created_by?: string | null
          dce_delivery_deadline?: string | null
          dce_delivery_duration_months?: number | null
          dce_link?: string | null
          description?: string | null
          discipline_slug?: string | null
          estimated_budget?: number | null
          go_decision_by?: string | null
          go_decision_date?: string | null
          go_decision_notes?: string | null
          group_code?: string | null
          id?: string
          joint_venture_type?: string | null
          jury_date?: string | null
          lead_id?: string | null
          location?: string | null
          mandataire_must_be_solidary?: boolean | null
          market_object?: string | null
          moa_company_id?: string | null
          negotiation_candidates_count?: number | null
          negotiation_method?: string | null
          offer_validity_days?: number | null
          pipeline_status?: string | null
          procedure_other?: string | null
          procedure_type?: Database["public"]["Enums"]["procedure_type"] | null
          project_id?: string | null
          questions_deadline_days?: number | null
          reference?: string
          region?: string | null
          required_team?: Json | null
          results_date?: string | null
          site_visit_assigned_user_id?: string | null
          site_visit_assigned_users?: string[] | null
          site_visit_contact_email?: string | null
          site_visit_contact_name?: string | null
          site_visit_contact_phone?: string | null
          site_visit_date?: string | null
          site_visit_required?: boolean | null
          site_visit_secondary_contact?: Json | null
          source_contact_email?: string | null
          source_platform?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["tender_status"] | null
          submission_deadline?: string | null
          submission_type?: string | null
          surface_area?: number | null
          tender_type?: string | null
          title?: string
          updated_at?: string | null
          work_nature_tags?: string[] | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_moa_company_id_fkey"
            columns: ["moa_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      workspace_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
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
          created_at: string
          id: string
          is_hidden: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
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
      workspace_modules: {
        Row: {
          enabled_at: string | null
          enabled_by: string | null
          id: string
          module_id: string
          settings: Json | null
          workspace_id: string
        }
        Insert: {
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id: string
          settings?: Json | null
          workspace_id: string
        }
        Update: {
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id?: string
          settings?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_modules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          sort_order: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_type: string
          setting_value?: Json
          sort_order?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          sort_order?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_subscriptions: {
        Row: {
          billing_period: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          billing_period?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          billing_period?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          accent_color: string | null
          address: string | null
          capital_social: number | null
          city: string | null
          code_naf: string | null
          created_at: string
          created_by: string | null
          daily_rate: number | null
          discipline_id: string | null
          email: string | null
          footer_text: string | null
          forme_juridique: string | null
          header_style: Json | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string
          postal_code: string | null
          primary_color: string | null
          rcs_city: string | null
          secondary_color: string | null
          signature_url: string | null
          siren: string | null
          siret: string | null
          slug: string
          style_settings: Json | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          capital_social?: number | null
          city?: string | null
          code_naf?: string | null
          created_at?: string
          created_by?: string | null
          daily_rate?: number | null
          discipline_id?: string | null
          email?: string | null
          footer_text?: string | null
          forme_juridique?: string | null
          header_style?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string
          postal_code?: string | null
          primary_color?: string | null
          rcs_city?: string | null
          secondary_color?: string | null
          signature_url?: string | null
          siren?: string | null
          siret?: string | null
          slug: string
          style_settings?: Json | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          capital_social?: number | null
          city?: string | null
          code_naf?: string | null
          created_at?: string
          created_by?: string | null
          daily_rate?: number | null
          discipline_id?: string | null
          email?: string | null
          footer_text?: string | null
          forme_juridique?: string | null
          header_style?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string
          postal_code?: string | null
          primary_color?: string | null
          rcs_city?: string | null
          secondary_color?: string | null
          signature_url?: string | null
          siren?: string | null
          siret?: string | null
          slug?: string
          style_settings?: Json | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invite: { Args: { invite_token: string }; Returns: Json }
      can_access_emails: {
        Args: { _created_by: string; _user_id: string; _workspace_id: string }
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
      generate_agency_document_number: {
        Args: { doc_type: string; ws_id: string }
        Returns: string
      }
      generate_document_number: {
        Args: { doc_type: string; ws_id: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: { inv_type: string; ws_id: string }
        Returns: string
      }
      get_invite_by_token: {
        Args: { invite_token: string }
        Returns: {
          email: string
          expires_at: string
          id: string
          role: string
          workspace_id: string
          workspace_name: string
          workspace_slug: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_workspace_ids: { Args: { _user_id: string }; Returns: string[] }
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
      has_workspace_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
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
      element_visibility: "all" | "admin" | "owner"
      invitation_response: "pending" | "accepted" | "declined"
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
      ],
      element_visibility: ["all", "admin", "owner"],
      invitation_response: ["pending", "accepted", "declined"],
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
      ],
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
