import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Save, 
  Download, 
  Send, 
  FileText, 
  CalendarIcon,
  Building2,
  User,
  Briefcase,
  Loader2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useAgencyDocuments } from '@/hooks/useAgencyDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useCRMCompanies } from '@/hooks/useCRMCompanies';
import { useContacts } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import {
  type AgencyDocument,
  type DocumentStatus,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  type DocumentType,
} from '@/lib/documentTypes';

// Import specialized editors
import { PowerOfAttorneyEditor } from './editors/PowerOfAttorneyEditor';
import { ServiceOrderEditor } from './editors/ServiceOrderEditor';
import { InvoiceEditor } from './editors/InvoiceEditor';
import { GenericDocumentEditor } from './editors/GenericDocumentEditor';

// Import PDF generators
import { generatePowerOfAttorneyPDF } from '@/lib/generatePowerOfAttorneyPDF';
import { generateServiceOrderPDF } from '@/lib/generateServiceOrderPDF';
import { generateInvoicePDF } from '@/lib/generateInvoicePDF';
import { generateGenericDocumentPDF } from '@/lib/generateGenericDocumentPDF';

interface DocumentBuilderSheetProps {
  document: AgencyDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentBuilderSheet({ document, open, onOpenChange }: DocumentBuilderSheetProps) {
  const { updateDocument } = useAgencyDocuments();
  const { projects } = useProjects();
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();

  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description || '');
  const [projectId, setProjectId] = useState(document.project_id || '');
  const [companyId, setCompanyId] = useState(document.company_id || '');
  const [contactId, setContactId] = useState(document.contact_id || '');
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [validFrom, setValidFrom] = useState<Date | undefined>(
    document.valid_from ? new Date(document.valid_from) : undefined
  );
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    document.valid_until ? new Date(document.valid_until) : undefined
  );
  const [content, setContent] = useState<Record<string, unknown>>(document.content || {});
  const [isSaving, setIsSaving] = useState(false);
  
  // PDF Preview state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    setTitle(document.title);
    setDescription(document.description || '');
    setProjectId(document.project_id || '');
    setCompanyId(document.company_id || '');
    setContactId(document.contact_id || '');
    setStatus(document.status);
    setValidFrom(document.valid_from ? new Date(document.valid_from) : undefined);
    setValidUntil(document.valid_until ? new Date(document.valid_until) : undefined);
    setContent(document.content || {});
    setPdfUrl(null); // Reset PDF when document changes
  }, [document]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const generatePDF = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      let blob: Blob;
      
      switch (document.document_type) {
        case 'power_of_attorney':
          blob = await generatePowerOfAttorneyPDF({
            document_number: document.document_number || '',
            title: title,
            delegator_name: (content.delegator_name as string) || '',
            delegator_role: (content.delegator_role as string) || '',
            delegate_name: (content.delegate_name as string) || '',
            delegate_role: (content.delegate_role as string) || '',
            scope: (content.scope as string) || '',
            specific_powers: (content.specific_powers as string[]) || [],
            start_date: (content.start_date as string) || '',
            end_date: (content.end_date as string) || '',
          });
          break;
          
        case 'service_order':
          blob = await generateServiceOrderPDF({
            document_number: document.document_number || '',
            order_type: (content.order_type as 'start' | 'suspend' | 'resume' | 'stop') || 'start',
            project_name: (content.project_name as string) || '',
            project_address: (content.project_address as string) || '',
            client_name: (content.client_name as string) || '',
            effective_date: (content.effective_date as string) || '',
            phase_name: (content.phase_name as string) || '',
            instructions: (content.instructions as string) || '',
          });
          break;
          
        case 'invoice':
          blob = await generateInvoicePDF({
            document_number: document.document_number || '',
            invoice_date: (content.invoice_date as string) || '',
            due_date: (content.due_date as string) || '',
            client_name: (content.client_name as string) || '',
            client_address: (content.client_address as string) || '',
            project_name: (content.project_name as string) || '',
            phases: (content.phases as Array<{code: string; name: string; amount: number; percentage_invoiced: number}>) || [],
            subtotal: (content.subtotal as number) || 0,
            tva_rate: (content.tva_rate as number) || 20,
            tva_amount: (content.tva_amount as number) || 0,
            total: (content.total as number) || 0,
            payment_terms: (content.payment_terms as string) || '',
            bank_iban: (content.bank_iban as string) || '',
            bank_bic: (content.bank_bic as string) || '',
            bank_name: (content.bank_name as string) || '',
          });
          break;
          
        default:
          blob = await generateGenericDocumentPDF({
            document_number: document.document_number || '',
            document_type: document.document_type as DocumentType,
            title: title,
            content: content,
            created_at: document.created_at,
          });
      }
      
      // Revoke previous URL if exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success('PDF généré avec succès');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [document, title, content, pdfUrl]);

  const handleDownloadPDF = useCallback(async () => {
    if (!pdfUrl) {
      await generatePDF();
    }
    
    // Need to regenerate if no URL yet
    if (!pdfUrl) return;
    
    const link = window.document.createElement('a');
    link.href = pdfUrl;
    link.download = `${document.document_number || 'document'}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  }, [pdfUrl, generatePDF, document.document_number]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDocument.mutateAsync({
        id: document.id,
        title,
        description: description || null,
        project_id: projectId || null,
        company_id: companyId || null,
        contact_id: contactId || null,
        status,
        valid_from: validFrom?.toISOString().split('T')[0] || null,
        valid_until: validUntil?.toISOString().split('T')[0] || null,
        content,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditor = () => {
    switch (document.document_type) {
      case 'power_of_attorney':
        return (
          <PowerOfAttorneyEditor 
            content={content} 
            onChange={setContent}
            contacts={contacts || []}
          />
        );
      case 'service_order':
        return (
          <ServiceOrderEditor 
            content={content} 
            onChange={setContent}
            projects={projects || []}
          />
        );
      case 'invoice':
        return (
          <InvoiceEditor 
            content={content} 
            onChange={setContent}
            projects={projects || []}
            companies={companies || []}
          />
        );
      default:
        return (
          <GenericDocumentEditor 
            content={content} 
            onChange={setContent}
            documentType={document.document_type as DocumentType}
          />
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {document.document_number}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {DOCUMENT_TYPE_LABELS[document.document_type as DocumentType]}
              </p>
            </div>
            <Badge className={DOCUMENT_STATUS_COLORS[document.status]}>
              {DOCUMENT_STATUS_LABELS[document.status]}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DocumentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Links */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Liens</h4>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Projet
                </Label>
                <Select
                  value={projectId || undefined}
                  onValueChange={(v) => setProjectId(v === "_none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucun</SelectItem>
                    {(projects || []).filter((p) => p.id).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Entreprise
                </Label>
                <Select
                  value={companyId || undefined}
                  onValueChange={(v) => setCompanyId(v === "_none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucune</SelectItem>
                    {(companies || []).filter((c) => c.id).map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact
                </Label>
                <Select
                  value={contactId || undefined}
                  onValueChange={(v) => setContactId(v === "_none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucun</SelectItem>
                    {(contacts || []).filter((c) => c.id).map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valide à partir du</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !validFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validFrom ? format(validFrom, 'dd/MM/yyyy', { locale: fr }) : "Non défini"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={validFrom}
                      onSelect={setValidFrom}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Valide jusqu'au</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !validUntil && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validUntil ? format(validUntil, 'dd/MM/yyyy', { locale: fr }) : "Non défini"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={validUntil}
                      onSelect={setValidUntil}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            {renderEditor()}
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg bg-card min-h-[500px] flex flex-col">
              {pdfUrl ? (
                <>
                  <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Aperçu du document
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={generatePDF}
                        disabled={isGeneratingPdf}
                      >
                        {isGeneratingPdf ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-2">Actualiser</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleDownloadPDF}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 p-2">
                    <iframe
                      src={pdfUrl}
                      className="w-full h-[450px] rounded border"
                      title="Aperçu PDF"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Aperçu PDF</p>
                    <p className="text-sm mb-4">Générez le document pour voir l'aperçu</p>
                    <Button
                      variant="outline"
                      onClick={generatePDF}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      Générer l'aperçu
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Envoyer
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
