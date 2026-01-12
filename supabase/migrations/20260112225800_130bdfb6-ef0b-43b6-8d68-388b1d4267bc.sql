-- =====================================================
-- SYSTÈME DE GESTION DES CONGÉS - LOIS FRANÇAISES
-- =====================================================

-- 1. Enum pour les types de congés français
DO $$ BEGIN
  CREATE TYPE public.french_leave_type AS ENUM (
    'cp',              -- Congés payés (25 jours ouvrés / 30 jours ouvrables)
    'rtt',             -- Réduction du temps de travail
    'anciennete',      -- Congés d'ancienneté
    'fractionnement',  -- Jours de fractionnement
    'maladie',         -- Arrêt maladie
    'maternite',       -- Congé maternité
    'paternite',       -- Congé paternité
    'parental',        -- Congé parental
    'enfant_malade',   -- Congé enfant malade
    'evenement_familial', -- Mariage, naissance, décès, etc.
    'sans_solde',      -- Congé sans solde
    'formation',       -- Formation
    'compte_epargne',  -- CET - Compte épargne temps
    'autre'            -- Autre
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Enum pour les statuts de période de paie
DO $$ BEGIN
  CREATE TYPE public.payroll_period_status AS ENUM (
    'draft',           -- Brouillon
    'pending',         -- En attente de validation
    'validated',       -- Validé par RH
    'exported',        -- Exporté pour comptabilité
    'closed'           -- Clôturé
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Configuration des types de congés par workspace
CREATE TABLE IF NOT EXISTS public.leave_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL, -- french_leave_type value
  label TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  is_paid BOOLEAN DEFAULT true,
  is_countable BOOLEAN DEFAULT true, -- Compte dans les soldes
  annual_allowance NUMERIC(5,2) DEFAULT 0, -- Jours alloués par an (0 = illimité pour maladie)
  monthly_accrual NUMERIC(5,2) DEFAULT 0, -- Acquisition mensuelle
  max_carry_over NUMERIC(5,2) DEFAULT 0, -- Report max année suivante
  requires_justification BOOLEAN DEFAULT false,
  min_notice_days INTEGER DEFAULT 0, -- Délai de prévenance
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, leave_type)
);

-- 4. Soldes de congés par employé et type
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  leave_type TEXT NOT NULL,
  period_year INTEGER NOT NULL, -- Année de référence (ex: 2026)
  
  -- Soldes
  initial_balance NUMERIC(6,2) DEFAULT 0, -- Solde initial (report N-1)
  acquired NUMERIC(6,2) DEFAULT 0, -- Jours acquis sur la période
  taken NUMERIC(6,2) DEFAULT 0, -- Jours pris
  pending NUMERIC(6,2) DEFAULT 0, -- Jours en attente de validation
  adjustment NUMERIC(6,2) DEFAULT 0, -- Ajustements manuels
  
  -- Calculé: initial + acquired + adjustment - taken = remaining
  
  -- Métadonnées
  last_accrual_date DATE, -- Dernière date d'acquisition
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(workspace_id, user_id, leave_type, period_year)
);

-- 5. Historique des mouvements de congés
CREATE TABLE IF NOT EXISTS public.leave_balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  balance_id UUID NOT NULL REFERENCES public.leave_balances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  leave_type TEXT NOT NULL,
  
  transaction_type TEXT NOT NULL, -- 'accrual', 'taken', 'adjustment', 'carry_over', 'expiry'
  amount NUMERIC(6,2) NOT NULL, -- Positif pour acquisition, négatif pour prise
  description TEXT,
  
  -- Lien optionnel avec une absence
  absence_id UUID REFERENCES public.team_absences(id) ON DELETE SET NULL,
  
  -- Traçabilité
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Périodes de paie pour export comptable
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  
  status TEXT DEFAULT 'draft', -- payroll_period_status
  
  -- Dates de la période
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Validation
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  
  -- Export
  exported_at TIMESTAMPTZ,
  export_filename TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(workspace_id, period_year, period_month)
);

-- 7. Variables de paie par employé pour chaque période
CREATE TABLE IF NOT EXISTS public.payroll_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Variables de congés (en jours)
  cp_taken NUMERIC(5,2) DEFAULT 0,
  cp_remaining NUMERIC(5,2) DEFAULT 0,
  rtt_taken NUMERIC(5,2) DEFAULT 0,
  rtt_remaining NUMERIC(5,2) DEFAULT 0,
  
  -- Absences
  sick_days INTEGER DEFAULT 0, -- Jours maladie
  sick_days_without_pay INTEGER DEFAULT 0, -- Jours maladie sans solde (carence)
  
  -- Autres absences
  unpaid_leave_days NUMERIC(5,2) DEFAULT 0,
  training_days NUMERIC(5,2) DEFAULT 0,
  
  -- Temps de travail
  total_worked_hours NUMERIC(7,2) DEFAULT 0,
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  
  -- Primes et ajustements
  bonuses JSONB DEFAULT '[]', -- [{type, amount, description}]
  deductions JSONB DEFAULT '[]',
  
  -- Notes pour le comptable
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(period_id, user_id)
);

