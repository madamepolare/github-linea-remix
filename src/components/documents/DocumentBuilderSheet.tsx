import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  Loader2
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
  }, [document]);

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
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {projects?.map((project) => (
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
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    {companies?.map((company) => (
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
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {contacts?.map((contact) => (
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
            <div className="border rounded-lg p-8 bg-card min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aperçu PDF</p>
                <p className="text-sm">Générez le document pour voir l'aperçu</p>
                <Button className="mt-4" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Générer le PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Fermer
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
