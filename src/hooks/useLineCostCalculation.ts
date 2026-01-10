import { useMemo } from 'react';
import { useSkills, useMemberSkills } from './useSkills';
import { QuoteLine } from '@/types/quoteTypes';

interface CostCalculationResult {
  calculatedPurchasePrice: number | undefined;
  costSource: 'manual' | 'skill' | 'member' | 'none';
  effectivePurchasePrice: number;
  margin: number;
  marginPercentage: number;
}

/**
 * Hook to calculate purchase price for a quote line based on priority:
 * 1. Manual purchase price (if set)
 * 2. Assigned skill cost (cost_daily_rate × quantity)
 * 3. Assigned member's skill cost
 */
export function useLineCostCalculation(line: QuoteLine): CostCalculationResult {
  const { skills } = useSkills();
  const { memberSkills } = useMemberSkills(line.assigned_member_id);

  return useMemo(() => {
    let calculatedPurchasePrice: number | undefined = undefined;
    let costSource: 'manual' | 'skill' | 'member' | 'none' = 'none';

    // Priority 1: Manual purchase price
    if (line.purchase_price !== undefined && line.purchase_price > 0) {
      calculatedPurchasePrice = line.purchase_price;
      costSource = 'manual';
    } 
    // Priority 2: Assigned skill
    else if (line.assigned_skill) {
      const skillIds = parseSkillIds(line.assigned_skill);
      if (skillIds.length > 0) {
        // Use the first skill's cost (or could average/sum if multiple)
        const firstSkill = skills.find(s => s.id === skillIds[0]);
        if (firstSkill?.setting_value?.cost_daily_rate) {
          const costPerUnit = firstSkill.setting_value.cost_daily_rate;
          calculatedPurchasePrice = costPerUnit * (line.quantity || 1);
          costSource = 'skill';
        }
      }
    }
    // Priority 3: Assigned member (via their skills)
    else if (line.assigned_member_id && memberSkills.length > 0) {
      // Find the member's first skill with a custom rate, or use default skill cost
      const memberSkill = memberSkills[0];
      if (memberSkill) {
        const skillDef = skills.find(s => s.id === memberSkill.skill_id);
        const costPerUnit = memberSkill.custom_daily_rate || skillDef?.setting_value?.cost_daily_rate || 0;
        if (costPerUnit > 0) {
          calculatedPurchasePrice = costPerUnit * (line.quantity || 1);
          costSource = 'member';
        }
      }
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
    return lines.map(line => {
      let calculatedPurchasePrice: number | undefined = undefined;
      let costSource: 'manual' | 'skill' | 'member' | 'none' = 'none';

      // Priority 1: Manual purchase price
      if (line.purchase_price !== undefined && line.purchase_price > 0) {
        calculatedPurchasePrice = line.purchase_price;
        costSource = 'manual';
      } 
      // Priority 2: Assigned skill
      else if (line.assigned_skill) {
        const skillIds = parseSkillIds(line.assigned_skill);
        if (skillIds.length > 0) {
          const firstSkill = skills.find(s => s.id === skillIds[0]);
          if (firstSkill?.setting_value?.cost_daily_rate) {
            const costPerUnit = firstSkill.setting_value.cost_daily_rate;
            calculatedPurchasePrice = costPerUnit * (line.quantity || 1);
            costSource = 'skill';
          }
        }
      }
      // Priority 3: Assigned member (via their skills)
      else if (line.assigned_member_id) {
        const memberSkillsForMember = memberSkills.filter(ms => ms.user_id === line.assigned_member_id);
        if (memberSkillsForMember.length > 0) {
          const memberSkill = memberSkillsForMember[0];
          const skillDef = skills.find(s => s.id === memberSkill.skill_id);
          const costPerUnit = memberSkill.custom_daily_rate || skillDef?.setting_value?.cost_daily_rate || 0;
          if (costPerUnit > 0) {
            calculatedPurchasePrice = costPerUnit * (line.quantity || 1);
            costSource = 'member';
          }
        }
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
      };
    });
  }, [lines, skills, memberSkills]);
}

/**
 * Calculate totals for all lines including auto-calculated costs
 */
export function useQuoteTotalsWithCosts(lines: QuoteLine[]) {
  const linesCosts = useLinesCostCalculation(lines);

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

    return {
      subtotal,
      totalDiscount,
      totalHT,
      totalPurchaseCost,
      totalMargin,
      totalMarginPercentage,
      linesCosts,
    };
  }, [lines, linesCosts]);
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
