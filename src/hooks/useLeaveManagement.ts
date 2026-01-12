import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

// =====================================================
// TYPES
// =====================================================

export type FrenchLeaveType = 
  | 'cp' | 'rtt' | 'anciennete' | 'fractionnement' 
  | 'maladie' | 'maternite' | 'paternite' | 'parental'
  | 'enfant_malade' | 'evenement_familial' | 'sans_solde'
  | 'formation' | 'compte_epargne' | 'autre';

export const LEAVE_TYPE_LABELS: Record<FrenchLeaveType, string> = {
  cp: "Congés payés",
  rtt: "RTT",
  anciennete: "Congés d'ancienneté",
  fractionnement: "Jours de fractionnement",
  maladie: "Arrêt maladie",
  maternite: "Congé maternité",
  paternite: "Congé paternité",
  parental: "Congé parental",
  enfant_malade: "Enfant malade",
  evenement_familial: "Événement familial",
  sans_solde: "Sans solde",
  formation: "Formation",
  compte_epargne: "CET",
  autre: "Autre",
};

export const LEAVE_TYPE_COLORS: Record<FrenchLeaveType, string> = {
  cp: "#3B82F6",      // Blue
  rtt: "#8B5CF6",     // Purple
  anciennete: "#6366F1", // Indigo
  fractionnement: "#06B6D4", // Cyan
  maladie: "#EF4444", // Red
  maternite: "#EC4899", // Pink
  paternite: "#14B8A6", // Teal
  parental: "#F59E0B", // Amber
  enfant_malade: "#F97316", // Orange
  evenement_familial: "#84CC16", // Lime
  sans_solde: "#6B7280", // Gray
  formation: "#10B981", // Emerald
  compte_epargne: "#0EA5E9", // Sky
  autre: "#9CA3AF",   // Gray
};

export interface LeaveTypeConfig {
  id: string;
  workspace_id: string;
  leave_type: FrenchLeaveType;
  label: string;
  color: string;
  is_paid: boolean;
  is_countable: boolean;
  annual_allowance: number;
  monthly_accrual: number;
  max_carry_over: number;
  requires_justification: boolean;
  min_notice_days: number;
  is_active: boolean;
  sort_order: number;
}

export interface LeaveBalance {
  id: string;
  workspace_id: string;
  user_id: string;
  leave_type: FrenchLeaveType;
  period_year: number;
  initial_balance: number;
  acquired: number;
  taken: number;
  pending: number;
  adjustment: number;
  last_accrual_date: string | null;
  notes: string | null;
}

export interface LeaveBalanceWithRemaining extends LeaveBalance {
  remaining: number;
}

export interface EmployeeContract {
  id: string;
  workspace_id: string;
  user_id: string;
  contract_type: 'cdi' | 'cdd' | 'alternance' | 'stage' | 'freelance';
  start_date: string;
  end_date: string | null;
  weekly_hours: number;
  is_executive: boolean;
  annual_days: number;
  cp_annual_days: number;
  rtt_annual_days: number;
  probation_end_date: string | null;
  seniority_start_date: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface PayrollPeriod {
  id: string;
  workspace_id: string;
  period_year: number;
  period_month: number;
  status: 'draft' | 'pending' | 'validated' | 'exported' | 'closed';
  start_date: string;
  end_date: string;
  validated_by: string | null;
  validated_at: string | null;
  exported_at: string | null;
  export_filename: string | null;
  notes: string | null;
}

export interface PayrollVariable {
  id: string;
  workspace_id: string;
  period_id: string;
  user_id: string;
  cp_taken: number;
  cp_remaining: number;
  rtt_taken: number;
  rtt_remaining: number;
  sick_days: number;
  sick_days_without_pay: number;
  unpaid_leave_days: number;
  training_days: number;
  total_worked_hours: number;
  overtime_hours: number;
  bonuses: Json | null;
  deductions: Json | null;
  notes: string | null;
}

export interface FrenchHoliday {
  id: string;
  workspace_id: string;
  holiday_date: string;
  name: string;
  is_worked: boolean;
}

// =====================================================
// LEAVE TYPE CONFIG
// =====================================================

export function useLeaveTypeConfig() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["leave-type-config", activeWorkspace?.id],
    queryFn: async (): Promise<LeaveTypeConfig[]> => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("leave_type_config")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order");

