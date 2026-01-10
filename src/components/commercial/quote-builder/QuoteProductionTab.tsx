import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calculator,
  Building2
} from 'lucide-react';
import { QuoteDocument, QuoteLine, LINE_TYPE_LABELS, LINE_TYPE_COLORS } from '@/types/quoteTypes';

interface QuoteProductionTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
}

const PRODUCTION_LINE_TYPES = [
  { value: 'purchase', label: 'Achat / Fourniture', color: 'bg-blue-100 text-blue-800' },
  { value: 'subcontract', label: 'Sous-traitance', color: 'bg-purple-100 text-purple-800' },
  { value: 'rental', label: 'Location', color: 'bg-orange-100 text-orange-800' },
  { value: 'transport', label: 'Transport', color: 'bg-green-100 text-green-800' },
  { value: 'installation', label: 'Installation', color: 'bg-red-100 text-red-800' },
];

export function QuoteProductionTab({ 
  document, 
  onDocumentChange, 
  lines, 
  onLinesChange 
}: QuoteProductionTabProps) {
  const [defaultMargin, setDefaultMargin] = useState(20);

  // Filter production lines
  const productionLines = useMemo(() => 
    lines.filter(l => ['purchase', 'subcontract', 'rental', 'transport', 'installation'].includes(l.line_type || '')),
    [lines]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const purchaseTotal = productionLines.reduce((sum, l) => sum + (l.purchase_price || 0), 0);
    const sellingTotal = productionLines.reduce((sum, l) => sum + (l.amount || 0), 0);
    const marginTotal = sellingTotal - purchaseTotal;
    const marginPercentage = purchaseTotal > 0 ? (marginTotal / purchaseTotal) * 100 : 0;
    
    return { purchaseTotal, sellingTotal, marginTotal, marginPercentage };
  }, [productionLines]);

  const handleAddLine = (type: string) => {
    const newLine: QuoteLine = {
      id: `prod-${Date.now()}`,
      phase_name: '',
      line_type: type as QuoteLine['line_type'],
      unit: 'u',
      quantity: 1,
      unit_price: 0,
      purchase_price: 0,
      margin_percentage: defaultMargin,
      amount: 0,
      is_included: true,
      is_optional: false,
      billing_type: 'one_time',
      sort_order: lines.length,
      deliverables: []
    };
    onLinesChange([...lines, newLine]);
  };

  const handleUpdateLine = (lineId: string, updates: Partial<QuoteLine>) => {
    onLinesChange(lines.map(l => {
      if (l.id !== lineId) return l;
      
      const updated = { ...l, ...updates };
      
      // Recalculate amount based on purchase price and margin
      if ('purchase_price' in updates || 'margin_percentage' in updates || 'quantity' in updates) {
        const purchasePrice = updated.purchase_price || 0;
        const margin = updated.margin_percentage || 0;
        const quantity = updated.quantity || 1;
        const unitPrice = purchasePrice * (1 + margin / 100);
        updated.unit_price = unitPrice;
        updated.amount = unitPrice * quantity;
      }
      
      return updated;
    }));
  };

  const handleDeleteLine = (lineId: string) => {
    onLinesChange(lines.filter(l => l.id !== lineId));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const getTypeConfig = (type: string) => 
    PRODUCTION_LINE_TYPES.find(t => t.value === type) || PRODUCTION_LINE_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Coût d'achat</div>
            <div className="text-lg font-bold">{formatCurrency(totals.purchaseTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Prix de vente</div>
            <div className="text-lg font-bold text-primary">{formatCurrency(totals.sellingTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Marge brute</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(totals.marginTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Taux de marge</div>
            <div className="text-lg font-bold">{totals.marginPercentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Default Margin Setting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Paramètres de marge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label>Marge par défaut (%)</Label>
            <Input
              type="number"
              value={defaultMargin}
              onChange={(e) => setDefaultMargin(parseFloat(e.target.value) || 0)}
              className="w-24"
              step="5"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                onLinesChange(lines.map(l => {
                  if (!['purchase', 'subcontract', 'rental', 'transport', 'installation'].includes(l.line_type || '')) {
                    return l;
                  }
                  const purchasePrice = l.purchase_price || 0;
                  const unitPrice = purchasePrice * (1 + defaultMargin / 100);
                  return {
                    ...l,
                    margin_percentage: defaultMargin,
                    unit_price: unitPrice,
                    amount: unitPrice * (l.quantity || 1)
                  };
                }));
              }}
            >
              Appliquer à toutes les lignes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Production Lines */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Coûts de production
            </CardTitle>
            <div className="flex gap-2">
              {PRODUCTION_LINE_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddLine(type.value)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {productionLines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun coût de production</p>
              <p className="text-sm">Ajoutez des achats, de la sous-traitance ou des locations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20 text-right">Qté</TableHead>
                  <TableHead className="w-28 text-right">Coût unit.</TableHead>
                  <TableHead className="w-20 text-right">Marge %</TableHead>
                  <TableHead className="w-28 text-right">PV unit.</TableHead>
                  <TableHead className="w-28 text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionLines.map((line) => {
                  const typeConfig = getTypeConfig(line.line_type || 'purchase');
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Badge className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.phase_name}
                          onChange={(e) => handleUpdateLine(line.id, { phase_name: e.target.value })}
                          placeholder="Description..."
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.quantity || 1}
                          onChange={(e) => handleUpdateLine(line.id, { quantity: parseFloat(e.target.value) || 1 })}
                          className="w-16 h-8 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.purchase_price || ''}
                          onChange={(e) => handleUpdateLine(line.id, { purchase_price: parseFloat(e.target.value) || 0 })}
                          className="w-24 h-8 text-right"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.margin_percentage || defaultMargin}
                          onChange={(e) => handleUpdateLine(line.id, { margin_percentage: parseFloat(e.target.value) || 0 })}
                          className="w-16 h-8 text-right"
                          step="5"
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(line.unit_price || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteLine(line.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Vendor/Supplier Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Fournisseurs associés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Associez des fournisseurs à vos lignes de production pour un meilleur suivi.
          </p>
          {/* TODO: Add supplier selection per line */}
        </CardContent>
      </Card>
    </div>
  );
}