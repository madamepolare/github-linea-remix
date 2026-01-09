import { useMemo } from "react";
import {
  FileCheck,
  FileText,
  CheckCircle2,
  Circle,
  Sparkles,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTenderRequiredDocuments } from "@/hooks/useTenderRequiredDocuments";

interface TenderDeliverablesSectionProps {
  tenderId: string;
  extractedDocuments?: any[];
}

export function TenderDeliverablesSection({ 
  tenderId,
  extractedDocuments 
}: TenderDeliverablesSectionProps) {
  const {
    documents,
    candidatureDocuments,
    offreDocuments,
    isLoading,
    toggleComplete,
    loadDefaultDocuments,
    candidatureProgress,
    offreProgress,
    totalProgress,
  } = useTenderRequiredDocuments(tenderId);

  const handleLoadDefaults = async () => {
    await loadDefaultDocuments.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            Documents à remettre
          </CardTitle>
          {documents.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDefaults}
              disabled={loadDefaultDocuments.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Charger documents type
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun document requis défini</p>
              <p className="text-xs mt-1">Chargez les documents type ou importez depuis le DCE</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression globale</span>
                    <span className="font-medium">{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-2" />
                </div>
              </div>

              {/* Candidature Section */}
              {candidatureDocuments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Badge variant="outline">Candidature</Badge>
                      <span className="text-muted-foreground text-xs">
                        {candidatureDocuments.filter(d => d.is_completed).length}/{candidatureDocuments.length}
                      </span>
                    </h4>
                    <Progress value={candidatureProgress} className="w-24 h-1.5" />
                  </div>
                  <div className="grid gap-1">
                    {candidatureDocuments.map(doc => (
                      <DocumentRow 
                        key={doc.id} 
                        document={{
                          id: doc.id,
                          document_name: doc.name,
                          document_type: doc.document_type,
                          is_mandatory: doc.is_mandatory,
                          is_completed: doc.is_completed,
                        }}
                        onToggle={() => toggleComplete.mutate({ id: doc.id, is_completed: !doc.is_completed })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Offre Section */}
              {offreDocuments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Badge variant="outline">Offre</Badge>
                      <span className="text-muted-foreground text-xs">
                        {offreDocuments.filter(d => d.is_completed).length}/{offreDocuments.length}
                      </span>
                    </h4>
                    <Progress value={offreProgress} className="w-24 h-1.5" />
                  </div>
                  <div className="grid gap-1">
                    {offreDocuments.map(doc => (
                      <DocumentRow 
                        key={doc.id} 
                        document={{
                          id: doc.id,
                          document_name: doc.name,
                          document_type: doc.document_type,
                          is_mandatory: doc.is_mandatory,
                          is_completed: doc.is_completed,
                        }}
                        onToggle={() => toggleComplete.mutate({ id: doc.id, is_completed: !doc.is_completed })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DocumentRowProps {
  document: {
    id: string;
    document_name: string;
    document_type: string;
    is_mandatory: boolean;
    is_completed: boolean;
  };
  onToggle: () => void;
}

function DocumentRow({ document, onToggle }: DocumentRowProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer hover:bg-muted/50",
        document.is_completed && "bg-green-50/50 dark:bg-green-950/20"
      )}
      onClick={onToggle}
    >
      <Checkbox 
        checked={document.is_completed}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          document.is_completed && "text-muted-foreground line-through"
        )}>
          {document.document_name}
        </p>
      </div>
      {document.is_mandatory && (
        <Badge variant="secondary" className="text-xs shrink-0">
          Obligatoire
        </Badge>
      )}
      {document.is_completed && (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      )}
    </div>
  );
}