      if (error) throw error;
      return data as LeaveTypeConfig[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useInitializeLeaveTypeConfig() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!activeWorkspace) throw new Error("No workspace");

      // Default French leave types configuration
      const defaultConfigs = [
        { leave_type: 'cp', label: 'Congés payés', color: LEAVE_TYPE_COLORS.cp, is_paid: true, is_countable: true, annual_allowance: 25, monthly_accrual: 2.08, max_carry_over: 5, requires_justification: false, min_notice_days: 14, sort_order: 1 },
        { leave_type: 'rtt', label: 'RTT', color: LEAVE_TYPE_COLORS.rtt, is_paid: true, is_countable: true, annual_allowance: 0, monthly_accrual: 0, max_carry_over: 0, requires_justification: false, min_notice_days: 7, sort_order: 2 },
        { leave_type: 'maladie', label: 'Arrêt maladie', color: LEAVE_TYPE_COLORS.maladie, is_paid: true, is_countable: false, annual_allowance: 0, monthly_accrual: 0, max_carry_over: 0, requires_justification: true, min_notice_days: 0, sort_order: 3 },
        { leave_type: 'maternite', label: 'Congé maternité', color: LEAVE_TYPE_COLORS.maternite, is_paid: true, is_countable: false, annual_allowance: 0, monthly_accrual: 0, max_carry_over: 0, requires_justification: true, min_notice_days: 0, sort_order: 4 },
        { leave_type: 'paternite', label: 'Congé paternité', color: LEAVE_TYPE_COLORS.paternite, is_paid: true, is_countable: false, annual_allowance: 25, monthly_accrual: 0, max_carry_over: 0, requires_justification: true, min_notice_days: 0, sort_order: 5 },
        { leave_type: 'enfant_malade', label: 'Enfant malade', color: LEAVE_TYPE_COLORS.enfant_malade, is_paid: false, is_countable: true, annual_allowance: 3, monthly_accrual: 0, max_carry_over: 0, requires_justification: true, min_notice_days: 0, sort_order: 6 },
        { leave_type: 'sans_solde', label: 'Sans solde', color: LEAVE_TYPE_COLORS.sans_solde, is_paid: false, is_countable: false, annual_allowance: 0, monthly_accrual: 0, max_carry_over: 0, requires_justification: false, min_notice_days: 30, sort_order: 7 },
        { leave_type: 'formation', label: 'Formation', color: LEAVE_TYPE_COLORS.formation, is_paid: true, is_countable: false, annual_allowance: 0, monthly_accrual: 0, max_carry_over: 0, requires_justification: false, min_notice_days: 0, sort_order: 8 },
      ];

