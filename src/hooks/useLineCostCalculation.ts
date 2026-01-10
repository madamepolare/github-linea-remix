import { useMemo } from 'react';
import { useSkills, useMemberSkills } from './useSkills';
import { useAllMemberEmploymentInfo } from './useMemberEmploymentInfo';
import { QuoteLine } from '@/types/quoteTypes';

// Working days per year in France (approximately)
const WORKING_DAYS_PER_YEAR = 218;

interface CostCalculationResult {
  calculatedPurchasePrice: number | undefined;
  costSource: 'manual' | 'skill' | 'member' | 'average' | 'none';
  effectivePurchasePrice: number;
  margin: number;
  marginPercentage: number;
  estimatedDays?: number;
}

/**
 * Check if unit is a day-based unit
 */
function isDayUnit(unit?: string): boolean {
  if (!unit) return false;
  const normalized = unit.toLowerCase().trim();
  return ['jour', 'jours', 'day', 'days', 'j'].includes(normalized);
}

/**
 * Calculate daily cost from annual salary
 * Formula: annual_salary / working_days_per_year
 */
function calculateDailyCostFromSalary(salaryAnnual: number | null): number {
  if (!salaryAnnual || salaryAnnual <= 0) return 0;
  return salaryAnnual / WORKING_DAYS_PER_YEAR;
}

/**
 * Hook to calculate purchase price for a quote line based on priority:
 * 1. If member assigned + day unit → use member's real cost (TJM) × quantity
 * 2. If member assigned + other unit → use average agency TJM to estimate days
 * 3. Assigned skill cost (cost_daily_rate × quantity)
 * 4. Manual purchase price (only if no member/skill)
 */
export function useLineCostCalculation(line: QuoteLine): CostCalculationResult {
  const { skills } = useSkills();
  const { memberSkills } = useMemberSkills(line.assigned_member_id);

  return useMemo(() => {
    let calculatedPurchasePrice: number | undefined = undefined;
    let costSource: 'manual' | 'skill' | 'member' | 'average' | 'none' = 'none';
    let estimatedDays: number | undefined = undefined;

    // Calculate average agency rates from skills
    const skillsWithRates = skills.filter(s => s.setting_value?.daily_rate > 0);
    const averageAgencySellRate = skillsWithRates.length > 0
      ? skillsWithRates.reduce((sum, s) => sum + (s.setting_value?.daily_rate || 0), 0) / skillsWithRates.length
      : 0;
    const skillsWithCost = skills.filter(s => s.setting_value?.cost_daily_rate > 0);
    const averageAgencyCostRate = skillsWithCost.length > 0
      ? skillsWithCost.reduce((sum, s) => sum + (s.setting_value?.cost_daily_rate || 0), 0) / skillsWithCost.length
      : 0;

    // Priority 1: Member assigned - use their real cost
    if (line.assigned_member_id && memberSkills.length > 0) {
      const memberSkill = memberSkills[0];
      const skillDef = skills.find(s => s.id === memberSkill.skill_id);
      const memberCostRate = memberSkill.custom_daily_rate || skillDef?.setting_value?.cost_daily_rate || 0;
      const memberSellRate = skillDef?.setting_value?.daily_rate || 0;

      if (isDayUnit(line.unit)) {
        // Day-based: member cost × quantity
        if (memberCostRate > 0) {
          calculatedPurchasePrice = memberCostRate * (line.quantity || 1);
          costSource = 'member';
          estimatedDays = line.quantity || 1;
        }
      } else {
        // Forfait: estimate days from amount / sell rate, then cost = days × cost rate
        const rateForEstimate = memberSellRate > 0 ? memberSellRate : averageAgencySellRate;
        if (rateForEstimate > 0 && (line.amount || 0) > 0) {
          estimatedDays = (line.amount || 0) / rateForEstimate;
          calculatedPurchasePrice = memberCostRate * estimatedDays;
          costSource = 'member';
        }
      }
    }
    // Priority 2: Assigned skill
    else if (line.assigned_skill) {
      const skillIds = parseSkillIds(line.assigned_skill);
      if (skillIds.length > 0) {
        const firstSkill = skills.find(s => s.id === skillIds[0]);
        const skillCostRate = firstSkill?.setting_value?.cost_daily_rate || 0;
        const skillSellRate = firstSkill?.setting_value?.daily_rate || 0;
        
        if (isDayUnit(line.unit)) {
          if (skillCostRate > 0) {
            calculatedPurchasePrice = skillCostRate * (line.quantity || 1);
            costSource = 'skill';
            estimatedDays = line.quantity || 1;
          }
        } else {
          // Forfait: estimate days from amount / sell rate, then cost = days × cost rate
          const rateForEstimate = skillSellRate > 0 ? skillSellRate : averageAgencySellRate;
          if (rateForEstimate > 0 && skillCostRate > 0 && (line.amount || 0) > 0) {
            estimatedDays = (line.amount || 0) / rateForEstimate;
            calculatedPurchasePrice = skillCostRate * estimatedDays;
            costSource = 'skill';
          }
        }
      }
    }
    // Priority 3: No member/skill - use average agency rates for forfaits
    else if (!isDayUnit(line.unit) && averageAgencySellRate > 0 && averageAgencyCostRate > 0 && (line.amount || 0) > 0) {
      estimatedDays = (line.amount || 0) / averageAgencySellRate;
      calculatedPurchasePrice = averageAgencyCostRate * estimatedDays;
      costSource = 'average';
    }
    // Priority 4: Manual purchase price (fallback only if nothing else)
    else if (line.purchase_price !== undefined && line.purchase_price > 0) {
      calculatedPurchasePrice = line.purchase_price;
      costSource = 'manual';
    }

    const effectivePurchasePrice = calculatedPurchasePrice || 0;
    const margin = (line.amount || 0) - effectivePurchasePrice;
    const marginPercentage = (line.amount && line.amount > 0) 
      ? ((margin / line.amount) * 100) 
      : 0;

    return {
      calculatedPurchasePrice,
      costSource,
      effectivePurchasePrice,
      margin,
      marginPercentage,
      estimatedDays,
    };
  }, [line, skills, memberSkills]);
}

