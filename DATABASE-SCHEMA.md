# Database Schema Documentation

> Auto-generated: 2026-01-22  
> Total Tables: **181**  
> Database: Supabase (PostgreSQL)

---

## Table of Contents

- [Core Tables](#core-tables)
- [CRM & Contacts](#crm--contacts)
- [Projects & Phases](#projects--phases)
- [Tasks & Time Tracking](#tasks--time-tracking)
- [Commercial Documents](#commercial-documents)
- [Invoicing](#invoicing)
- [Tenders (Appels d'offres)](#tenders-appels-doffres)
- [Team & HR](#team--hr)
- [Messaging & Notifications](#messaging--notifications)
- [Documents & Signatures](#documents--signatures)
- [Calendar & Planning](#calendar--planning)
- [Settings & Configuration](#settings--configuration)
- [Other Tables](#other-tables)

---

## Core Tables

### `workspaces`
Multi-tenant workspace (agency/company).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| name | text | NOT NULL | - |
| slug | text | NOT NULL | - |
| logo_url | text | NULL | - |
| plan | text | NOT NULL | 'free' |
| address | text | NULL | - |
| city | text | NULL | - |
| postal_code | text | NULL | - |
| phone | text | NULL | - |
| email | text | NULL | - |
| website | text | NULL | - |
| siret | text | NULL | - |
| siren | text | NULL | - |
| vat_number | text | NULL | - |
| forme_juridique | text | NULL | - |
| rcs_city | text | NULL | - |
| code_naf | text | NULL | - |
| capital_social | numeric | NULL | - |
| primary_color | text | NULL | '#1a1a2e' |
| secondary_color | text | NULL | '#16213e' |
| accent_color | text | NULL | '#0f3460' |
| footer_text | text | NULL | - |
| signature_url | text | NULL | - |
| email_signature | text | NULL | - |
| favicon_url | text | NULL | - |
| daily_rate | numeric | NULL | 0 |
| style_settings | jsonb | NULL | '{}' |
| header_style | jsonb | NULL | {...} |
| discipline_id | uuid | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `workspace_members`
Junction table: users ↔ workspaces with roles.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| user_id | uuid | NOT NULL | - |
| role | app_role | NOT NULL | 'member' |
| is_hidden | boolean | NULL | false |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `profiles`
User profile information (synced from auth.users).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| user_id | uuid | NOT NULL | - |
| full_name | text | NULL | - |
| avatar_url | text | NULL | - |
| job_title | text | NULL | - |
| phone | text | NULL | - |
| email | text | NULL | - |
| company | varchar | NULL | - |
| linkedin_url | varchar | NULL | - |
| bio | text | NULL | - |
| department | text | NULL | - |
| active_workspace_id | uuid | NULL | - |
| onboarding_completed | boolean | NOT NULL | false |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `user_roles`
Granular role assignments per workspace.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| user_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| role | app_role | NOT NULL | 'member' |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

---

## CRM & Contacts

### `crm_companies`
Client/partner companies.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| industry | text | NULL | - |
| email | text | NULL | - |
| phone | text | NULL | - |
| website | text | NULL | - |
| address | text | NULL | - |
| city | text | NULL | - |
| postal_code | text | NULL | - |
| country | text | NULL | 'France' |
| logo_url | text | NULL | - |
| notes | text | NULL | - |
| siret | varchar | NULL | - |
| siren | varchar | NULL | - |
| vat_number | varchar | NULL | - |
| forme_juridique | varchar | NULL | - |
| code_naf | varchar | NULL | - |
| rcs_city | varchar | NULL | - |
| capital_social | numeric | NULL | - |
| vat_rate | numeric | NULL | 20 |
| vat_type | text | NULL | 'standard' |
| status | text | NULL | 'confirmed' |
| billing_email | text | NULL | - |
| billing_contact_id | uuid | NULL | - |
| bet_specialties | text[] | NULL | - |
| client_reference | text | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `contacts`
Individual contacts (linked to companies).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| crm_company_id | uuid | NULL | - |
| name | text | NOT NULL | - |
| first_name | text | NULL | - |
| last_name | text | NULL | - |
| email | text | NULL | - |
| phone | text | NULL | - |
| role | text | NULL | - |
| contact_type | text | NULL | 'client' |
| gender | text | NULL | - |
| avatar_url | text | NULL | - |
| location | text | NULL | - |
| notes | text | NULL | - |
| department_id | uuid | NULL | - |
| department_role | text | NULL | - |
| status | text | NULL | 'confirmed' |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `leads`
Sales opportunities/leads.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| title | text | NOT NULL | - |
| status | text | NULL | 'new' |
| crm_company_id | uuid | NULL | - |
| contact_id | uuid | NULL | - |
| pipeline_id | uuid | NULL | - |
| stage_id | uuid | NULL | - |
| estimated_value | numeric | NULL | - |
| probability | integer | NULL | 50 |
| source | text | NULL | - |
| description | text | NULL | - |
| next_action | text | NULL | - |
| next_action_date | date | NULL | - |
| lost_reason | text | NULL | - |
| assigned_to | uuid | NULL | - |
| project_id | uuid | NULL | - |
| won_at | timestamptz | NULL | - |
| lost_at | timestamptz | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `crm_pipelines`
Sales/contact pipelines.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| color | text | NULL | - |
| pipeline_type | text | NULL | 'opportunity' |
| target_contact_type | text | NULL | - |
| is_default | boolean | NULL | false |
| sort_order | integer | NULL | 0 |
| email_ai_prompt | text | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `crm_pipeline_stages`
Pipeline stages.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| pipeline_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| color | text | NULL | - |
| probability | integer | NULL | 50 |
| sort_order | integer | NULL | 0 |
| is_final_stage | boolean | NULL | false |
| requires_email_on_enter | boolean | NULL | false |
| email_template_id | uuid | NULL | - |
| email_ai_prompt | text | NULL | - |
| auto_followup_enabled | boolean | NULL | false |
| auto_followup_days | integer | NULL | 3 |
| auto_followup_action_title | text | NULL | 'Relancer le contact' |
| created_at | timestamptz | NULL | now() |

### `crm_emails`
Email communications with contacts.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| subject | text | NOT NULL | - |
| body | text | NOT NULL | - |
| to_email | text | NOT NULL | - |
| from_email | text | NULL | 'noreply@app.com' |
| status | text | NULL | 'sent' |
| direction | text | NULL | 'outbound' |
| lead_id | uuid | NULL | - |
| contact_id | uuid | NULL | - |
| company_id | uuid | NULL | - |
| project_id | uuid | NULL | - |
| tender_id | uuid | NULL | - |
| sent_at | timestamptz | NULL | now() |
| received_at | timestamptz | NULL | - |
| opened_at | timestamptz | NULL | - |
| gmail_message_id | text | NULL | - |
| gmail_thread_id | text | NULL | - |
| synced_from_gmail | boolean | NULL | false |
| attachments | jsonb | NULL | '[]' |
| cc | text[] | NULL | '{}' |
| bcc | text[] | NULL | '{}' |
| labels | text[] | NULL | '{}' |
| is_read | boolean | NULL | false |
| reply_to_email_id | uuid | NULL | - |
| workspace_email_account_id | uuid | NULL | - |
| sent_via | text | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |

---

## Projects & Phases

### `projects`
Main project entity.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| client | text | NULL | - |
| crm_company_id | uuid | NULL | - |
| status | text | NULL | 'active' |
| phase | text | NULL | 'planning' |
| project_type | text | NULL | 'interior' |
| project_category | text | NULL | 'standard' |
| contract_type | text | NULL | 'standard' |
| billing_type | text | NULL | 'included' |
| color | text | NULL | '#000000' |
| start_date | date | NULL | - |
| end_date | date | NULL | - |
| budget | numeric | NULL | - |
| monthly_budget | numeric | NULL | - |
| surface_area | numeric | NULL | - |
| surfaces | jsonb | NULL | '{}' |
| address | text | NULL | - |
| city | text | NULL | - |
| postal_code | text | NULL | - |
| current_phase_id | uuid | NULL | - |
| lead_id | uuid | NULL | - |
| commercial_document_id | uuid | NULL | - |
| linked_quote_id | uuid | NULL | - |
| linked_order_id | uuid | NULL | - |
| parent_id | uuid | NULL | - |
| is_archived | boolean | NULL | false |
| is_internal | boolean | NOT NULL | false |
| auto_renew | boolean | NULL | false |
| framework_start_date | date | NULL | - |
| framework_end_date | date | NULL | - |
| fee_calculation | jsonb | NULL | '{}' |
| ai_summary | text | NULL | - |
| client_request_id | uuid | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `project_phases`
Project phases (mission phases).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| project_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| phase_code | text | NULL | - |
| status | text | NULL | 'pending' |
| color | text | NULL | - |
| sort_order | integer | NULL | 0 |
| start_date | date | NULL | - |
| end_date | date | NULL | - |
| percentage_fee | numeric | NULL | 0 |
| deliverables | jsonb | NULL | '[]' |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `project_members`
Project team members.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| project_id | uuid | NOT NULL | - |
| user_id | uuid | NULL | - |
| role | text | NULL | 'member' |
| notes | text | NULL | - |
| client_daily_rate | numeric | NULL | - |
| is_external | boolean | NULL | false |
| external_contact_id | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |

### `project_deliverables`
Project deliverables.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| project_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| phase_id | uuid | NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| deliverable_type | text | NULL | 'document' |
| status | text | NULL | 'pending' |
| due_date | timestamptz | NULL | - |
| delivered_at | timestamptz | NULL | - |
| file_urls | text[] | NULL | '{}' |
| sort_order | integer | NULL | 0 |
| assigned_to | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `project_lots`
Construction lots (for planning).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| project_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| status | text | NULL | 'pending' |
| color | text | NULL | - |
| crm_company_id | uuid | NULL | - |
| budget | numeric | NULL | - |
| start_date | date | NULL | - |
| end_date | date | NULL | - |
| sort_order | integer | NULL | 0 |
| sub_row_names | jsonb | NULL | '{}' |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `project_lot_interventions`
Lot interventions on timeline.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| project_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| lot_id | uuid | NOT NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| start_date | date | NOT NULL | - |
| end_date | date | NOT NULL | - |
| status | text | NULL | 'planned' |
| color | text | NULL | - |
| team_size | integer | NULL | 1 |
| sub_row | integer | NOT NULL | 0 |
| notes | text | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `project_purchases`
Project purchases/expenses.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| project_id | uuid | NOT NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| purchase_type | purchase_type | NOT NULL | 'provision' |
| purchase_category | purchase_category | NOT NULL | 'other' |
| supplier_id | uuid | NULL | - |
| supplier_name | text | NULL | - |
| amount_ht | numeric | NOT NULL | 0 |
| vat_rate | numeric | NULL | 20 |
| amount_ttc | numeric | NULL | - |
| selling_price | numeric | NULL | - |
| margin_percentage | numeric | NULL | - |
| status | purchase_status | NOT NULL | 'draft' |
| invoice_date | date | NULL | - |
| due_date | date | NULL | - |
| received_date | date | NULL | - |
| payment_date | date | NULL | - |
| invoice_number | text | NULL | - |
| payment_reference | text | NULL | - |
| phase_id | uuid | NULL | - |
| budget_envelope_id | uuid | NULL | - |
| assigned_to | uuid | NULL | - |
| files | jsonb | NULL | '[]' |
| file_url | text | NULL | - |
| notes | text | NULL | - |
| sort_order | integer | NULL | 0 |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `project_budget_envelopes`
Budget envelopes for tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| project_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| category | text | NULL | - |
| envelope_type | text | NULL | 'expenses' |
| source_type | text | NOT NULL | 'manual' |
| source_document_id | uuid | NULL | - |
| source_phase_ids | jsonb | NULL | '[]' |
| budget_amount | numeric | NOT NULL | 0 |
| consumed_amount | numeric | NOT NULL | 0 |
| remaining_amount | numeric | NULL | - |
| alert_threshold | numeric | NULL | 80 |
| status | text | NOT NULL | 'active' |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

---

## Tasks & Time Tracking

### `tasks`
Task management.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| project_id | uuid | NULL | - |
| phase_id | uuid | NULL | - |
| deliverable_id | uuid | NULL | - |
| parent_id | uuid | NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| status | text | NOT NULL | 'todo' |
| priority | text | NULL | 'medium' |
| due_date | date | NULL | - |
| start_date | date | NULL | - |
| estimated_hours | numeric | NULL | - |
| actual_hours | numeric | NULL | - |
| assigned_to | uuid | NULL | - |
| sort_order | integer | NULL | 0 |
| tags | text[] | NULL | '{}' |
| completed_at | timestamptz | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `team_time_entries`
Time tracking entries.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| user_id | uuid | NOT NULL | - |
| project_id | uuid | NULL | - |
| task_id | uuid | NULL | - |
| date | date | NOT NULL | CURRENT_DATE |
| duration_minutes | integer | NOT NULL | 0 |
| description | text | NULL | - |
| status | text | NOT NULL | 'draft' |
| is_billable | boolean | NULL | true |
| hourly_rate | numeric | NULL | 0 |
| started_at | timestamptz | NULL | - |
| ended_at | timestamptz | NULL | - |
| validated_by | uuid | NULL | - |
| validated_at | timestamptz | NULL | - |
| rejection_reason | text | NULL | - |
| budget_envelope_id | uuid | NULL | - |
| invoice_id | uuid | NULL | - |
| invoiced_at | timestamptz | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `task_time_entries`
Time entries linked to tasks (legacy).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| task_id | uuid | NOT NULL | - |
| user_id | uuid | NULL | - |
| date | date | NOT NULL | - |
| duration_minutes | integer | NOT NULL | - |
| description | text | NULL | - |
| is_billable | boolean | NULL | true |
| hourly_rate | numeric | NULL | 0 |
| started_at | timestamptz | NULL | - |
| ended_at | timestamptz | NULL | - |
| invoice_id | uuid | NULL | - |
| invoiced_at | timestamptz | NULL | - |
| created_at | timestamptz | NULL | now() |

---

## Commercial Documents

### `commercial_documents`
Quotes, contracts, proposals.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| document_type | text | NOT NULL | 'quote' |
| document_number | text | NOT NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| status | text | NOT NULL | 'draft' |
| project_id | uuid | NULL | - |
| client_company_id | uuid | NULL | - |
| client_contact_id | uuid | NULL | - |
| billing_contact_id | uuid | NULL | - |
| contract_type_id | uuid | NULL | - |
| project_type | text | NOT NULL | 'interior' |
| project_address | text | NULL | - |
| project_city | text | NULL | - |
| postal_code | text | NULL | - |
| project_surface | numeric | NULL | - |
| project_budget | numeric | NULL | - |
| construction_budget | numeric | NULL | - |
| construction_budget_disclosed | boolean | NULL | true |
| fee_mode | text | NOT NULL | 'percentage' |
| fee_percentage | numeric | NULL | - |
| hourly_rate | numeric | NULL | - |
| total_amount | numeric | NULL | 0 |
| vat_rate | numeric | NULL | - |
| vat_type | text | NULL | - |
| currency | text | NULL | 'EUR' |
| validity_days | integer | NULL | 30 |
| valid_until | date | NULL | - |
| expected_start_date | date | NULL | - |
| expected_end_date | date | NULL | - |
| expected_signature_date | date | NULL | - |
| payment_terms | text | NULL | - |
| special_conditions | text | NULL | - |
| general_conditions | text | NULL | - |
| header_text | text | NULL | - |
| footer_text | text | NULL | - |
| notes | text | NULL | - |
| invoice_schedule | jsonb | NULL | '[]' |
| is_public_market | boolean | NULL | false |
| is_amendment | boolean | NULL | false |
| requires_deposit | boolean | NULL | false |
| deposit_percentage | numeric | NULL | 30 |
| retention_guarantee_percentage | numeric | NULL | 0 |
| retention_guarantee_amount | numeric | NULL | - |
| internal_owner_id | uuid | NULL | - |
| quote_theme_id | uuid | NULL | - |
| pdf_url | text | NULL | - |
| signed_pdf_url | text | NULL | - |
| reference_client | text | NULL | - |
| market_reference | text | NULL | - |
| sent_at | timestamptz | NULL | - |
| accepted_at | timestamptz | NULL | - |
| signed_at | timestamptz | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `commercial_document_phases`
Quote/contract line items (phases).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| document_id | uuid | NOT NULL | - |
| phase_code | text | NOT NULL | - |
| phase_name | text | NOT NULL | - |
| phase_description | text | NULL | - |
| line_type | text | NULL | 'phase' |
| percentage_fee | numeric | NULL | 0 |
| amount | numeric | NULL | 0 |
| unit_price | numeric | NULL | - |
| quantity | numeric | NULL | 1 |
| unit | text | NULL | 'forfait' |
| billing_type | text | NULL | 'one_time' |
| is_included | boolean | NULL | true |
| deliverables | jsonb | NULL | '[]' |
| start_date | date | NULL | - |
| end_date | date | NULL | - |
| sort_order | integer | NULL | 0 |
| assigned_member_id | uuid | NULL | - |
| assigned_skill | text | NULL | - |
| skill_id | uuid | NULL | - |
| purchase_price | numeric | NULL | - |
| margin_percentage | numeric | NULL | - |
| recurrence_months | integer | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `contract_types`
Contract type configuration.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| code | text | NOT NULL | - |
| description | text | NULL | - |
| icon | text | NULL | 'FileText' |
| color | text | NULL | '#3B82F6' |
| default_fields | jsonb | NULL | {...} |
| default_clauses | jsonb | NULL | '{}' |
| builder_tabs | jsonb | NULL | '["general", "lines", "terms"]' |
| pdf_config | jsonb | NULL | '{}' |
| sort_order | integer | NULL | 0 |
| is_default | boolean | NULL | false |
| is_active | boolean | NULL | true |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

---

## Invoicing

### `invoices`
Invoices.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| project_id | uuid | NULL | - |
| quote_id | uuid | NULL | - |
| company_id | uuid | NULL | - |
| contact_id | uuid | NULL | - |
| billing_profile_id | uuid | NULL | - |
| invoice_type | text | NOT NULL | 'standard' |
| invoice_number | text | NOT NULL | - |
| status | text | NOT NULL | 'draft' |
| issue_date | date | NOT NULL | CURRENT_DATE |
| due_date | date | NULL | - |
| payment_date | date | NULL | - |
| subtotal | numeric | NOT NULL | 0 |
| vat_rate | numeric | NULL | 20 |
| vat_amount | numeric | NULL | 0 |
| total_ht | numeric | NOT NULL | 0 |
| total_ttc | numeric | NOT NULL | 0 |
| paid_amount | numeric | NULL | 0 |
| remaining_amount | numeric | NULL | 0 |
| currency | text | NULL | 'EUR' |
| payment_terms | text | NULL | - |
| notes | text | NULL | - |
| internal_notes | text | NULL | - |
| pdf_url | text | NULL | - |
| sent_at | timestamptz | NULL | - |
| cancelled_at | timestamptz | NULL | - |
| cancellation_reason | text | NULL | - |
| credit_note_for_id | uuid | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `invoice_items`
Invoice line items.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| invoice_id | uuid | NOT NULL | - |
| item_type | text | NULL | 'service' |
| code | text | NULL | - |
| description | text | NOT NULL | - |
| detailed_description | text | NULL | - |
| phase_name | text | NULL | - |
| phase_id | uuid | NULL | - |
| quantity | numeric | NULL | 1 |
| unit | text | NULL | 'unité' |
| unit_price | numeric | NOT NULL | - |
| discount_percentage | numeric | NULL | 0 |
| tva_rate | numeric | NULL | 20 |
| percentage_completed | numeric | NULL | 100 |
| amount_ht | numeric | NOT NULL | - |
| amount_tva | numeric | NULL | 0 |
| amount_ttc | numeric | NOT NULL | - |
| sort_order | integer | NULL | 0 |
| created_at | timestamptz | NULL | now() |

### `invoice_payments`
Payment records for invoices.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| invoice_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| payment_date | date | NOT NULL | - |
| amount | numeric | NOT NULL | - |
| payment_method | text | NULL | - |
| reference | text | NULL | - |
| notes | text | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |

### `billing_profiles`
Client billing profiles.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| company_id | uuid | NULL | - |
| contact_id | uuid | NULL | - |
| department_id | uuid | NULL | - |
| billing_name | text | NULL | - |
| billing_address | text | NULL | - |
| billing_postal_code | text | NULL | - |
| billing_city | text | NULL | - |
| billing_country | text | NULL | - |
| billing_email | text | NULL | - |
| billing_phone | text | NULL | - |
| siret | text | NULL | - |
| siren | text | NULL | - |
| vat_number | text | NULL | - |
| code_naf | text | NULL | - |
| legal_form | text | NULL | - |
| rcs_city | text | NULL | - |
| capital_social | numeric | NULL | - |
| vat_rate | numeric | NULL | 20 |
| vat_type | text | NULL | - |
| iban | text | NULL | - |
| bic | text | NULL | - |
| bank_name | text | NULL | - |
| payment_terms | text | NULL | - |
| payment_method | text | NULL | - |
| default_discount_percent | numeric | NULL | 0 |
| notes | text | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

---

## Tenders (Appels d'offres)

### `tenders`
Public tender opportunities.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| reference | text | NOT NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| tender_type | text | NULL | 'architecture' |
| discipline_slug | text | NULL | 'architecture' |
| client_name | text | NULL | - |
| client_type | text | NULL | 'public' |
| contracting_authority | text | NULL | - |
| location | text | NULL | - |
| region | text | NULL | - |
| estimated_budget | numeric | NULL | - |
| budget_disclosed | boolean | NULL | true |
| surface_area | numeric | NULL | - |
| procedure_type | procedure_type | NULL | 'ouvert' |
| status | tender_status | NULL | 'repere' |
| pipeline_status | text | NULL | 'a_approuver' |
| submission_type | text | NULL | 'candidature_offre' |
| submission_deadline | timestamptz | NULL | - |
| go_decision_date | timestamptz | NULL | - |
| go_decision_by | uuid | NULL | - |
| go_decision_notes | text | NULL | - |
| no_go_date | timestamptz | NULL | - |
| no_go_reason | text | NULL | - |
| site_visit_required | boolean | NULL | false |
| site_visit_date | timestamptz | NULL | - |
| site_visit_notes | text | NULL | - |
| jury_date | timestamptz | NULL | - |
| results_date | timestamptz | NULL | - |
| moe_fee_percentage | numeric | NULL | - |
| moe_fee_amount | numeric | NULL | - |
| moe_phases | jsonb | NULL | '[]' |
| source_platform | text | NULL | - |
| source_url | text | NULL | - |
| dce_link | text | NULL | - |
| consultation_number | text | NULL | - |
| allows_joint_venture | boolean | NULL | true |
| allows_variants | boolean | NULL | false |
| allows_negotiation | boolean | NULL | false |
| has_allotissement | boolean | NULL | false |
| nb_lots | integer | NULL | 0 |
| lead_id | uuid | NULL | - |
| project_id | uuid | NULL | - |
| moa_company_id | uuid | NULL | - |
| required_team | jsonb | NULL | '[]' |
| critical_alerts | jsonb | NULL | '[]' |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `tender_team_members`
Tender groupement members.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| tender_id | uuid | NOT NULL | - |
| role | tender_team_role | NULL | 'cotraitant' |
| company_id | uuid | NULL | - |
| contact_id | uuid | NULL | - |
| specialty | text | NULL | - |
| fee_percentage | numeric | NULL | - |
| status | invitation_response | NULL | 'pending' |
| notes | text | NULL | - |
| parent_member_id | uuid | NULL | - |
| invited_at | timestamptz | NULL | - |
| responded_at | timestamptz | NULL | - |
| created_at | timestamptz | NULL | now() |

### `tender_documents`
Uploaded DCE documents.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| tender_id | uuid | NOT NULL | - |
| document_type | text | NULL | 'autre' |
| file_name | text | NOT NULL | - |
| file_url | text | NOT NULL | - |
| file_size | integer | NULL | - |
| is_analyzed | boolean | NULL | false |
| extracted_data | jsonb | NULL | '{}' |
| uploaded_at | timestamptz | NULL | now() |
| analyzed_at | timestamptz | NULL | - |

### `tender_deliverables`
Tender submission deliverables.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| tender_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| deliverable_type | text | NULL | 'autre' |
| responsible_type | text | NULL | 'mandataire' |
| responsible_company_ids | uuid[] | NULL | '{}' |
| member_completion | jsonb | NULL | '{}' |
| is_completed | boolean | NULL | false |
| due_date | date | NULL | - |
| file_urls | text[] | NULL | '{}' |
| sort_order | integer | NULL | 0 |
| created_at | timestamptz | NULL | now() |

---

## Team & HR

### `team_absences`
Leave/absence requests.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| user_id | uuid | NOT NULL | - |
| absence_type | text | NOT NULL | 'conge_paye' |
| start_date | date | NOT NULL | - |
| end_date | date | NOT NULL | - |
| start_half_day | boolean | NULL | false |
| end_half_day | boolean | NULL | false |
| days_count | numeric | NULL | - |
| working_days_count | numeric | NULL | - |
| computed_days | numeric | NULL | - |
| reason | text | NULL | - |
| status | text | NOT NULL | 'pending' |
| rejection_reason | text | NULL | - |
| justification_url | text | NULL | - |
| deducted_from_balance | boolean | NULL | true |
| approved_by | uuid | NULL | - |
| approved_at | timestamptz | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `leave_balances`
Leave balance tracking.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| user_id | uuid | NOT NULL | - |
| leave_type | text | NOT NULL | - |
| period_year | integer | NOT NULL | - |
| initial_balance | numeric | NULL | 0 |
| acquired | numeric | NULL | 0 |
| taken | numeric | NULL | 0 |
| pending | numeric | NULL | 0 |
| adjustment | numeric | NULL | 0 |
| notes | text | NULL | - |
| last_accrual_date | date | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `team_evaluations`
Performance evaluations.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| user_id | uuid | NOT NULL | - |
| evaluator_id | uuid | NOT NULL | - |
| evaluation_type | text | NOT NULL | 'annual' |
| status | text | NOT NULL | 'scheduled' |
| scheduled_date | timestamptz | NULL | - |
| completed_date | timestamptz | NULL | - |
| objectives | jsonb | NULL | '[]' |
| feedback | jsonb | NULL | '{}' |
| rating | integer | NULL | - |
| notes | text | NULL | - |
| location | text | NULL | - |
| meeting_link | text | NULL | - |
| panel_members | uuid[] | NULL | '{}' |
| duration_minutes | integer | NULL | 60 |
| reminder_sent | boolean | NULL | false |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `job_offers`
Job postings.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| requirements | text | NULL | - |
| contract_type | text | NULL | 'cdi' |
| location | text | NULL | - |
| remote_policy | text | NULL | 'onsite' |
| salary_min | integer | NULL | - |
| salary_max | integer | NULL | - |
| status | text | NOT NULL | 'draft' |
| published_at | timestamptz | NULL | - |
| closes_at | timestamptz | NULL | - |
| created_by | uuid | NOT NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `job_applications`
Job applications.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| job_offer_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| candidate_name | text | NOT NULL | - |
| candidate_email | text | NOT NULL | - |
| candidate_phone | text | NULL | - |
| cv_url | text | NULL | - |
| cover_letter | text | NULL | - |
| linkedin_url | text | NULL | - |
| portfolio_url | text | NULL | - |
| status | text | NOT NULL | 'new' |
| rating | integer | NULL | - |
| notes | text | NULL | - |
| interview_date | timestamptz | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

---

## Messaging & Notifications

### `team_channels`
Team chat channels.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| channel_type | text | NOT NULL | 'public' |
| is_archived | boolean | NOT NULL | false |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `team_messages`
Chat messages.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| channel_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| content | text | NOT NULL | - |
| mentions | uuid[] | NULL | '{}' |
| attachments | jsonb | NULL | '[]' |
| is_edited | boolean | NULL | false |
| is_pinned | boolean | NULL | false |
| parent_id | uuid | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `notifications`
User notifications.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| user_id | uuid | NOT NULL | - |
| type | text | NOT NULL | 'info' |
| title | text | NOT NULL | - |
| message | text | NULL | - |
| action_url | text | NULL | - |
| is_read | boolean | NOT NULL | false |
| actor_id | uuid | NULL | - |
| related_entity_type | text | NULL | - |
| related_entity_id | uuid | NULL | - |
| related_entity_name | text | NULL | - |
| created_at | timestamptz | NOT NULL | now() |

### `notification_preferences`
User notification settings.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| user_id | uuid | NOT NULL | - |
| workspace_id | uuid | NOT NULL | - |
| notify_mentions | boolean | NULL | true |
| notify_new_messages | boolean | NULL | true |
| notify_comment_replies | boolean | NULL | true |
| notify_reactions | boolean | NULL | false |
| notify_task_created | boolean | NULL | true |
| notify_task_assigned | boolean | NULL | true |
| notify_task_completed | boolean | NULL | false |
| notify_project_updates | boolean | NULL | true |
| notify_invites | boolean | NULL | true |
| email_enabled | boolean | NULL | false |
| push_enabled | boolean | NULL | true |
| do_not_disturb | boolean | NULL | false |
| dnd_start | time | NULL | '22:00:00' |
| dnd_end | time | NULL | '08:00:00' |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

---

## Documents & Signatures

### `agency_documents`
Administrative documents.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| category | text | NOT NULL | - |
| document_type | text | NOT NULL | - |
| document_number | text | NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| status | text | NULL | 'draft' |
| content | jsonb | NULL | '{}' |
| attachments | jsonb | NULL | '[]' |
| project_id | uuid | NULL | - |
| contact_id | uuid | NULL | - |
| company_id | uuid | NULL | - |
| template_id | uuid | NULL | - |
| related_document_id | uuid | NULL | - |
| valid_from | date | NULL | - |
| valid_until | date | NULL | - |
| pdf_url | text | NULL | - |
| sent_at | timestamptz | NULL | - |
| signed_at | timestamptz | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `document_signatures`
E-signature requests.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| document_id | uuid | NOT NULL | - |
| signature_type | text | NOT NULL | 'simple' |
| status | text | NULL | 'pending' |
| message | text | NULL | - |
| requested_by | uuid | NOT NULL | - |
| expires_at | timestamptz | NULL | - |
| completed_at | timestamptz | NULL | - |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `document_signers`
Individual signers for a signature request.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| signature_id | uuid | NOT NULL | - |
| signer_email | text | NOT NULL | - |
| signer_name | text | NOT NULL | - |
| signer_role | text | NULL | - |
| sign_order | integer | NULL | 1 |
| status | text | NULL | 'pending' |
| token | uuid | NULL | gen_random_uuid() |
| signed_at | timestamptz | NULL | - |
| signature_data | jsonb | NULL | - |
| signature_image | text | NULL | - |
| created_at | timestamptz | NULL | now() |

---

## Calendar & Planning

### `project_calendar_events`
Project-related calendar events.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| project_id | uuid | NULL | - |
| workspace_id | uuid | NOT NULL | - |
| title | text | NOT NULL | - |
| description | text | NULL | - |
| event_type | text | NOT NULL | 'meeting' |
| start_datetime | timestamptz | NOT NULL | - |
| end_datetime | timestamptz | NULL | - |
| is_all_day | boolean | NULL | false |
| location | text | NULL | - |
| attendees | jsonb | NULL | '[]' |
| deliverable_id | uuid | NULL | - |
| google_event_id | text | NULL | - |
| google_meet_link | text | NULL | - |
| google_calendar_id | text | NULL | - |
| recurrence_rule | text | NULL | - |
| recurrence_end_date | timestamptz | NULL | - |
| parent_event_id | uuid | NULL | - |
| created_by | uuid | NULL | - |
| created_at | timestamptz | NOT NULL | now() |
| updated_at | timestamptz | NOT NULL | now() |

### `french_holidays`
French public holidays.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| name | text | NOT NULL | - |
| holiday_date | date | NOT NULL | - |
| is_worked | boolean | NULL | false |
| created_at | timestamptz | NULL | now() |

---

## Settings & Configuration

### `workspace_settings`
Dynamic workspace settings.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| setting_type | text | NOT NULL | - |
| setting_key | text | NOT NULL | - |
| setting_value | jsonb | NOT NULL | '{}' |
| sort_order | integer | NULL | 0 |
| is_active | boolean | NULL | true |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `phase_templates`
Configurable phase templates.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| code | text | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| project_type | text | NULL | 'interior' |
| category | text | NOT NULL | 'base' |
| color | text | NULL | - |
| default_percentage | numeric | NULL | 0 |
| deliverables | jsonb | NULL | '[]' |
| sort_order | integer | NULL | 0 |
| is_active | boolean | NULL | true |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `disciplines`
Global discipline definitions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| slug | text | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| icon | text | NULL | - |
| color | text | NULL | - |
| sort_order | integer | NULL | 0 |
| is_active | boolean | NULL | true |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

### `modules`
Available app modules.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| slug | text | NOT NULL | - |
| name | text | NOT NULL | - |
| description | text | NULL | - |
| icon | text | NULL | - |
| category | text | NULL | - |
| is_core | boolean | NULL | false |
| is_premium | boolean | NULL | false |
| sort_order | integer | NULL | 0 |
| created_at | timestamptz | NULL | now() |

### `workspace_modules`
Enabled modules per workspace.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| workspace_id | uuid | NOT NULL | - |
| module_id | uuid | NOT NULL | - |
| settings | jsonb | NULL | '{}' |
| enabled_at | timestamptz | NULL | now() |
| enabled_by | uuid | NULL | - |

---

## Custom Enums

```sql
-- app_role: 'owner' | 'admin' | 'member' | 'viewer'
-- tender_status: 'repere' | 'a_etudier' | 'go' | 'no_go' | 'candidature' | 'offre' | 'gagne' | 'perdu'
-- procedure_type: 'ouvert' | 'restreint' | 'negocie' | 'dialogue' | 'conception' | 'autre'
-- tender_team_role: 'mandataire' | 'cotraitant' | 'sous_traitant'
-- invitation_response: 'pending' | 'accepted' | 'declined'
-- purchase_type: 'provision' | 'facture' | 'avoir'
-- purchase_category: 'fourniture' | 'prestation' | 'location' | 'transport' | 'other'
-- purchase_status: 'draft' | 'ordered' | 'received' | 'paid' | 'cancelled'
-- element_type: 'file' | 'link' | 'credential'
-- element_visibility: 'all' | 'admin' | 'owner'
```

---

## Key Database Functions

| Function | Description |
|----------|-------------|
| `is_workspace_member(workspace_id, user_id)` | Checks if user belongs to workspace |
| `is_workspace_admin(workspace_id, user_id)` | Checks if user is admin/owner |
| `has_role(user_id, workspace_id, role)` | Checks specific role |
| `has_role_or_higher(user_id, workspace_id, min_role)` | Checks role hierarchy |
| `has_permission(user_id, workspace_id, permission_code)` | Checks granular permission |
| `get_user_workspace_ids(user_id)` | Returns all workspace IDs for user |
| `generate_document_number(type, workspace_id)` | Auto-generates document numbers |
| `generate_invoice_number(type, workspace_id)` | Auto-generates invoice numbers |
| `calculate_working_days(...)` | Calculates working days excluding holidays |
| `accept_workspace_invite(token)` | Processes workspace invitation |

---

## RLS Patterns

All tables use Row Level Security (RLS) with these common patterns:

1. **Workspace-scoped access**: `workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))`
2. **Member check**: `is_workspace_member(workspace_id, auth.uid())`
3. **Admin-only**: `is_workspace_admin(workspace_id, auth.uid())`
4. **Owner-only**: `has_role(auth.uid(), workspace_id, 'owner')`
5. **Permission-based**: `has_permission(auth.uid(), workspace_id, 'permission.code')`
6. **Self-access**: `user_id = auth.uid()`

---

*This schema supports a multi-tenant SaaS application for architecture/design agencies with CRM, project management, invoicing, tender management, HR, and team collaboration features.*
