import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommercialDocument } from '@/lib/commercialTypes';

interface TermsEditorProps {
  document: Partial<CommercialDocument>;
  onDocumentChange: (doc: Partial<CommercialDocument>) => void;
}

export function TermsEditor({
  document,
  onDocumentChange
}: TermsEditorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conditions de paiement</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={document.payment_terms || ''}
            onChange={(e) => onDocumentChange({ ...document, payment_terms: e.target.value })}
            placeholder="Définissez les conditions et l'échéancier de paiement..."
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions particulières</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={document.special_conditions || ''}
            onChange={(e) => onDocumentChange({ ...document, special_conditions: e.target.value })}
            placeholder="Ajoutez des conditions spécifiques à ce projet..."
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conditions générales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={document.general_conditions || ''}
            onChange={(e) => onDocumentChange({ ...document, general_conditions: e.target.value })}
            placeholder="Conditions générales du contrat..."
            rows={12}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Les conditions générales sont pré-remplies selon le type de projet. Vous pouvez les modifier selon vos besoins.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>En-tête et pied de page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>En-tête personnalisé</Label>
            <Textarea
              value={document.header_text || ''}
              onChange={(e) => onDocumentChange({ ...document, header_text: e.target.value })}
              placeholder="Texte d'introduction..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Pied de page</Label>
            <Textarea
              value={document.footer_text || ''}
              onChange={(e) => onDocumentChange({ ...document, footer_text: e.target.value })}
              placeholder="Mentions légales, informations de contact..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
