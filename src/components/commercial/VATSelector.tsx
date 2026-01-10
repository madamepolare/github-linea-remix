import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Percent, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type VATType = 'standard' | 'reduced' | 'super_reduced' | 'exempt' | 'intra_eu' | 'export';

export interface VATConfig {
  vat_type: VATType;
  vat_rate: number;
}

export const VAT_TYPE_CONFIG: Record<VATType, { label: string; rate: number; description: string; color: string }> = {
  standard: { 
    label: 'Standard', 
    rate: 20, 
    description: 'Taux normal de TVA',
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  reduced: { 
    label: 'Réduit (10%)', 
    rate: 10, 
    description: 'Travaux de rénovation, restauration',
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  super_reduced: { 
    label: 'Super réduit (5.5%)', 
    rate: 5.5, 
    description: 'Travaux d\'amélioration énergétique',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  },
  exempt: { 
    label: 'Exonéré (0%)', 
    rate: 0, 
    description: 'Non assujetti à la TVA',
    color: 'bg-gray-100 text-gray-700 border-gray-200'
  },
  intra_eu: { 
    label: 'Intra-UE', 
    rate: 0, 
    description: 'Livraison intracommunautaire',
    color: 'bg-purple-100 text-purple-700 border-purple-200'
  },
  export: { 
    label: 'Export (0%)', 
    rate: 0, 
    description: 'Exportation hors UE',
    color: 'bg-amber-100 text-amber-700 border-amber-200'
  },
};

interface VATSelectorProps {
  value: VATConfig;
  onChange: (config: VATConfig) => void;
  className?: string;
  compact?: boolean;
  showCustomRate?: boolean;
}

export function VATSelector({ 
  value, 
  onChange, 
  className,
  compact = false,
  showCustomRate = false
}: VATSelectorProps) {
  const handleTypeChange = (type: VATType) => {
    const config = VAT_TYPE_CONFIG[type];
    onChange({
      vat_type: type,
      vat_rate: config.rate
    });
  };

  const handleRateChange = (rate: number) => {
    onChange({
      ...value,
      vat_rate: rate
    });
  };

  const currentConfig = VAT_TYPE_CONFIG[value.vat_type] || VAT_TYPE_CONFIG.standard;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Select value={value.vat_type} onValueChange={(v) => handleTypeChange(v as VATType)}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VAT_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span>{config.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className={cn("shrink-0", currentConfig.color)}>
          {value.vat_rate}%
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Percent className="h-3 w-3" />
            Type de TVA
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p className="font-medium mb-1">{currentConfig.label}</p>
                <p className="text-xs">{currentConfig.description}</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select value={value.vat_type} onValueChange={(v) => handleTypeChange(v as VATType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VAT_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span>{config.label}</span>
                    <Badge variant="outline" className={cn("text-xs", config.color)}>
                      {config.rate}%
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showCustomRate && (
          <div className="w-24 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Taux</Label>
            <div className="relative">
              <Input
                type="number"
                value={value.vat_rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                step={0.1}
                className="pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick description */}
      <p className="text-xs text-muted-foreground">
        {currentConfig.description}
      </p>
    </div>
  );
}

// Helper to get VAT amount
export function calculateVAT(amountHT: number, vatRate: number): number {
  return amountHT * (vatRate / 100);
}

// Helper to get TTC from HT
export function calculateTTC(amountHT: number, vatRate: number): number {
  return amountHT + calculateVAT(amountHT, vatRate);
}

// Helper to get HT from TTC
export function calculateHT(amountTTC: number, vatRate: number): number {
  return amountTTC / (1 + vatRate / 100);
}