      for (const config of defaultConfigs) {
        await supabase
          .from("leave_type_config")
          .upsert({
            workspace_id: activeWorkspace.id,
            ...config,
            is_active: true,
          }, { onConflict: 'workspace_id,leave_type' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-type-config"] });
      toast({ title: "Configuration des congés initialisée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

// =====================================================
// LEAVE BALANCES
// =====================================================

export function useLeaveBalances(userId?: string, year?: number) {
  const { activeWorkspace, user } = useAuth();
  const targetYear = year || new Date().getFullYear();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["leave-balances", activeWorkspace?.id, targetUserId, targetYear],
    queryFn: async (): Promise<LeaveBalanceWithRemaining[]> => {
      if (!activeWorkspace || !targetUserId) return [];

      const { data, error } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", targetUserId)
        .eq("period_year", targetYear);

      if (error) throw error;
      
      return (data || []).map(balance => ({
        ...balance,
        remaining: balance.initial_balance + balance.acquired + balance.adjustment - balance.taken - balance.pending,
      })) as LeaveBalanceWithRemaining[];
    },
    enabled: !!activeWorkspace && !!targetUserId,
  });
}

export function useAllTeamBalances(year?: number) {
  const { activeWorkspace } = useAuth();
  const targetYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ["all-leave-balances", activeWorkspace?.id, targetYear],
    queryFn: async (): Promise<LeaveBalanceWithRemaining[]> => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("period_year", targetYear);

      if (error) throw error;
      
      return (data || []).map(balance => ({
        ...balance,
        remaining: balance.initial_balance + balance.acquired + balance.adjustment - balance.taken - balance.pending,
      })) as LeaveBalanceWithRemaining[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useUpdateLeaveBalance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeaveBalance> & { id: string }) => {
      const { error } = await supabase
        .from("leave_balances")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-balances"] });
      toast({ title: "Solde mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useCreateOrUpdateLeaveBalance() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      leave_type: FrenchLeaveType;
      period_year: number;
      initial_balance?: number;
      acquired?: number;
      adjustment?: number;
      notes?: string;
    }) => {
      if (!activeWorkspace) throw new Error("No workspace");

      const { error } = await supabase
        .from("leave_balances")
        .upsert({
          workspace_id: activeWorkspace.id,
          ...data,
        }, { onConflict: 'workspace_id,user_id,leave_type,period_year' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-balances"] });
      toast({ title: "Solde enregistré" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

// =====================================================
// EMPLOYEE CONTRACTS
// =====================================================

export function useEmployeeContracts(userId?: string) {
  const { activeWorkspace, user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["employee-contracts", activeWorkspace?.id, targetUserId],
    queryFn: async (): Promise<EmployeeContract[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("employee_contracts")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("start_date", { ascending: false });

      if (targetUserId) {
        query = query.eq("user_id", targetUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeContract[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreateEmployeeContract() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<EmployeeContract>) => {
      if (!activeWorkspace) throw new Error("No workspace");

      const { error } = await (supabase
        .from("employee_contracts") as any)
        .insert({
          workspace_id: activeWorkspace.id,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-contracts"] });
      toast({ title: "Contrat créé" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useUpdateEmployeeContract() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmployeeContract> & { id: string }) => {
      const { error } = await supabase
        .from("employee_contracts")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-contracts"] });
      toast({ title: "Contrat mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

// =====================================================
// PAYROLL PERIODS
// =====================================================

export function usePayrollPeriods(year?: number) {
  const { activeWorkspace } = useAuth();
  const targetYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ["payroll-periods", activeWorkspace?.id, targetYear],
    queryFn: async (): Promise<PayrollPeriod[]> => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("payroll_periods")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("period_year", targetYear)
        .order("period_month");

      if (error) throw error;
      return data as PayrollPeriod[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { year: number; month: number }) => {
      if (!activeWorkspace) throw new Error("No workspace");

      const startDate = new Date(data.year, data.month - 1, 1);
      const endDate = new Date(data.year, data.month, 0);

      const { error } = await supabase
        .from("payroll_periods")
        .insert({
          workspace_id: activeWorkspace.id,
          period_year: data.year,
          period_month: data.month,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'draft',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      toast({ title: "Période créée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useUpdatePayrollPeriod() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PayrollPeriod['status'] }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'validated') {
        updates.validated_by = user?.id;
        updates.validated_at = new Date().toISOString();
      } else if (status === 'exported') {
        updates.exported_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("payroll_periods")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      toast({ title: "Période mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

// =====================================================
// PAYROLL VARIABLES
// =====================================================

export function usePayrollVariables(periodId: string) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["payroll-variables", periodId],
    queryFn: async (): Promise<PayrollVariable[]> => {
      if (!activeWorkspace || !periodId) return [];

      const { data, error } = await supabase
        .from("payroll_variables")
        .select("*")
        .eq("period_id", periodId);

      if (error) throw error;
      return data as PayrollVariable[];
    },
    enabled: !!activeWorkspace && !!periodId,
  });
}

export function useGeneratePayrollVariables() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (periodId: string) => {
      if (!activeWorkspace) throw new Error("No workspace");

      // Get period info
      const { data: period } = await supabase
        .from("payroll_periods")
        .select("*")
        .eq("id", periodId)
        .single();

      if (!period) throw new Error("Period not found");

      // Get all workspace members
      const { data: members } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", activeWorkspace.id)
        .eq("is_hidden", false);

      if (!members) return;

      // Get absences for this period
      const { data: absences } = await supabase
        .from("team_absences")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("status", "approved")
        .gte("end_date", period.start_date)
        .lte("start_date", period.end_date);

      // Get leave balances for all users
      const { data: balances } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("period_year", period.period_year);

      // Generate variables for each member
      for (const member of members) {
        const userAbsences = absences?.filter(a => a.user_id === member.user_id) || [];
        const userBalances = balances?.filter(b => b.user_id === member.user_id) || [];

        // Calculate totals
        let cpTaken = 0;
        let rttTaken = 0;
        let sickDays = 0;
        let unpaidDays = 0;
        let trainingDays = 0;

        for (const absence of userAbsences) {
          const days = absence.working_days_count || 1;
          switch (absence.absence_type) {
            case 'conge_paye':
            case 'cp':
              cpTaken += days;
              break;
            case 'rtt':
              rttTaken += days;
              break;
            case 'maladie':
              sickDays += days;
              break;
            case 'sans_solde':
              unpaidDays += days;
              break;
            case 'formation':
              trainingDays += days;
              break;
          }
        }

        const cpBalance = userBalances.find(b => b.leave_type === 'cp');
        const rttBalance = userBalances.find(b => b.leave_type === 'rtt');

        const cpRemaining = cpBalance 
          ? cpBalance.initial_balance + cpBalance.acquired + cpBalance.adjustment - cpBalance.taken
          : 0;
        const rttRemaining = rttBalance
          ? rttBalance.initial_balance + rttBalance.acquired + rttBalance.adjustment - rttBalance.taken
          : 0;

        await supabase
          .from("payroll_variables")
          .upsert({
            workspace_id: activeWorkspace.id,
            period_id: periodId,
            user_id: member.user_id,
            cp_taken: cpTaken,
            cp_remaining: cpRemaining,
            rtt_taken: rttTaken,
            rtt_remaining: rttRemaining,
            sick_days: sickDays,
            unpaid_leave_days: unpaidDays,
            training_days: trainingDays,
          }, { onConflict: 'period_id,user_id' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-variables"] });
      toast({ title: "Variables de paie générées" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

// =====================================================
// FRENCH HOLIDAYS
// =====================================================

export function useFrenchHolidays(year?: number) {
  const { activeWorkspace } = useAuth();
  const targetYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ["french-holidays", activeWorkspace?.id, targetYear],
    queryFn: async (): Promise<FrenchHoliday[]> => {
      if (!activeWorkspace) return [];

      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;

      const { data, error } = await supabase
        .from("french_holidays")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .gte("holiday_date", startDate)
        .lte("holiday_date", endDate)
        .order("holiday_date");

      if (error) throw error;
      return data as FrenchHoliday[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useInitializeFrenchHolidays() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (year: number) => {
      if (!activeWorkspace) throw new Error("No workspace");

      // French public holidays for the given year
      const holidays = [
        { date: `${year}-01-01`, name: "Jour de l'An" },
        { date: `${year}-05-01`, name: "Fête du Travail" },
        { date: `${year}-05-08`, name: "Victoire 1945" },
        { date: `${year}-07-14`, name: "Fête Nationale" },
        { date: `${year}-08-15`, name: "Assomption" },
        { date: `${year}-11-01`, name: "Toussaint" },
        { date: `${year}-11-11`, name: "Armistice" },
        { date: `${year}-12-25`, name: "Noël" },
      ];

      // Add Easter-based holidays (calculated)
      const easter = calculateEaster(year);
      holidays.push(
        { date: addDays(easter, 1), name: "Lundi de Pâques" },
        { date: addDays(easter, 39), name: "Ascension" },
        { date: addDays(easter, 50), name: "Lundi de Pentecôte" },
      );

      for (const holiday of holidays) {
        await supabase
          .from("french_holidays")
          .upsert({
            workspace_id: activeWorkspace.id,
            holiday_date: holiday.date,
            name: holiday.name,
            is_worked: false,
          }, { onConflict: 'workspace_id,holiday_date' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["french-holidays"] });
      toast({ title: "Jours fériés initialisés" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

// Helper: Calculate Easter Sunday for a given year (Meeus/Jones/Butcher algorithm)
function calculateEaster(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Helper: Add days to a date string
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
