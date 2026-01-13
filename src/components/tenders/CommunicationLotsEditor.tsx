import { useState } from "react";
import { Plus, X, GripVertical, Layers, Users, ChevronDown, ChevronUp, Euro, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface LotTeamMember {
  specialty: string;
  is_mandatory: boolean;
  notes?: string;
}

export interface TenderLot {
  numero: number;
  intitule: string;
  domaine: string;
  budget_min?: number;
  budget_max?: number;
  description?: string;
  is_multi_attributaire?: boolean;
  nb_attributaires?: number;
  duree_mois?: number;
  required_team?: LotTeamMember[];
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

// Team specialties for Communication (suppliers, partners, etc.)
const TEAM_SPECIALTIES = [
  { value: 'imprimeur', label: 'Imprimeur', category: 'fournisseur' },
  { value: 'routeur', label: 'Routeur / Façonneur', category: 'fournisseur' },
  { value: 'signaletique', label: 'Signalétique / Enseigniste', category: 'fournisseur' },
  { value: 'producteur_video', label: 'Producteur vidéo', category: 'production' },
  { value: 'photographe', label: 'Photographe', category: 'production' },
  { value: 'studio_son', label: 'Studio son / Voix off', category: 'production' },
  { value: 'agence_rp', label: 'Agence RP', category: 'partenaire' },
  { value: 'agence_influence', label: 'Agence influence', category: 'partenaire' },
  { value: 'agence_media', label: 'Agence média / Régie', category: 'partenaire' },
  { value: 'agence_digitale', label: 'Agence digitale / Web', category: 'partenaire' },
  { value: 'agence_evenementielle', label: 'Agence événementielle', category: 'partenaire' },
  { value: 'standiste', label: 'Standiste', category: 'fournisseur' },
  { value: 'traiteur', label: 'Traiteur', category: 'fournisseur' },
  { value: 'location_materiel', label: 'Location matériel', category: 'fournisseur' },
  { value: 'traducteur', label: 'Traducteur', category: 'fournisseur' },
  { value: 'redacteur', label: 'Rédacteur freelance', category: 'freelance' },
  { value: 'graphiste_freelance', label: 'Graphiste freelance', category: 'freelance' },
  { value: 'developpeur', label: 'Développeur', category: 'freelance' },
  { value: 'autre', label: 'Autre partenaire', category: 'autre' },
];

export function CommunicationLotsEditor({ lots, onChange }: CommunicationLotsEditorProps) {
  const [newLotIntitule, setNewLotIntitule] = useState("");
  const [newLotDomaine, setNewLotDomaine] = useState("graphisme");
  const [expandedLots, setExpandedLots] = useState<number[]>([]);

  const addLot = () => {
    if (!newLotIntitule.trim()) return;
    const newLot: TenderLot = {
      numero: lots.length + 1,
      intitule: newLotIntitule,
      domaine: newLotDomaine,
      required_team: [],
    };
    onChange([...lots, newLot]);
    setNewLotIntitule("");
    // Auto-expand new lot
    setExpandedLots([...expandedLots, lots.length]);
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
    setExpandedLots(expandedLots.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const toggleExpanded = (index: number) => {
    setExpandedLots(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const addTeamMember = (lotIndex: number, specialty: string) => {
    const lot = lots[lotIndex];
    const currentTeam = lot.required_team || [];
    if (currentTeam.some(m => m.specialty === specialty)) return;
    
    updateLot(lotIndex, {
      required_team: [...currentTeam, { specialty, is_mandatory: true }]
    });
  };

  const updateTeamMember = (lotIndex: number, specialty: string, updates: Partial<LotTeamMember>) => {
    const lot = lots[lotIndex];
    const currentTeam = lot.required_team || [];
    updateLot(lotIndex, {
      required_team: currentTeam.map(m => 
        m.specialty === specialty ? { ...m, ...updates } : m
      )
    });
  };

  const removeTeamMember = (lotIndex: number, specialty: string) => {
    const lot = lots[lotIndex];
    const currentTeam = lot.required_team || [];
    updateLot(lotIndex, {
      required_team: currentTeam.filter(m => m.specialty !== specialty)
    });
  };

  const getDomaineColor = (domaineValue: string) => {
    return DOMAINES.find(d => d.value === domaineValue)?.color || "#6B7280";
  };

  const getSpecialtyLabel = (value: string) => {
    return TEAM_SPECIALTIES.find(s => s.value === value)?.label || value;
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
        <div className="space-y-3">
          {lots.map((lot, index) => {
            const isExpanded = expandedLots.includes(index);
            const teamCount = lot.required_team?.length || 0;
            
            return (
              <Collapsible
                key={index}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(index)}
              >
                <div className="border rounded-lg bg-card overflow-hidden">
                  {/* Lot header - always visible */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="font-mono text-xs">
                          Lot {lot.numero}
                        </Badge>
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: getDomaineColor(lot.domaine) }}
                        />
                      </div>

                      <span className="font-medium text-sm flex-1 truncate">
                        {lot.intitule || "Sans titre"}
                      </span>

                      {/* Summary badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {lot.budget_max && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Euro className="h-3 w-3" />
                            {lot.budget_max >= 1000000 
                              ? `${(lot.budget_max / 1000000).toFixed(1)}M€`
                              : lot.budget_max >= 1000
                                ? `${Math.round(lot.budget_max / 1000)}k€`
                                : `${lot.budget_max}€`
                            }
                          </Badge>
                        )}
                        {lot.is_multi_attributaire && (
                          <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                            Multi {lot.nb_attributaires && `(${lot.nb_attributaires})`}
                          </Badge>
                        )}
                        {teamCount > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                            <Users className="h-3 w-3" />
                            {teamCount}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Lot details - expandable */}
                  <CollapsibleContent>
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                      {/* Basic lot info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Intitulé</Label>
                          <Input
                            value={lot.intitule}
                            onChange={(e) => updateLot(index, { intitule: e.target.value })}
                            placeholder="Intitulé du lot..."
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Domaine</Label>
                          <Select
                            value={lot.domaine}
                            onValueChange={(v) => updateLot(index, { domaine: v })}
                          >
                            <SelectTrigger className="h-9">
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
                        </div>
                      </div>

                      {/* Budget & Duration */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Euro className="h-3 w-3" /> Budget min
                          </Label>
                          <Input
                            type="number"
                            placeholder="Min €"
                            value={lot.budget_min || ""}
                            onChange={(e) => updateLot(index, { budget_min: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Euro className="h-3 w-3" /> Budget max
                          </Label>
                          <Input
                            type="number"
                            placeholder="Max €"
                            value={lot.budget_max || ""}
                            onChange={(e) => updateLot(index, { budget_max: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Durée (mois)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Durée"
                            value={lot.duree_mois || ""}
                            onChange={(e) => updateLot(index, { duree_mois: e.target.value ? Number(e.target.value) : undefined })}
                            className="h-9"
                          />
                        </div>
                      </div>

                      {/* Multi-attributaire */}
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`multi-${index}`}
                            checked={lot.is_multi_attributaire || false}
                            onCheckedChange={(checked) => updateLot(index, { 
                              is_multi_attributaire: checked,
                              nb_attributaires: checked ? (lot.nb_attributaires || 2) : undefined
                            })}
                          />
                          <Label htmlFor={`multi-${index}`} className="text-sm cursor-pointer">
                            Multi-attributaire
                          </Label>
                        </div>
                        {lot.is_multi_attributaire && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Nb attributaires:</Label>
                            <Input
                              type="number"
                              min={2}
                              value={lot.nb_attributaires || 2}
                              onChange={(e) => updateLot(index, { nb_attributaires: Number(e.target.value) || 2 })}
                              className="h-8 w-20"
                            />
                          </div>
                        )}
                      </div>

                      {/* Required team for this lot */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-orange-600" />
                          Équipe / Partenaires requis pour ce lot
                        </Label>
                        
                        {/* Current team members */}
                        {(lot.required_team && lot.required_team.length > 0) && (
                          <div className="space-y-2">
                            {lot.required_team.map((member) => (
                              <div
                                key={member.specialty}
                                className="flex items-center gap-3 p-2 bg-card border rounded-lg"
                              >
                                <span className="text-sm font-medium flex-1">
                                  {getSpecialtyLabel(member.specialty)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={member.is_mandatory ? "default" : "secondary"} className="text-xs">
                                    {member.is_mandatory ? "Obligatoire" : "Optionnel"}
                                  </Badge>
                                  <Switch
                                    checked={member.is_mandatory}
                                    onCheckedChange={(checked) => updateTeamMember(index, member.specialty, { is_mandatory: checked })}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeTeamMember(index, member.specialty)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add team member */}
                        <Select
                          value=""
                          onValueChange={(v) => addTeamMember(index, v)}
                        >
                          <SelectTrigger className="h-9 border-dashed">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Plus className="h-4 w-4" />
                              <span>Ajouter un partenaire / fournisseur...</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {TEAM_SPECIALTIES.filter(
                              s => !lot.required_team?.some(m => m.specialty === s.value)
                            ).map((specialty) => (
                              <SelectItem key={specialty.value} value={specialty.value}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {specialty.category}
                                  </Badge>
                                  {specialty.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Delete lot button */}
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeLot(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer ce lot
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Add new lot */}
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