/**
 * Batch calculation for multiple lines
 */
export function useLinesCostCalculation(lines: QuoteLine[]) {
  const { skills } = useSkills();
  const { memberSkills } = useMemberSkills();
  const { data: allEmploymentInfo } = useAllMemberEmploymentInfo();

  return useMemo(() => {
    // Calculate average agency sell rate from skills
    const skillsWithRates = skills.filter(s => s.setting_value?.daily_rate > 0);
    const averageAgencySellRate = skillsWithRates.length > 0
      ? skillsWithRates.reduce((sum, s) => sum + (s.setting_value?.daily_rate || 0), 0) / skillsWithRates.length
      : 0;

    // Calculate average agency cost rate from member salaries (CJM)
    const membersWithSalary = (allEmploymentInfo || []).filter(e => e.salary_monthly && e.salary_monthly > 0);
    const averageAgencyCostRate = membersWithSalary.length > 0
      ? membersWithSalary.reduce((sum, e) => sum + calculateDailyCostFromSalary(e.salary_monthly), 0) / membersWithSalary.length
      : 0;

    return lines.map(line => {
      let calculatedPurchasePrice: number | undefined = undefined;
      let costSource: 'manual' | 'skill' | 'member' | 'average' | 'none' = 'none';
      let estimatedDays: number | undefined = undefined;

      // Priority 1: Member assigned - use their salary-based CJM
      if (line.assigned_member_id) {
        const memberEmployment = (allEmploymentInfo || []).find(e => e.user_id === line.assigned_member_id);
        const memberCostRate = calculateDailyCostFromSalary(memberEmployment?.salary_monthly || null);
        
        // Get sell rate from member skills
        const memberSkillsForMember = memberSkills.filter(ms => ms.user_id === line.assigned_member_id);
        const memberSkill = memberSkillsForMember[0];
        const skillDef = memberSkill ? skills.find(s => s.id === memberSkill.skill_id) : null;
        const memberSellRate = skillDef?.setting_value?.daily_rate || 0;

        if (memberCostRate > 0) {
          if (isDayUnit(line.unit)) {
            // Day-based: member CJM × quantity
            calculatedPurchasePrice = memberCostRate * (line.quantity || 1);
            costSource = 'member';
            estimatedDays = line.quantity || 1;
          } else {
            // Forfait: estimate days from amount / sell rate, then cost = days × CJM
            const rateForEstimate = memberSellRate > 0 ? memberSellRate : averageAgencySellRate;
            if (rateForEstimate > 0 && (line.amount || 0) > 0) {
              estimatedDays = (line.amount || 0) / rateForEstimate;
              calculatedPurchasePrice = memberCostRate * estimatedDays;
              costSource = 'member';
            }
          }
        }
      }
      // Priority 2: Assigned skill - use average CJM
      else if (line.assigned_skill) {
        const skillIds = parseSkillIds(line.assigned_skill);
        if (skillIds.length > 0) {
          const firstSkill = skills.find(s => s.id === skillIds[0]);
          const skillSellRate = firstSkill?.setting_value?.daily_rate || 0;
          
          if (averageAgencyCostRate > 0) {
            if (isDayUnit(line.unit)) {
              calculatedPurchasePrice = averageAgencyCostRate * (line.quantity || 1);
              costSource = 'skill';
              estimatedDays = line.quantity || 1;
            } else {
              // Forfait: estimate days from amount / sell rate, then cost = days × average CJM
              const rateForEstimate = skillSellRate > 0 ? skillSellRate : averageAgencySellRate;
              if (rateForEstimate > 0 && (line.amount || 0) > 0) {
                estimatedDays = (line.amount || 0) / rateForEstimate;
                calculatedPurchasePrice = averageAgencyCostRate * estimatedDays;
                costSource = 'skill';
              }
            }
          }
        }
      }
      // Priority 3: No member/skill - use average agency rates for forfaits
      else if (!isDayUnit(line.unit) && averageAgencySellRate > 0 && averageAgencyCostRate > 0 && (line.amount || 0) > 0) {
        estimatedDays = (line.amount || 0) / averageAgencySellRate;
        calculatedPurchasePrice = averageAgencyCostRate * estimatedDays;
        costSource = 'average';
      }
      // Priority 4: Manual purchase price (fallback only if nothing else)
      else if (line.purchase_price !== undefined && line.purchase_price > 0) {
        calculatedPurchasePrice = line.purchase_price;
        costSource = 'manual';
      }

      const effectivePurchasePrice = calculatedPurchasePrice || 0;
      const margin = (line.amount || 0) - effectivePurchasePrice;
      const marginPercentage = (line.amount && line.amount > 0) 
        ? ((margin / line.amount) * 100) 
        : 0;

      return {
        lineId: line.id,
        calculatedPurchasePrice,
        costSource,
        effectivePurchasePrice,
        margin,
        marginPercentage,
        estimatedDays,
      };
    });
  }, [lines, skills, memberSkills, allEmploymentInfo]);
}

