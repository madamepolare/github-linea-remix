import { useState } from "react";
import { Sparkles, Loader2, Check, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExtractedDeliverable {
  type: string;
  name: string;
  responsible_type: string;
  is_mandatory: boolean;
  selected: boolean;
}

interface DeliverableAIExtractProps {
  existingTypes: string[];
  onImport: (deliverables: { deliverable_type: string; name: string; responsible_type: string }[]) => void;
}

export function DeliverableAIExtract({ existingTypes, onImport }: DeliverableAIExtractProps) {
  const [rcText, setRcText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedDeliverables, setExtractedDeliverables] = useState<ExtractedDeliverable[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = async () => {
    if (!rcText.trim()) {
      toast.error("Veuillez coller le texte du RC");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-deliverables", {
        body: { rcText },
      });

      if (error) throw error;

      const deliverables = (data.deliverables || []).map((d: any) => ({
        ...d,
        selected: !existingTypes.includes(d.type),
      }));

      setExtractedDeliverables(deliverables);
      setShowResults(true);
      toast.success(`${deliverables.length} livrables détectés`);
    } catch (error) {
      console.error("Error analyzing RC:", error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleDeliverable = (index: number) => {
    setExtractedDeliverables(prev =>
      prev.map((d, i) => (i === index ? { ...d, selected: !d.selected } : d))
    );
  };

  const handleImport = () => {
    const toImport = extractedDeliverables
      .filter(d => d.selected && !existingTypes.includes(d.type))
      .map(d => ({
        deliverable_type: d.type,
        name: d.name,
        responsible_type: d.responsible_type,
      }));

    if (toImport.length === 0) {
      toast.info("Aucun nouveau livrable à importer");
      return;
    }

    onImport(toImport);
    setShowResults(false);
    setRcText("");
    setExtractedDeliverables([]);
  };

  const selectedCount = extractedDeliverables.filter(d => d.selected && !existingTypes.includes(d.type)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Extraction IA depuis le RC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showResults ? (
          <>
            <Textarea
              placeholder="Collez ici le paragraphe du Règlement de Consultation concernant les pièces à fournir..."
              value={rcText}
              onChange={(e) => setRcText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !rcText.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser avec l'IA
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {extractedDeliverables.length} livrables détectés
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  setExtractedDeliverables([]);
                }}
              >
                Nouvelle analyse
              </Button>
            </div>

            <ScrollArea className="h-[240px] rounded-md border p-3">
              <div className="space-y-2">
                {extractedDeliverables.map((deliverable, index) => {
                  const alreadyExists = existingTypes.includes(deliverable.type);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md transition-colors",
                        alreadyExists
                          ? "bg-muted/50 opacity-60"
                          : deliverable.selected
                          ? "bg-primary/5 border border-primary/20"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={deliverable.selected}
                        disabled={alreadyExists}
                        onCheckedChange={() => toggleDeliverable(index)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className={cn(
                            "text-sm font-medium truncate",
                            alreadyExists && "line-through"
                          )}>
                            {deliverable.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {deliverable.is_mandatory && (
                          <Badge variant="destructive" className="text-[10px] h-5">
                            Obligatoire
                          </Badge>
                        )}
                        {alreadyExists ? (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            <Check className="h-2.5 w-2.5 mr-1" />
                            Déjà ajouté
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5">
                            {deliverable.responsible_type === "tous" ? "Tous" : "Mandataire"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Importer {selectedCount} livrable{selectedCount > 1 ? "s" : ""}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
