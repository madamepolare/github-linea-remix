-- =====================================================
-- ARCHIGOOD DATABASE EXPORT - PART 1: ENUMS
-- =====================================================
-- Generated for migration to personal Supabase instance
-- =====================================================

-- App Role (owner, admin, member, viewer)
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Element types for project elements
CREATE TYPE public.element_type AS ENUM (
  'link', 'file', 'email', 'note', 'order', 
  'letter', 'other', 'credential', 'image_ref'
);

-- Element visibility levels
CREATE TYPE public.element_visibility AS ENUM ('all', 'admin', 'owner');

-- French leave types
CREATE TYPE public.french_leave_type AS ENUM (
  'cp', 'rtt', 'anciennete', 'fractionnement', 
  'maladie', 'maternite', 'paternite', 'parental',
  'enfant_malade', 'evenement_familial', 'sans_solde',
  'formation', 'compte_epargne', 'autre'
);

-- Meeting invitation response
CREATE TYPE public.invitation_response AS ENUM ('pending', 'accepted', 'declined');

-- Payroll period status
CREATE TYPE public.payroll_period_status AS ENUM (
  'draft', 'pending', 'validated', 'exported', 'closed'
);

-- Public procurement procedure types
CREATE TYPE public.procedure_type AS ENUM (
  'ouvert', 'restreint', 'adapte', 'concours', 
  'dialogue', 'partenariat', 'mapa', 'ppp',
  'conception_realisation', 'autre', 'concours_restreint',
  'concours_ouvert', 'dialogue_competitif', 
  'partenariat_innovation', 'appel_offres_ouvert',
  'appel_offres_restreint', 'negociee'
);

-- Purchase categories
CREATE TYPE public.purchase_category AS ENUM (
  'subcontract', 'printing', 'rental', 
  'transport', 'material', 'service', 'other'
);

-- Purchase status
CREATE TYPE public.purchase_status AS ENUM (
  'draft', 'pending_validation', 'validated',
  'invoice_received', 'payment_pending', 'paid', 'cancelled'
);

-- Purchase types
CREATE TYPE public.purchase_type AS ENUM ('provision', 'supplier_invoice');

-- Tender status
CREATE TYPE public.tender_status AS ENUM (
  'repere', 'en_analyse', 'go', 'no_go',
  'en_montage', 'depose', 'gagne', 'perdu'
);

-- Tender team role
CREATE TYPE public.tender_team_role AS ENUM (
  'mandataire', 'cotraitant', 'sous_traitant'
);
