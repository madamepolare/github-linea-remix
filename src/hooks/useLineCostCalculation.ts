import { useMemo } from 'react';
import { useSkills, useMemberSkills } from './useSkills';
import { QuoteLine } from '@/types/quoteTypes';

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

    // Calculate average agency TJM (cost) from skills
    const skillsWithCost = skills.filter(s => s.setting_value?.cost_daily_rate > 0);
    const averageAgencyTJM = skillsWithCost.length > 0
      ? skillsWithCost.reduce((sum, s) => sum + (s.setting_value?.cost_daily_rate || 0), 0) / skillsWithCost.length
      : 0;

    // Priority 1: Member assigned - use their real cost
    if (line.assigned_member_id && memberSkills.length > 0) {
      const memberSkill = memberSkills[0];
      const skillDef = skills.find(s => s.id === memberSkill.skill_id);
      const memberTJM = memberSkill.custom_daily_rate || skillDef?.setting_value?.cost_daily_rate || 0;

      if (isDayUnit(line.unit)) {
        // Day-based: member TJM × quantity
        if (memberTJM > 0) {
          calculatedPurchasePrice = memberTJM * (line.quantity || 1);
          costSource = 'member';
          estimatedDays = line.quantity || 1;
        }
      } else {
        // Forfait/other: estimate days from amount / member TJM
        if (memberTJM > 0 && (line.amount || 0) > 0) {
          estimatedDays = (line.amount || 0) / memberTJM;
          calculatedPurchasePrice = memberTJM * estimatedDays;
          costSource = 'member';
        }
      }
    }
    // Priority 2: Assigned skill
    else if (line.assigned_skill) {
      const skillIds = parseSkillIds(line.assigned_skill);
      if (skillIds.length > 0) {
        const firstSkill = skills.find(s => s.id === skillIds[0]);
        const skillCost = firstSkill?.setting_value?.cost_daily_rate || 0;
        
        if (isDayUnit(line.unit)) {
          if (skillCost > 0) {
            calculatedPurchasePrice = skillCost * (line.quantity || 1);
            costSource = 'skill';
            estimatedDays = line.quantity || 1;
          }
        } else {
          // Forfait: estimate days from amount / skill cost
          if (skillCost > 0 && (line.amount || 0) > 0) {
            estimatedDays = (line.amount || 0) / skillCost;
            calculatedPurchasePrice = skillCost * estimatedDays;
            costSource = 'skill';
          }
        }
      }
    }
    // Priority 3: No member/skill - use average agency TJM for forfaits
    else if (!isDayUnit(line.unit) && averageAgencyTJM > 0 && (line.amount || 0) > 0) {
      estimatedDays = (line.amount || 0) / averageAgencyTJM;
      calculatedPurchasePrice = averageAgencyTJM * estimatedDays;
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

  return useMemo(() => {
    // Calculate average agency TJM (cost) from skills
    const skillsWithCost = skills.filter(s => s.setting_value?.cost_daily_rate > 0);
    const averageAgencyTJM = skillsWithCost.length > 0
      ? skillsWithCost.reduce((sum, s) => sum + (s.setting_value?.cost_daily_rate || 0), 0) / skillsWithCost.length
      : 0;

    return lines.map(line => {
      let calculatedPurchasePrice: number | undefined = undefined;
      let costSource: 'manual' | 'skill' | 'member' | 'average' | 'none' = 'none';
      let estimatedDays: number | undefined = undefined;

      // Priority 1: Member assigned - use their real cost
      if (line.assigned_member_id) {
        const memberSkillsForMember = memberSkills.filter(ms => ms.user_id === line.assigned_member_id);
        if (memberSkillsForMember.length > 0) {
          const memberSkill = memberSkillsForMember[0];
          const skillDef = skills.find(s => s.id === memberSkill.skill_id);
          const memberTJM = memberSkill.custom_daily_rate || skillDef?.setting_value?.cost_daily_rate || 0;

          if (isDayUnit(line.unit)) {
            // Day-based: member TJM × quantity
            if (memberTJM > 0) {
              calculatedPurchasePrice = memberTJM * (line.quantity || 1);
              costSource = 'member';
              estimatedDays = line.quantity || 1;
            }
          } else {
            // Forfait/other: estimate days from amount / member TJM
            if (memberTJM > 0 && (line.amount || 0) > 0) {
              estimatedDays = (line.amount || 0) / memberTJM;
              calculatedPurchasePrice = memberTJM * estimatedDays;
              costSource = 'member';
            }
          }
        }
      }
      // Priority 2: Assigned skill
      else if (line.assigned_skill) {
        const skillIds = parseSkillIds(line.assigned_skill);
        if (skillIds.length > 0) {
          const firstSkill = skills.find(s => s.id === skillIds[0]);
          const skillCost = firstSkill?.setting_value?.cost_daily_rate || 0;
          
          if (isDayUnit(line.unit)) {
            if (skillCost > 0) {
              calculatedPurchasePrice = skillCost * (line.quantity || 1);
              costSource = 'skill';
              estimatedDays = line.quantity || 1;
            }
          } else {
            // Forfait: estimate days from amount / skill cost
            if (skillCost > 0 && (line.amount || 0) > 0) {
              estimatedDays = (line.amount || 0) / skillCost;
              calculatedPurchasePrice = skillCost * estimatedDays;
              costSource = 'skill';
            }
          }
        }
      }
      // Priority 3: No member/skill - use average agency TJM for forfaits
      else if (!isDayUnit(line.unit) && averageAgencyTJM > 0 && (line.amount || 0) > 0) {
        estimatedDays = (line.amount || 0) / averageAgencyTJM;
        calculatedPurchasePrice = averageAgencyTJM * estimatedDays;
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
  }, [lines, skills, memberSkills]);
}

/**
 * Calculate totals for all lines including auto-calculated costs
 */
export function useQuoteTotalsWithCosts(lines: QuoteLine[]) {
  const linesCosts = useLinesCostCalculation(lines);
  const { skills } = useSkills();

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

    // Calculate average agency TJM
    const skillsWithCost = skills.filter(s => s.setting_value?.cost_daily_rate > 0);
    const averageAgencyTJM = skillsWithCost.length > 0
      ? skillsWithCost.reduce((sum, s) => sum + (s.setting_value?.cost_daily_rate || 0), 0) / skillsWithCost.length
      : 0;

    return {
      subtotal,
      totalDiscount,
      totalHT,
      totalPurchaseCost,
      totalMargin,
      totalMarginPercentage,
      linesCosts,
      averageAgencyTJM,
    };
  }, [lines, linesCosts, skills]);
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
