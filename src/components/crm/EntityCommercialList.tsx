import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCommercialDocuments } from "@/hooks/useCommercialDocuments";
import { 
  Briefcase, 
  Plus, 
  Search, 
  Download,
  Eye,
  Calendar,
  MoreHorizontal,
  FileSignature,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EntityCommercialListProps {
  entityType: "company" | "lead";
  entityId: string;
}

const documentTypeLabels: Record<string, string> = {
  quote: "Devis",
  contract: "Contrat",
  proposal: "Proposition",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  sent: { label: "Envoyé", variant: "outline" },
  accepted: { label: "Accepté", variant: "default" },
  refused: { label: "Refusé", variant: "destructive" },
  expired: { label: "Expiré", variant: "destructive" },
};

export function EntityCommercialList({ entityType, entityId }: EntityCommercialListProps) {
  const navigate = useNavigate();
  const { documents, isLoading } = useCommercialDocuments();
  const [search, setSearch] = useState("");

  const entityDocuments = documents.filter((d) => 
    entityType === "company" ? d.client_company_id === entityId : false
  );

  const filteredDocuments = entityDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    doc.document_number.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => navigate("/commercial/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        </div>

        {/* Documents list */}
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2">Aucun document commercial</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-4">
              Créez votre premier devis lié à {entityType === "company" ? "cette entreprise" : "cette opportunité"}.
            </p>
            <Button size="sm" onClick={() => navigate("/commercial/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un devis
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => {
              const status = statusConfig[doc.status] || statusConfig.draft;
              const isAccepted = doc.status === "accepted";

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {isAccepted ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <FileSignature className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {documentTypeLabels[doc.document_type] || doc.document_type}
                      </Badge>
                      <Badge variant={status.variant} className="text-xs shrink-0">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{doc.document_number}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(doc.created_at || new Date()), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatCurrency(doc.total_amount)}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/commercial/${doc.id}`)}>
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
