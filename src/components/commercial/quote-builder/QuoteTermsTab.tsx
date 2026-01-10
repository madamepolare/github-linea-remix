import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileCheck, CreditCard } from 'lucide-react';
import { QuoteDocument } from '@/types/quoteTypes';

interface QuoteTermsTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
}

export function QuoteTermsTab({ document, onDocumentChange }: QuoteTermsTabProps) {
  return (
    <div className="space-y-6">
      {/* Validity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Validité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée de validité (jours)</Label>
              <Input
                type="number"
                value={document.validity_days || 30}
                onChange={(e) => onDocumentChange({ ...document, validity_days: parseInt(e.target.value) || 30 })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Date limite</Label>
              <Input
                type="date"
                value={document.valid_until || ''}
                onChange={(e) => onDocumentChange({ ...document, valid_until: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Conditions de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={document.payment_terms || ''}
            onChange={(e) => onDocumentChange({ ...document, payment_terms: e.target.value })}
            placeholder="Ex: 30% à la commande, 40% à mi-parcours, 30% à la livraison"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Special Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Conditions particulières
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={document.special_conditions || ''}
            onChange={(e) => onDocumentChange({ ...document, special_conditions: e.target.value })}
            placeholder="Conditions spécifiques à ce devis..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* General Conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Conditions générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={document.general_conditions || ''}
            onChange={(e) => onDocumentChange({ ...document, general_conditions: e.target.value })}
            placeholder="Conditions générales de vente..."
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Header / Footer */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">En-tête personnalisé</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={document.header_text || ''}
              onChange={(e) => onDocumentChange({ ...document, header_text: e.target.value })}
              placeholder="Texte d'introduction..."
              rows={3}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pied de page</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={document.footer_text || ''}
              onChange={(e) => onDocumentChange({ ...document, footer_text: e.target.value })}
              placeholder="Texte de conclusion..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