-- 8. Configuration des contrats (pour calculer les droits)
CREATE TABLE IF NOT EXISTS public.employee_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  contract_type TEXT NOT NULL DEFAULT 'cdi', -- cdi, cdd, alternance, stage, freelance
  start_date DATE NOT NULL,
  end_date DATE, -- NULL pour CDI
  
  -- Temps de travail
  weekly_hours NUMERIC(4,1) DEFAULT 35, -- Heures par semaine
  is_executive BOOLEAN DEFAULT false, -- Cadre (forfait jours)
  annual_days INTEGER DEFAULT 218, -- Pour forfait jours
  
  -- Droits aux congés
  cp_annual_days NUMERIC(4,1) DEFAULT 25, -- CP par an
  rtt_annual_days NUMERIC(4,1) DEFAULT 0, -- RTT par an
  
  -- Période d'essai
  probation_end_date DATE,
  
  -- Ancienneté pour calcul bonus
  seniority_start_date DATE,
  
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Jours fériés français par année
CREATE TABLE IF NOT EXISTS public.french_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  is_worked BOOLEAN DEFAULT false, -- Jour férié travaillé?
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(workspace_id, holiday_date)
);

-- 10. Ajouter colonnes à team_absences pour lien avec soldes
ALTER TABLE public.team_absences 
  ADD COLUMN IF NOT EXISTS days_count NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS working_days_count NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS deducted_from_balance BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS justification_url TEXT;

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.leave_type_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.french_holidays ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- leave_type_config - All workspace members can read
CREATE POLICY "Members can view leave config" ON public.leave_type_config
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = leave_type_config.workspace_id 
    AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage leave config" ON public.leave_type_config
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = leave_type_config.workspace_id 
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

-- leave_balances - Users see their own, admins see all
CREATE POLICY "Users can view own balances" ON public.leave_balances
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = leave_balances.workspace_id 
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage balances" ON public.leave_balances
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = leave_balances.workspace_id 
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

-- leave_balance_transactions - Same as balances
CREATE POLICY "Users can view own transactions" ON public.leave_balance_transactions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = leave_balance_transactions.workspace_id 
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage transactions" ON public.leave_balance_transactions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = leave_balance_transactions.workspace_id 
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

-- payroll_periods - Admins only
CREATE POLICY "Admins can manage payroll periods" ON public.payroll_periods
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = payroll_periods.workspace_id 
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

-- payroll_variables - Users see own, admins see all
CREATE POLICY "Users can view own payroll variables" ON public.payroll_variables
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = payroll_variables.workspace_id 
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage payroll variables" ON public.payroll_variables
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = payroll_variables.workspace_id 
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

-- employee_contracts - Users see own, admins see all
CREATE POLICY "Users can view own contracts" ON public.employee_contracts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = employee_contracts.workspace_id 
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage contracts" ON public.employee_contracts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = employee_contracts.workspace_id 
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

-- french_holidays - All members can read, admins can manage
CREATE POLICY "Members can view holidays" ON public.french_holidays
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = french_holidays.workspace_id 
    AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage holidays" ON public.french_holidays
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = french_holidays.workspace_id 
    AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_leave_balances_user ON public.leave_balances(workspace_id, user_id, period_year);
CREATE INDEX IF NOT EXISTS idx_leave_transactions_balance ON public.leave_balance_transactions(balance_id);
CREATE INDEX IF NOT EXISTS idx_payroll_variables_period ON public.payroll_variables(period_id, user_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_user ON public.employee_contracts(workspace_id, user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_french_holidays_date ON public.french_holidays(workspace_id, holiday_date);

-- =====================================================
-- FUNCTION: Calculate working days between two dates (excluding weekends and holidays)
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_working_days(
  p_workspace_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_start_half_day BOOLEAN DEFAULT false,
  p_end_half_day BOOLEAN DEFAULT false
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_days NUMERIC := 0;
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_is_holiday BOOLEAN;
BEGIN
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date)::INTEGER;
    
    -- Skip weekends (0 = Sunday, 6 = Saturday)
    IF v_day_of_week NOT IN (0, 6) THEN
      -- Check if it's a holiday
      SELECT EXISTS(
        SELECT 1 FROM public.french_holidays 
        WHERE workspace_id = p_workspace_id 
        AND holiday_date = v_current_date
        AND is_worked = false
      ) INTO v_is_holiday;
      
      IF NOT v_is_holiday THEN
        -- Count as working day
        IF v_current_date = p_start_date AND p_start_half_day THEN
          v_days := v_days + 0.5;
        ELSIF v_current_date = p_end_date AND p_end_half_day THEN
          v_days := v_days + 0.5;
        ELSE
          v_days := v_days + 1;
        END IF;
      END IF;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
  
  RETURN v_days;
END;
$$;