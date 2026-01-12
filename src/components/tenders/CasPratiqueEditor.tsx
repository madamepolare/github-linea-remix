import { useState } from "react";
import { FileText, Clock, Target, Lightbulb, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CasPratique {
  requis: boolean;
  brief?: string;
  livrables?: string[];
  format?: string;
  delai_jours?: number;
  ponderation?: number;
}

interface CasPratiqueEditorProps {
  value: CasPratique;
  onChange: (value: CasPratique) => void;
  aiFilledFields?: Set<string>;
}

export function CasPratiqueEditor({ value, onChange, aiFilledFields }: CasPratiqueEditorProps) {
  const [newLivrable, setNewLivrable] = useState("");

  const addLivrable = () => {
    if (!newLivrable.trim()) return;
    const livrables = [...(value.livrables || []), newLivrable.trim()];
    onChange({ ...value, livrables });
    setNewLivrable("");
  };

  const removeLivrable = (index: number) => {
    const livrables = (value.livrables || []).filter((_, i) => i !== index);
    onChange({ ...value, livrables });
  };

  const isAiFilled = aiFilledFields?.has("cas_pratique");

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Cas pratique / Exercice créatif
          {isAiFilled && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
              IA
            </Badge>
          )}
        </Label>
        <Switch
          checked={value.requis}
          onCheckedChange={(checked) => onChange({ ...value, requis: checked })}
        />
      </div>

      {value.requis && (
        <div className="space-y-4 pt-2">
          {/* Brief */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <FileText className="h-3.5 w-3.5" />
              Brief du cas pratique
            </Label>
            <Textarea
              value={value.brief || ""}
              onChange={(e) => onChange({ ...value, brief: e.target.value })}
              placeholder="Décrivez le brief ou copiez-collez l'énoncé du cas pratique..."
              rows={4}
              className={cn(isAiFilled && "border-primary/30")}
            />
          </div>

          {/* Livrables attendus */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Target className="h-3.5 w-3.5" />
              Livrables attendus
            </Label>
            <div className="flex flex-wrap gap-2">
              {(value.livrables || []).map((livrable, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {livrable}
                  <button
                    type="button"
                    onClick={() => removeLivrable(index)}
                    className="ml-1 p-0.5 rounded hover:bg-destructive/20"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLivrable}
                onChange={(e) => setNewLivrable(e.target.value)}
                placeholder="Ex: Recommandation stratégique, Proposition créative..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLivrable();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLivrable}
                disabled={!newLivrable.trim()}
              >
                Ajouter
              </Button>
            </div>
          </div>

          {/* Format et contraintes */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Format de rendu
              </Label>
              <Input
                value={value.format || ""}
                onChange={(e) => onChange({ ...value, format: e.target.value })}
                placeholder="Ex: 10 pages A4, PDF..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Délai (jours)
              </Label>
              <Input
                type="number"
                value={value.delai_jours || ""}
                onChange={(e) => onChange({ ...value, delai_jours: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Ex: 15"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Target className="h-3.5 w-3.5" />
                Pondération (%)
              </Label>
              <Input
                type="number"
                value={value.ponderation || ""}
                onChange={(e) => onChange({ ...value, ponderation: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Ex: 30"
              />
            </div>
          </div>

          {/* Suggestion de ressources */}
          {value.requis && value.delai_jours && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  <strong>Suggestion :</strong> Prévoir environ {Math.ceil((value.delai_jours || 15) / 5)} jour(s) de travail équipe 
                  (DA + CR + CP) pour ce cas pratique
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
