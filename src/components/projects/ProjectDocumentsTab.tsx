import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAgencyDocuments } from "@/hooks/useAgencyDocuments";
import { 
  FileText, 
  Plus, 
  Search, 
  Download,
  Eye,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectDocumentsTabProps {
  projectId: string;
}

const documentTypeLabels: Record<string, string> = {
  contract: "Contrat",
  amendment: "Avenant",
  power_of_attorney: "Procuration",
  service_order: "Ordre de service",
  report: "Rapport",
  correspondence: "Correspondance",
  invoice: "Facture",
  quote: "Devis",
  other: "Autre",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  sent: { label: "Envoyé", variant: "outline" },
  signed: { label: "Signé", variant: "default" },
  expired: { label: "Expiré", variant: "destructive" },
};

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const navigate = useNavigate();
  const { documents, isLoading } = useAgencyDocuments();
  const [search, setSearch] = useState("");

  const projectDocuments = documents.filter(
    (d) => d.project_id === projectId
  );

  const filteredDocuments = projectDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => navigate("/documents")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau document
        </Button>
      </div>

      {/* Documents list */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Créez votre premier document pour ce projet.
            </p>
            <Button onClick={() => navigate("/documents")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => {
            const status = statusConfig[doc.status || "draft"];
            return (
              <Card key={doc.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{doc.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {documentTypeLabels[doc.document_type] || doc.document_type}
                      </Badge>
                      <Badge variant={status.variant} className="text-xs shrink-0">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {doc.document_number && <span>{doc.document_number}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(doc.created_at || new Date()), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate("/documents")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir / Modifier
                      </DropdownMenuItem>
                      {doc.pdf_url && (
                        <DropdownMenuItem onClick={() => window.open(doc.pdf_url, "_blank")}>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger PDF
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
