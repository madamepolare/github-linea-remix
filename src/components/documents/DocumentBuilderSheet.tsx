import { useState, useEffect } from 'react';
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
  Send, 
  FileText, 
  CalendarIcon,
  Building2,
  User,
  Briefcase,
  Loader2,
  Lock,
  Palette
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  isDocumentEditable,
  ALLOWED_STATUS_TRANSITIONS,
} from '@/lib/documentTypes';

// Import visual editor with live preview
import { VisualDocumentEditor } from './editors/VisualDocumentEditor';

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
  
  // Check if document is editable based on status
  const isEditable = isDocumentEditable(document.status);
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[document.status] || [];

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
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

        <Tabs defaultValue="editor" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="editor" className="gap-2">
              <Palette className="h-4 w-4" />
              Éditeur visuel
            </TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Visual Editor Tab */}
          <TabsContent value="editor" className="mt-4">
            <VisualDocumentEditor
              documentType={document.document_type as DocumentType}
              documentNumber={document.document_number || ''}
              title={title}
              content={content}
              onChange={setContent}
              projects={projects || []}
              contacts={contacts || []}
              companies={companies || []}
              isEditable={isEditable}
              createdAt={document.created_at}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Read-only alert */}
            {!isEditable && (
              <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Ce document est verrouillé. Seuls les brouillons peuvent être modifiés.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isEditable}
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
                disabled={!isEditable}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select 
                value={status} 
                onValueChange={(v) => setStatus(v as DocumentStatus)}
                disabled={allowedTransitions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Current status always shown */}
                  <SelectItem value={document.status}>
                    {DOCUMENT_STATUS_LABELS[document.status]}
                  </SelectItem>
                  {/* Allowed transitions */}
                  {allowedTransitions.map((statusKey) => (
                    <SelectItem key={statusKey} value={statusKey}>
                      {DOCUMENT_STATUS_LABELS[statusKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allowedTransitions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Transitions possibles : {allowedTransitions.map(s => DOCUMENT_STATUS_LABELS[s]).join(', ')}
                </p>
              )}
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
                  disabled={!isEditable}
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
                  disabled={!isEditable}
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
                  disabled={!isEditable}
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
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (!isEditable && status === document.status)}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditable ? 'Sauvegarder' : 'Mettre à jour le statut'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
