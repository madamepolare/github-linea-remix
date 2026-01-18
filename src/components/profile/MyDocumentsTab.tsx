import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAgencyDocuments } from "@/hooks/useAgencyDocuments";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Download, ExternalLink } from "lucide-react";

const categoryLabels: Record<string, string> = {
  hr: "RH",
  contract: "Contrat",
  payslip: "Bulletin de paie",
  certificate: "Attestation",
  expense: "Note de frais",
  other: "Autre",
};

export function MyDocumentsTab() {
  const { user } = useAuth();
  const { documents, isLoading } = useAgencyDocuments();

  // Filter documents that are related to the current user (HR/administrative documents)
  const myDocuments = documents?.filter(
    doc => doc.category === "administrative"
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (myDocuments.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun document"
        description="Vos documents RH apparaîtront ici (bulletins de paie, attestations, contrats...)."
      />
    );
  }

  return (
    <div className="space-y-3">
      {myDocuments.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">{doc.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Badge variant="outline">{categoryLabels[doc.category] || doc.category}</Badge>
                    <span>•</span>
                    <span>{format(new Date(doc.created_at!), "d MMM yyyy", { locale: fr })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.pdf_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
