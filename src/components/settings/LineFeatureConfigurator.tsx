import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LineFeatureFlags, 
  LINE_FEATURE_LABELS, 
  LINE_FEATURE_DESCRIPTIONS,
  AMOUNT_CALCULATION_OPTIONS,
  getLineFeatures
} from '@/lib/lineFeatureConfig';
import { 
  Percent, 
  Euro, 
  Calendar, 
  User, 
  Briefcase, 
  FileText,
  Calculator,
  Package
} from 'lucide-react';

interface LineFeatureConfiguratorProps {
  contractCode: string;
  features?: LineFeatureFlags;
  onChange: (features: LineFeatureFlags) => void;
}

const FEATURE_ICONS: Partial<Record<keyof LineFeatureFlags, React.ReactNode>> = {
  showPercentageFee: <Percent className="h-4 w-4" />,
  showCostAndMargin: <Calculator className="h-4 w-4" />,
  showEstimatedDays: <Calendar className="h-4 w-4" />,
  showPurchasePrice: <Euro className="h-4 w-4" />,
  showSkillAssignment: <Briefcase className="h-4 w-4" />,
  showMemberAssignment: <User className="h-4 w-4" />,
  showDates: <Calendar className="h-4 w-4" />,
  showDeliverables: <FileText className="h-4 w-4" />,
  showBillingType: <Package className="h-4 w-4" />,
};

// Les features à afficher comme switches (exclut amountCalculation qui est un select)
const BOOLEAN_FEATURES: (keyof LineFeatureFlags)[] = [
  'showPercentageFee',
  'showCostAndMargin',
  'showEstimatedDays',
  'showPurchasePrice',
  'showSkillAssignment',
  'showMemberAssignment',
  'showDates',
  'showRecurrence',
  'showBillingType',
  'showPricingRef',
  'showDeliverables',
  'showMarginSummary',
];

export function LineFeatureConfigurator({ 
  contractCode, 
  features: customFeatures, 
  onChange 
}: LineFeatureConfiguratorProps) {
  // Fusionner les valeurs par défaut avec les customs
  const defaultFeatures = getLineFeatures(contractCode);
  const features: LineFeatureFlags = customFeatures || defaultFeatures;

  const handleToggle = (key: keyof LineFeatureFlags) => {
    const currentValue = features[key];
    if (typeof currentValue === 'boolean') {
      onChange({
        ...features,
        [key]: !currentValue,
      });
    }
  };

  const handleAmountCalculationChange = (value: 'percentage' | 'quantity_price' | 'fixed') => {
    onChange({
      ...features,
      amountCalculation: value,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Fonctionnalités des lignes</CardTitle>
        <CardDescription>
          Configurez les champs affichés dans les lignes de ce type de document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode de calcul */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mode de calcul des montants</Label>
          <Select
            value={features.amountCalculation}
            onValueChange={handleAmountCalculationChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AMOUNT_CALCULATION_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Détermine comment les montants des lignes sont calculés
          </p>
        </div>

        {/* Toggles pour les features booléennes */}
        <div className="grid grid-cols-2 gap-4">
          {BOOLEAN_FEATURES.map((key) => {
            const value = features[key];
            if (typeof value !== 'boolean') return null;
            
            const icon = FEATURE_ICONS[key];
            
            return (
              <div 
                key={key} 
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="p-2 rounded-md bg-background">
                      {icon}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium cursor-pointer">
                      {LINE_FEATURE_LABELS[key]}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {LINE_FEATURE_DESCRIPTIONS[key]}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={() => handleToggle(key)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