/**
 * Calculate totals for all lines including auto-calculated costs
 */
export function useQuoteTotalsWithCosts(lines: QuoteLine[]) {
  const linesCosts = useLinesCostCalculation(lines);
  const { skills } = useSkills();
  const { data: allEmploymentInfo } = useAllMemberEmploymentInfo();

  return useMemo(() => {
    const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
    const discountLines = lines.filter(l => l.line_type === 'discount');
    
    const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
    const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
    const totalHT = subtotal - totalDiscount;
    
    const totalPurchaseCost = linesCosts
      .filter(lc => {
        const line = lines.find(l => l.id === lc.lineId);
        return line?.is_included && line.line_type !== 'discount' && line.line_type !== 'group';
      })
      .reduce((sum, lc) => sum + lc.effectivePurchasePrice, 0);
    
    const totalMargin = totalHT - totalPurchaseCost;
    const totalMarginPercentage = totalHT > 0 ? (totalMargin / totalHT) * 100 : 0;

    // Calculate average agency sell rate from skills
    const skillsWithRates = skills.filter(s => s.setting_value?.daily_rate > 0);
    const averageAgencySellRate = skillsWithRates.length > 0
      ? skillsWithRates.reduce((sum, s) => sum + (s.setting_value?.daily_rate || 0), 0) / skillsWithRates.length
      : 0;

    // Calculate average agency cost rate from member salaries (CJM)
    const membersWithSalary = (allEmploymentInfo || []).filter(e => e.salary_monthly && e.salary_monthly > 0);
    const averageAgencyCostRate = membersWithSalary.length > 0
      ? membersWithSalary.reduce((sum, e) => sum + calculateDailyCostFromSalary(e.salary_monthly), 0) / membersWithSalary.length
      : 0;

    return {
      subtotal,
      totalDiscount,
      totalHT,
      totalPurchaseCost,
      totalMargin,
      totalMarginPercentage,
      linesCosts,
      averageAgencySellRate,
      averageAgencyCostRate,
    };
  }, [lines, linesCosts, skills, allEmploymentInfo]);
}

function parseSkillIds(value: string): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  return trimmed.split(',').map(s => s.trim()).filter(Boolean);
}
