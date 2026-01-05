import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Building2, Briefcase, Users, Scale, Shield, Receipt, FileSignature, Wallet, Plane } from 'lucide-react';
import { useAgencyDocuments } from '@/hooks/useAgencyDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useCRMCompanies } from '@/hooks/useCRMCompanies';
import { useContacts } from '@/hooks/useContacts';
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES_BY_CATEGORY,
  type DocumentCategory,
  type DocumentType,
} from '@/lib/documentTypes';

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ICONS: Record<DocumentCategory, React.ComponentType<{ className?: string }>> = {
  administrative: Building2,
  project: Briefcase,
  hr: Users,
  commercial: Receipt,
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  power_of_attorney: Scale,
  attestation_insurance: Shield,
  attestation_fiscal: Receipt,
  service_order: FileSignature,
  invoice: Receipt,
  expense_report: Wallet,
  mission_order: Plane,
};

export function CreateDocumentDialog({ open, onOpenChange }: CreateDocumentDialogProps) {
  const { createDocument } = useAgencyDocuments();
  const { projects } = useProjects();
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();

  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('administrative');
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [contactId, setContactId] = useState<string>('');

  const handleCategoryChange = (category: DocumentCategory) => {
    setSelectedCategory(category);
    setSelectedType(null);
  };

  const handleCreate = async () => {
    if (!selectedType || !title.trim()) return;

    await createDocument.mutateAsync({
      category: selectedCategory,
      document_type: selectedType,
      title: title.trim(),
      description: description.trim() || undefined,
      project_id: projectId || undefined,
      company_id: companyId || undefined,
      contact_id: contactId || undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setProjectId('');
    setCompanyId('');
    setContactId('');
    setSelectedType(null);
    onOpenChange(false);
  };

  const availableTypes = DOCUMENT_TYPES_BY_CATEGORY[selectedCategory];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <Tabs value={selectedCategory} onValueChange={(v) => handleCategoryChange(v as DocumentCategory)}>
            <TabsList className="grid grid-cols-3 w-full">
              {(['administrative', 'project', 'hr'] as DocumentCategory[]).map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <TabsTrigger key={cat} value={cat} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {DOCUMENT_CATEGORY_LABELS[cat]}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(['administrative', 'project', 'hr'] as DocumentCategory[]).map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {DOCUMENT_TYPES_BY_CATEGORY[cat].map((type) => {
                    const Icon = TYPE_ICONS[type] || Receipt;
                    return (
                      <Card
                        key={type}
                        className={`cursor-pointer transition-colors ${
                          selectedType === type
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedType(type)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedType === type ? 'bg-primary/20' : 'bg-muted'}`}>
                            <Icon className={`h-5 w-5 ${selectedType === type ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="font-medium text-sm">{DOCUMENT_TYPE_LABELS[type]}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Form Fields */}
          {selectedType && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du document *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Titre du ${DOCUMENT_TYPE_LABELS[selectedType].toLowerCase()}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description optionnelle..."
                  rows={2}
                />
              </div>

              {/* Project selector for project-related documents */}
              {selectedCategory === 'project' && (
                <div className="space-y-2">
                  <Label>Projet lié</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un projet" />
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
              )}

              {/* Company selector */}
              <div className="space-y-2">
                <Label>Entreprise liée</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une entreprise" />
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

              {/* Contact selector */}
              <div className="space-y-2">
                <Label>Contact lié</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!title.trim() || createDocument.isPending}
                >
                  {createDocument.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer le document
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
