import { useState } from "react";
import { Plus, X, GripVertical, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TenderLot {
  numero: number;
  intitule: string;
  domaine: string;
  budget_min?: number;
  budget_max?: number;
  description?: string;
}

interface CommunicationLotsEditorProps {
  lots: TenderLot[];
  onChange: (lots: TenderLot[]) => void;
}

const DOMAINES = [
  { value: "graphisme", label: "Graphisme", color: "#8B5CF6" },
  { value: "impression", label: "Impression", color: "#F59E0B" },
  { value: "digital", label: "Digital", color: "#3B82F6" },
  { value: "evenementiel", label: "Événementiel", color: "#EC4899" },
  { value: "video", label: "Vidéo / Motion", color: "#EF4444" },
  { value: "strategie", label: "Stratégie", color: "#10B981" },
  { value: "rp", label: "Relations Presse", color: "#6366F1" },
  { value: "signaletique", label: "Signalétique", color: "#14B8A6" },
  { value: "global", label: "Global / Multi-compétences", color: "#6B7280" },
];

export function CommunicationLotsEditor({ lots, onChange }: CommunicationLotsEditorProps) {
  const [newLotIntitule, setNewLotIntitule] = useState("");
  const [newLotDomaine, setNewLotDomaine] = useState("graphisme");

  const addLot = () => {
    if (!newLotIntitule.trim()) return;
    const newLot: TenderLot = {
      numero: lots.length + 1,
      intitule: newLotIntitule,
      domaine: newLotDomaine,
    };
    onChange([...lots, newLot]);
    setNewLotIntitule("");
  };

  const updateLot = (index: number, updates: Partial<TenderLot>) => {
    const updated = lots.map((lot, i) => i === index ? { ...lot, ...updates } : lot);
    onChange(updated);
  };

  const removeLot = (index: number) => {
    const updated = lots.filter((_, i) => i !== index).map((lot, i) => ({
      ...lot,
      numero: i + 1,
    }));
    onChange(updated);
  };

  const getDomaineColor = (domaineValue: string) => {
    return DOMAINES.find(d => d.value === domaineValue)?.color || "#6B7280";
  };

  const getDomaineLabel = (domaineValue: string) => {
    return DOMAINES.find(d => d.value === domaineValue)?.label || domaineValue;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <Label className="font-medium">Lots du marché</Label>
        {lots.length > 0 && (
          <Badge variant="secondary">{lots.length} lot{lots.length > 1 ? "s" : ""}</Badge>
        )}
      </div>

      {lots.length > 0 && (
        <div className="space-y-2">
          {lots.map((lot, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium text-muted-foreground w-12">
                  Lot {lot.numero}
                </span>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getDomaineColor(lot.domaine) }}
                />
              </div>

              <Input
                value={lot.intitule}
                onChange={(e) => updateLot(index, { intitule: e.target.value })}
                placeholder="Intitulé du lot..."
                className="h-9 flex-1"
              />

              <Select
                value={lot.domaine}
                onValueChange={(v) => updateLot(index, { domaine: v })}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        {d.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  placeholder="Min"
                  value={lot.budget_min || ""}
                  onChange={(e) => updateLot(index, { budget_min: e.target.value ? Number(e.target.value) : undefined })}
                  className="h-9 w-24"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={lot.budget_max || ""}
                  onChange={(e) => updateLot(index, { budget_max: e.target.value ? Number(e.target.value) : undefined })}
                  className="h-9 w-24"
                />
                <span className="text-xs text-muted-foreground">€</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
                onClick={() => removeLot(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Intitulé du nouveau lot..."
          value={newLotIntitule}
          onChange={(e) => setNewLotIntitule(e.target.value)}
          className="h-9 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLot();
            }
          }}
        />
        <Select value={newLotDomaine} onValueChange={setNewLotDomaine}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOMAINES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={addLot} disabled={!newLotIntitule.trim()}>
          Ajouter
        </Button>
      </div>

      {lots.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Aucun lot défini - Ajoutez des lots pour un marché multi-lots
        </p>
      )}
    </div>
  );
}
