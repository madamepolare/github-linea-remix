import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Download, 
  Trash2, 
  Send,
  Copy,
  Scale,
  Shield,
  Receipt,
  FileCheck,
  BadgeCheck,
  Award,
  FileSignature,
  FilePen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ClipboardList,
  UserCheck,
  Wallet,
  Plane,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAgencyDocuments } from '@/hooks/useAgencyDocuments';
import { DocumentBuilderSheet } from './DocumentBuilderSheet';
import { 
  type AgencyDocument, 
  DOCUMENT_TYPE_LABELS, 
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  type DocumentType
} from '@/lib/documentTypes';

const ICON_MAP: Record<DocumentType, React.ComponentType<{ className?: string }>> = {
  power_of_attorney: Scale,
  attestation_insurance: Shield,
  attestation_fiscal: Receipt,
  attestation_urssaf: FileCheck,
  attestation_capacity: BadgeCheck,
  certificate: Award,
  service_order: FileSignature,
  invoice: Receipt,
  amendment: FilePen,
  formal_notice: AlertTriangle,
  validation_letter: CheckCircle,
  refusal_letter: XCircle,
  site_visit_report: ClipboardList,
  employer_certificate: UserCheck,
  expense_report: Wallet,
  mission_order: Plane,
  training_certificate: GraduationCap,
};

interface DocumentListProps {
  documents: AgencyDocument[];
  isLoading: boolean;
}

export function DocumentList({ documents, isLoading }: DocumentListProps) {
  const { deleteDocument } = useAgencyDocuments();
  const [selectedDocument, setSelectedDocument] = useState<AgencyDocument | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (documentToDelete) {
      await deleteDocument.mutateAsync(documentToDelete);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun document dans cette catégorie</p>
        <p className="text-sm mt-1">Créez votre premier document</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => {
          const Icon = ICON_MAP[doc.document_type as DocumentType] || FileText;
          
          return (
            <Card 
              key={doc.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedDocument(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{doc.document_number}</span>
                        <span>•</span>
                        <span>{DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType]}</span>
                        {doc.project && (
                          <>
                            <span>•</span>
                            <span>{doc.project.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-muted-foreground">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </div>
                    <Badge className={DOCUMENT_STATUS_COLORS[doc.status]}>
                      {DOCUMENT_STATUS_LABELS[doc.status]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDocument(doc);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir / Modifier
                        </DropdownMenuItem>
                        {doc.pdf_url && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.open(doc.pdf_url!, '_blank');
                          }}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentToDelete(doc.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedDocument && (
        <DocumentBuilderSheet
          document={selectedDocument}
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
