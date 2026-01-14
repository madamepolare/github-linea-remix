import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Receipt } from 'lucide-react';
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
import { useApplyClientBilling } from '@/hooks/useClientBilling';

interface Project {
  id: string;
  name: string;
  address?: string | null;
}

interface Company {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  siret?: string | null;
  vat_number?: string | null;
}

interface InvoicePhase {
  code: string;
  name: string;
  amount: number;
  percentage_invoiced: number;
}

interface InvoiceEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  projects: Project[];
  companies: Company[];
}

export function InvoiceEditor({ content, onChange, projects, companies }: InvoiceEditorProps) {
  const { fetchBillingInfo } = useApplyClientBilling();
  
  const updateField = (key: string, value: unknown) => {
    onChange({ ...content, [key]: value });
  };

  const phases = (content.phases as InvoicePhase[]) || [];
  const tvaRate = (content.tva_rate as number) ?? 20;

  const addPhase = () => {
    updateField('phases', [...phases, { code: '', name: '', amount: 0, percentage_invoiced: 100 }]);
  };

  const removePhase = (index: number) => {
    updateField('phases', phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, field: keyof InvoicePhase, value: string | number) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    updateField('phases', updated);
    recalculateTotals(updated, tvaRate);
  };

  const recalculateTotals = (updatedPhases: InvoicePhase[], rate: number) => {
    const subtotal = updatedPhases.reduce((sum, phase) => {
      return sum + (phase.amount * phase.percentage_invoiced / 100);
    }, 0);
    const tvaAmount = subtotal * (rate / 100);
    const total = subtotal + tvaAmount;
    
    onChange({
      ...content,
      phases: updatedPhases,
      subtotal,
      tva_amount: tvaAmount,
      total,
      tva_rate: rate,
    });
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      updateField('project_id', projectId);
      updateField('project_name', project.name);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      updateField('company_id', companyId);
      updateField('client_name', company.name);
      updateField('client_address', [company.address, company.city].filter(Boolean).join(', '));
      updateField('client_siret', company.siret || '');
      updateField('client_vat_number', company.vat_number || '');
      
      // Fetch billing profile for VAT and payment info
      const billingInfo = await fetchBillingInfo(companyId);
      if (billingInfo) {
        // Apply VAT settings from billing profile
        if (billingInfo.vat_rate !== undefined) {
          updateField('tva_rate', billingInfo.vat_rate);
          recalculateTotals(phases, billingInfo.vat_rate);
        }
        if (billingInfo.vat_type) {
          updateField('vat_type', billingInfo.vat_type);
        }
        // Apply payment terms
        if (billingInfo.payment_terms) {
          updateField('payment_terms', billingInfo.payment_terms);
        }
        // Apply bank details if available
        if (billingInfo.iban) {
          updateField('bank_iban', billingInfo.iban);
        }
        if (billingInfo.bic) {
          updateField('bank_bic', billingInfo.bic);
        }
        if (billingInfo.bank_name) {
          updateField('bank_name', billingInfo.bank_name);
        }
        // Apply billing address if different from company address
        if (billingInfo.billing_address) {
          updateField('client_address', [billingInfo.billing_address, billingInfo.billing_postal_code, billingInfo.billing_city].filter(Boolean).join(', '));
        }
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getVATLabel = (vatType?: string) => {
    const typeLabels: Record<string, string> = {
      standard: 'Standard',
      normal: 'Normal',
      reduced: 'Réduit',
      super_reduced: 'Super réduit',
      exempt: 'Exonéré',
      intra: 'Intra-UE',
      export: 'Export',
    };
    return typeLabels[vatType || 'standard'] || 'Standard';
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Informations de facturation</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de facturation</Label>
          <Input
            type="date"
            value={(content.invoice_date as string) || ''}
            onChange={(e) => updateField('invoice_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Date d'échéance</Label>
          <Input
            type="date"
            value={(content.due_date as string) || ''}
            onChange={(e) => updateField('due_date', e.target.value)}
          />
        </div>
      </div>

      <h4 className="font-medium pt-4">Client</h4>

      <div className="space-y-2">
        <Label>Sélectionner une entreprise</Label>
        <Select
          value={(content.company_id as string) || undefined}
          onValueChange={handleCompanyChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un client" />
          </SelectTrigger>
          <SelectContent>
            {companies.filter(c => c.id).length === 0 ? (
              <SelectItem value="_empty" disabled>Aucune entreprise disponible</SelectItem>
            ) : (
              companies.filter(c => c.id).map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom du client</Label>
          <Input
            value={(content.client_name as string) || ''}
            onChange={(e) => updateField('client_name', e.target.value)}
            placeholder="Nom ou raison sociale"
          />
        </div>
        <div className="space-y-2">
          <Label>Adresse de facturation</Label>
          <Input
            value={(content.client_address as string) || ''}
            onChange={(e) => updateField('client_address', e.target.value)}
            placeholder="Adresse complète"
          />
        </div>
      </div>

      <h4 className="font-medium pt-4">Projet</h4>

      <div className="space-y-2">
        <Label>Projet concerné</Label>
        <Select
          value={(content.project_id as string) || undefined}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un projet" />
          </SelectTrigger>
          <SelectContent>
            {projects.filter(p => p.id).length === 0 ? (
              <SelectItem value="_empty" disabled>Aucun projet disponible</SelectItem>
            ) : (
              projects.filter(p => p.id).map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <h4 className="font-medium pt-4">Phases facturées</h4>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead className="w-[120px]">Montant HT</TableHead>
              <TableHead className="w-[100px]">% facturé</TableHead>
              <TableHead className="w-[120px]">Montant</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phases.map((phase, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={phase.code}
                    onChange={(e) => updatePhase(index, 'code', e.target.value)}
                    placeholder="ESQ"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={phase.name}
                    onChange={(e) => updatePhase(index, 'name', e.target.value)}
                    placeholder="Esquisse"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={phase.amount}
                    onChange={(e) => updatePhase(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={phase.percentage_invoiced}
                    onChange={(e) => updatePhase(index, 'percentage_invoiced', parseFloat(e.target.value) || 0)}
                    className="h-8"
                    min={0}
                    max={100}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(phase.amount * phase.percentage_invoiced / 100)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removePhase(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" onClick={addPhase}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une phase
      </Button>

      {/* Totals */}
      <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
        <div className="flex justify-between">
          <span>Total HT</span>
          <span className="font-medium">{formatCurrency((content.subtotal as number) || 0)}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>TVA</span>
            <Input
              type="number"
              value={tvaRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value) || 0;
                updateField('tva_rate', rate);
                recalculateTotals(phases, rate);
              }}
              className="w-16 h-7"
            />
            <span>%</span>
          </div>
          <span className="font-medium">{formatCurrency((content.tva_amount as number) || 0)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total TTC</span>
          <span>{formatCurrency((content.total as number) || 0)}</span>
        </div>
      </div>

      <h4 className="font-medium pt-4">Conditions de paiement</h4>

      <div className="space-y-2">
        <Label>Modalités de règlement</Label>
        <Textarea
          value={(content.payment_terms as string) || 'Paiement à 30 jours à compter de la date de facturation.'}
          onChange={(e) => updateField('payment_terms', e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>IBAN</Label>
          <Input
            value={(content.bank_iban as string) || ''}
            onChange={(e) => updateField('bank_iban', e.target.value)}
            placeholder="FR76 ..."
          />
        </div>
        <div className="space-y-2">
          <Label>BIC</Label>
          <Input
            value={(content.bank_bic as string) || ''}
            onChange={(e) => updateField('bank_bic', e.target.value)}
            placeholder="BNPAFRPP"
          />
        </div>
        <div className="space-y-2">
          <Label>Banque</Label>
          <Input
            value={(content.bank_name as string) || ''}
            onChange={(e) => updateField('bank_name', e.target.value)}
            placeholder="Nom de la banque"
          />
        </div>
      </div>
    </div>
  );
}
