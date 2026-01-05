import { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  X,
  Save,
  Send,
  Download,
  Plus,
  Trash2,
  Building2,
  FolderOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Info,
  Import,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCRMCompanies } from '@/hooks/useCRMCompanies';
import { useProjects } from '@/hooks/useProjects';
import { useInvoice, useCreateInvoice, useUpdateInvoice, InvoiceItem } from '@/hooks/useInvoices';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { InvoiceLivePreview } from './InvoiceLivePreview';
import { cn } from '@/lib/utils';
import { DOCUMENT_TYPE_LABELS, STATUS_LABELS } from '@/lib/commercialTypes';

interface InvoiceBuilderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string;
  preselectedCommercialDocumentId?: string;
}

const UNITS = [
  { value: 'unité', label: 'Unité' },
  { value: 'heure', label: 'Heure' },
  { value: 'jour', label: 'Jour' },
  { value: 'forfait', label: 'Forfait' },
  { value: 'm²', label: 'm²' },
  { value: 'ml', label: 'ml' },
  { value: 'lot', label: 'Lot' },
];

const PAYMENT_METHODS = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'prelevement', label: 'Prélèvement' },
  { value: 'especes', label: 'Espèces' },
];

export function InvoiceBuilderSheet({ open, onOpenChange, invoiceId, preselectedCommercialDocumentId }: InvoiceBuilderSheetProps) {
  const { data: existingInvoice, isLoading: loadingInvoice } = useInvoice(invoiceId);
  const { companies } = useCRMCompanies();
  const { projects } = useProjects();
  const { agencyInfo } = useAgencyInfo();
  const { documents: commercialDocuments, getDocumentPhases } = useCommercialDocuments();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [activeTab, setActiveTab] = useState('general');
  const [showPreview, setShowPreview] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [chorusOpen, setChorusOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCommercialDocId, setSelectedCommercialDocId] = useState<string | null>(preselectedCommercialDocumentId || null);

  // Get accepted commercial documents (quotes/contracts that can be invoiced)
  const acceptedDocuments = commercialDocuments.filter(d => 
    d.status === 'accepted' || d.status === 'signed'
  );

  // Form state
  const [formData, setFormData] = useState({
    invoice_type: 'standard',
    status: 'draft',
    client_company_id: '',
    client_name: '',
    client_address: '',
    client_city: '',
    client_postal_code: '',
    client_siret: '',
    client_vat_number: '',
    project_id: '',
    project_name: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    tva_rate: 20,
    payment_terms: 'Paiement à 30 jours à compter de la date de facturation.',
    payment_method: 'virement',
    bank_name: '',
    bank_iban: '',
    bank_bic: '',
    header_text: '',
    footer_text: '',
    notes: '',
    internal_notes: '',
    chorus_pro_enabled: false,
    chorus_pro_service_code: '',
    chorus_pro_engagement_number: '',
  });

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    {
      item_type: 'service',
      code: '',
      description: '',
      quantity: 1,
      unit: 'forfait',
      unit_price: 0,
      discount_percentage: 0,
      tva_rate: 20,
      amount_ht: 0,
      amount_tva: 0,
      amount_ttc: 0,
      percentage_completed: 100,
      sort_order: 0,
    },
  ]);

  // Load existing invoice data
  useEffect(() => {
    if (existingInvoice) {
      setFormData({
        invoice_type: existingInvoice.invoice_type || 'standard',
        status: existingInvoice.status || 'draft',
        client_company_id: existingInvoice.client_company_id || '',
        client_name: existingInvoice.client_name || '',
        client_address: existingInvoice.client_address || '',
        client_city: existingInvoice.client_city || '',
        client_postal_code: existingInvoice.client_postal_code || '',
        client_siret: existingInvoice.client_siret || '',
        client_vat_number: existingInvoice.client_vat_number || '',
        project_id: existingInvoice.project_id || '',
        project_name: existingInvoice.project_name || '',
        invoice_date: existingInvoice.invoice_date || format(new Date(), 'yyyy-MM-dd'),
        due_date: existingInvoice.due_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        tva_rate: existingInvoice.tva_rate || 20,
        payment_terms: existingInvoice.payment_terms || '',
        payment_method: existingInvoice.payment_method || 'virement',
        bank_name: existingInvoice.bank_name || '',
        bank_iban: existingInvoice.bank_iban || '',
        bank_bic: existingInvoice.bank_bic || '',
        header_text: existingInvoice.header_text || '',
        footer_text: existingInvoice.footer_text || '',
        notes: existingInvoice.notes || '',
        internal_notes: existingInvoice.internal_notes || '',
        chorus_pro_enabled: existingInvoice.chorus_pro_enabled || false,
        chorus_pro_service_code: existingInvoice.chorus_pro_service_code || '',
        chorus_pro_engagement_number: existingInvoice.chorus_pro_engagement_number || '',
      });

      if (existingInvoice.items && existingInvoice.items.length > 0) {
        setItems(existingInvoice.items);
      }
    } else if (!invoiceId) {
      // Reset form for new invoice
      setFormData({
        invoice_type: 'standard',
        status: 'draft',
        client_company_id: '',
        client_name: '',
        client_address: '',
        client_city: '',
        client_postal_code: '',
        client_siret: '',
        client_vat_number: '',
        project_id: '',
        project_name: '',
        invoice_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        tva_rate: 20,
        payment_terms: 'Paiement à 30 jours à compter de la date de facturation.',
        payment_method: 'virement',
        bank_name: '',
        bank_iban: '',
        bank_bic: '',
        header_text: '',
        footer_text: '',
        notes: '',
        internal_notes: '',
        chorus_pro_enabled: false,
        chorus_pro_service_code: '',
        chorus_pro_engagement_number: '',
      });
      setItems([{
        item_type: 'service',
        code: '',
        description: '',
        quantity: 1,
        unit: 'forfait',
        unit_price: 0,
        discount_percentage: 0,
        tva_rate: 20,
        amount_ht: 0,
        amount_tva: 0,
        amount_ttc: 0,
        percentage_completed: 100,
        sort_order: 0,
      }]);
    }
  }, [existingInvoice, invoiceId, agencyInfo]);

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (companyId: string) => {
    const company = companies?.find(c => c.id === companyId);
    if (company) {
      setFormData(prev => ({
        ...prev,
        client_company_id: companyId,
        client_name: company.name,
        client_address: company.address || '',
        client_city: company.city || '',
        client_postal_code: company.postal_code || '',
        client_siret: '',
        client_vat_number: '',
      }));
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (project) {
      setFormData(prev => ({
        ...prev,
        project_id: projectId,
        project_name: project.name,
      }));
    }
  };

  // Import from commercial document
  const handleImportFromDocument = async (docId: string) => {
    const doc = commercialDocuments.find(d => d.id === docId);
    if (!doc) return;

    // Set client info
    if (doc.client_company_id) {
      const company = companies?.find(c => c.id === doc.client_company_id);
      if (company) {
        setFormData(prev => ({
          ...prev,
          client_company_id: doc.client_company_id!,
          client_name: company.name,
          client_address: company.address || '',
          client_city: company.city || '',
          client_postal_code: company.postal_code || '',
        }));
      }
    }

    // Set project info if linked
    if (doc.project_id) {
      const project = projects?.find(p => p.id === doc.project_id);
      if (project) {
        setFormData(prev => ({
          ...prev,
          project_id: doc.project_id!,
          project_name: project.name,
        }));
      }
    }

    // Fetch phases to create invoice items
    try {
      const { data: phases, error } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/commercial_document_phases?document_id=eq.${docId}&order=sort_order`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      ).then(r => r.json());

      if (phases && phases.length > 0) {
        const includedPhases = phases.filter((p: any) => p.is_included);
        const newItems: Partial<InvoiceItem>[] = includedPhases.map((phase: any, index: number) => ({
          item_type: 'phase',
          code: phase.phase_code,
          description: phase.phase_name,
          detailed_description: phase.phase_description,
          quantity: 1,
          unit: 'forfait',
          unit_price: phase.amount || 0,
          discount_percentage: 0,
          tva_rate: formData.tva_rate,
          amount_ht: phase.amount || 0,
          amount_tva: (phase.amount || 0) * (formData.tva_rate / 100),
          amount_ttc: (phase.amount || 0) * (1 + formData.tva_rate / 100),
          phase_id: phase.id,
          phase_name: phase.phase_name,
          percentage_completed: 100,
          sort_order: index,
        }));

        if (newItems.length > 0) {
          setItems(newItems);
        }
      }
    } catch (error) {
      console.error('Error fetching phases:', error);
    }

    // Update form with commercial document reference
    setFormData(prev => ({
      ...prev,
      header_text: prev.header_text || `Référence devis : ${doc.document_number}`,
    }));

    setImportDialogOpen(false);
    setSelectedCommercialDocId(docId);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      item_type: 'service',
      code: '',
      description: '',
      quantity: 1,
      unit: 'forfait',
      unit_price: 0,
      discount_percentage: 0,
      tva_rate: formData.tva_rate,
      amount_ht: 0,
      amount_tva: 0,
      amount_ttc: 0,
      percentage_completed: 100,
      sort_order: prev.length,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate amounts
      const item = updated[index];
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const discountPct = Number(item.discount_percentage) || 0;
      const tvaRate = Number(item.tva_rate) || 0;
      const pctCompleted = Number(item.percentage_completed) || 100;
      
      const baseAmount = quantity * unitPrice * (pctCompleted / 100);
      const discountAmount = baseAmount * (discountPct / 100);
      const amountHt = baseAmount - discountAmount;
      const amountTva = amountHt * (tvaRate / 100);
      const amountTtc = amountHt + amountTva;
      
      updated[index] = {
        ...updated[index],
        amount_ht: amountHt,
        amount_tva: amountTva,
        amount_ttc: amountTtc,
      };
      
      return updated;
    });
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotalHt = items.reduce((sum, item) => sum + (Number(item.amount_ht) || 0), 0);
    const totalTva = items.reduce((sum, item) => sum + (Number(item.amount_tva) || 0), 0);
    const totalTtc = items.reduce((sum, item) => sum + (Number(item.amount_ttc) || 0), 0);
    
    return { subtotalHt, totalTva, totalTtc };
  }, [items]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleSave = async (sendAfter = false) => {
    const invoiceData = {
      ...formData,
      subtotal_ht: totals.subtotalHt,
      tva_amount: totals.totalTva,
      total_ttc: totals.totalTtc,
      amount_due: totals.totalTtc,
      status: sendAfter ? 'sent' : formData.status,
      sent_at: sendAfter ? new Date().toISOString() : undefined,
    };

    const validItems = items.filter(item => item.description && item.unit_price) as InvoiceItem[];

    if (invoiceId) {
      await updateInvoice.mutateAsync({ id: invoiceId, ...invoiceData, items: validItems });
    } else {
      await createInvoice.mutateAsync({ ...invoiceData, items: validItems });
    }

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[1400px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <SheetTitle>
              {invoiceId ? existingInvoice?.invoice_number || 'Chargement...' : 'Nouvelle facture'}
            </SheetTitle>
            {existingInvoice && (
              <Badge variant="secondary" className="ml-2">
                {existingInvoice.status === 'draft' ? 'Brouillon' : 
                 existingInvoice.status === 'sent' ? 'Envoyée' :
                 existingInvoice.status === 'paid' ? 'Payée' :
                 existingInvoice.status === 'overdue' ? 'En retard' : 'Brouillon'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!invoiceId && acceptedDocuments.length > 0 && (
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Import className="h-4 w-4 mr-2" />
                    Importer devis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Importer depuis un devis</DialogTitle>
                    <DialogDescription>
                      Sélectionnez un devis accepté pour pré-remplir la facture avec ses phases et informations client.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {acceptedDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleImportFromDocument(doc.id)}
                        className={cn(
                          "w-full p-4 rounded-lg border text-left hover:bg-muted/50 transition-colors",
                          selectedCommercialDocId === doc.id && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-muted-foreground">{doc.document_number}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">
                              {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
                              {doc.total_amount?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        </div>
                        {doc.client_company && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {doc.client_company.name}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Masquer' : 'Aperçu'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={createInvoice.isPending || updateInvoice.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={createInvoice.isPending || updateInvoice.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden",
            showPreview ? "w-1/2" : "w-full"
          )}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b px-6">
                <TabsList className="h-12">
                  <TabsTrigger value="general">Général</TabsTrigger>
                  <TabsTrigger value="items">Lignes</TabsTrigger>
                  <TabsTrigger value="payment">Paiement</TabsTrigger>
                  <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 p-6">
                {/* General Tab */}
                <TabsContent value="general" className="m-0 space-y-6">
                  {/* Invoice Type & Date */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Type de document</Label>
                      <Select
                        value={formData.invoice_type}
                        onValueChange={(v) => updateField('invoice_type', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Facture</SelectItem>
                          <SelectItem value="deposit">Facture d'acompte</SelectItem>
                          <SelectItem value="proforma">Proforma</SelectItem>
                          <SelectItem value="credit_note">Avoir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date de facturation</Label>
                      <Input
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) => updateField('invoice_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d'échéance</Label>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => updateField('due_date', e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Client Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-medium">Client</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sélectionner une entreprise</Label>
                      <Select
                        value={formData.client_company_id}
                        onValueChange={handleCompanyChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom / Raison sociale</Label>
                        <Input
                          value={formData.client_name}
                          onChange={(e) => updateField('client_name', e.target.value)}
                          placeholder="Nom du client"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SIRET</Label>
                        <Input
                          value={formData.client_siret}
                          onChange={(e) => updateField('client_siret', e.target.value)}
                          placeholder="XXX XXX XXX XXXXX"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Adresse</Label>
                        <Input
                          value={formData.client_address}
                          onChange={(e) => updateField('client_address', e.target.value)}
                          placeholder="Adresse de facturation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Code postal</Label>
                        <Input
                          value={formData.client_postal_code}
                          onChange={(e) => updateField('client_postal_code', e.target.value)}
                          placeholder="75001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input
                          value={formData.client_city}
                          onChange={(e) => updateField('client_city', e.target.value)}
                          placeholder="Ville"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>N° TVA intracommunautaire</Label>
                        <Input
                          value={formData.client_vat_number}
                          onChange={(e) => updateField('client_vat_number', e.target.value)}
                          placeholder="FR XX XXX XXX XXX"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Project Reference */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-medium">Projet</Label>
                    </div>
                    
                    <Select
                      value={formData.project_id}
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Associer à un projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Chorus Pro Section */}
                  <Collapsible open={chorusOpen} onOpenChange={setChorusOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto py-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-base font-medium">Chorus Pro</span>
                          <Badge variant="secondary" className="ml-2">Secteur public</Badge>
                        </div>
                        {chorusOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-1">
                          <p className="font-medium">Activer Chorus Pro</p>
                          <p className="text-sm text-muted-foreground">
                            Transmission automatique aux clients du secteur public
                          </p>
                        </div>
                        <Switch
                          checked={formData.chorus_pro_enabled}
                          onCheckedChange={(v) => updateField('chorus_pro_enabled', v)}
                        />
                      </div>

                      {formData.chorus_pro_enabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Code service</Label>
                            <Input
                              value={formData.chorus_pro_service_code}
                              onChange={(e) => updateField('chorus_pro_service_code', e.target.value)}
                              placeholder="Code du service destinataire"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>N° d'engagement</Label>
                            <Input
                              value={formData.chorus_pro_engagement_number}
                              onChange={(e) => updateField('chorus_pro_engagement_number', e.target.value)}
                              placeholder="Numéro d'engagement juridique"
                            />
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </TabsContent>

                {/* Items Tab */}
                <TabsContent value="items" className="m-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-medium">Lignes de facturation</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une ligne
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="pt-6 space-y-4">
                          <div className="absolute right-4 top-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label>Code</Label>
                              <Input
                                value={item.code || ''}
                                onChange={(e) => updateItem(index, 'code', e.target.value)}
                                placeholder="ESQ"
                              />
                            </div>
                            <div className="col-span-3 space-y-2">
                              <Label>Description</Label>
                              <Input
                                value={item.description || ''}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Description de la prestation"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-4">
                            <div className="space-y-2">
                              <Label>Quantité</Label>
                              <Input
                                type="number"
                                value={item.quantity || 0}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.5}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Unité</Label>
                              <Select
                                value={item.unit || 'forfait'}
                                onValueChange={(v) => updateItem(index, 'unit', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNITS.map((unit) => (
                                    <SelectItem key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Prix unitaire HT</Label>
                              <Input
                                type="number"
                                value={item.unit_price || 0}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.01}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>TVA %</Label>
                              <Select
                                value={String(item.tva_rate || 20)}
                                onValueChange={(v) => updateItem(index, 'tva_rate', parseFloat(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="5.5">5.5%</SelectItem>
                                  <SelectItem value="10">10%</SelectItem>
                                  <SelectItem value="20">20%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Montant HT</Label>
                              <div className="h-10 px-3 py-2 border rounded-md bg-muted/50 font-medium">
                                {formatCurrency(item.amount_ht || 0)}
                              </div>
                            </div>
                          </div>

                          {/* Advanced: percentage completed */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm text-muted-foreground">% réalisé</Label>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Pour facturer une partie de la prestation (acompte, situation)
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              type="number"
                              value={item.percentage_completed || 100}
                              onChange={(e) => updateItem(index, 'percentage_completed', parseFloat(e.target.value) || 100)}
                              min={0}
                              max={100}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Totals */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total HT</span>
                          <span className="font-medium">{formatCurrency(totals.subtotalHt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">TVA</span>
                          <span className="font-medium">{formatCurrency(totals.totalTva)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg">
                          <span className="font-bold">Total TTC</span>
                          <span className="font-bold">{formatCurrency(totals.totalTtc)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Conditions de paiement</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mode de paiement</Label>
                        <Select
                          value={formData.payment_method}
                          onValueChange={(v) => updateField('payment_method', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>TVA par défaut</Label>
                        <Select
                          value={String(formData.tva_rate)}
                          onValueChange={(v) => updateField('tva_rate', parseFloat(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5.5">5.5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Modalités de règlement</Label>
                      <Textarea
                        value={formData.payment_terms}
                        onChange={(e) => updateField('payment_terms', e.target.value)}
                        rows={3}
                        placeholder="Paiement à 30 jours..."
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Coordonnées bancaires</Label>
                    
                    <div className="space-y-2">
                      <Label>Nom de la banque</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => updateField('bank_name', e.target.value)}
                        placeholder="BNP Paribas"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input
                          value={formData.bank_iban}
                          onChange={(e) => updateField('bank_iban', e.target.value)}
                          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>BIC</Label>
                        <Input
                          value={formData.bank_bic}
                          onChange={(e) => updateField('bank_bic', e.target.value)}
                          placeholder="BNPAFRPP"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Options Tab */}
                <TabsContent value="options" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Textes personnalisés</Label>
                    
                    <div className="space-y-2">
                      <Label>Texte d'en-tête</Label>
                      <Textarea
                        value={formData.header_text}
                        onChange={(e) => updateField('header_text', e.target.value)}
                        rows={2}
                        placeholder="Texte affiché en haut de la facture..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes (visible sur la facture)</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        rows={2}
                        placeholder="Notes pour le client..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Texte de pied de page</Label>
                      <Textarea
                        value={formData.footer_text}
                        onChange={(e) => updateField('footer_text', e.target.value)}
                        rows={2}
                        placeholder="Texte affiché en bas de la facture..."
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Notes internes</Label>
                    <Textarea
                      value={formData.internal_notes}
                      onChange={(e) => updateField('internal_notes', e.target.value)}
                      rows={3}
                      placeholder="Notes internes (non visibles sur la facture)..."
                    />
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 border-l bg-muted/30 flex flex-col">
              <div className="px-4 py-3 border-b bg-background flex items-center justify-between">
                <span className="text-sm font-medium">Aperçu en direct</span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <InvoiceLivePreview
                  formData={formData}
                  items={items}
                  totals={totals}
                  agencyInfo={agencyInfo}
                />
              </ScrollArea>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
