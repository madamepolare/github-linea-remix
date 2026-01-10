import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { cn } from "@/lib/utils";
import { PHASE_STATUS_CONFIG, PHASE_COLORS, PhaseStatus } from "@/lib/projectTypes";
import {
  PHASES_BY_PROJECT_TYPE,
  PROJECT_TYPE_LABELS,
  PhaseTemplate,
  ProjectType,
} from "@/lib/commercialTypes";
import { Check, FileText, Plus } from "lucide-react";

interface PhaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPhase?: any | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    status: PhaseStatus;
    color: string;
    end_date?: string;
  }) => void;
  onSubmitMultiple?: (phases: {
    name: string;
    description?: string;
    status: PhaseStatus;
    color: string;
  }[]) => void;
  existingPhasesCount: number;
}

export function PhaseFormDialog({
  open,
  onOpenChange,
  editingPhase,
  onSubmit,
  onSubmitMultiple,
  existingPhasesCount,
}: PhaseFormDialogProps) {
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>("architecture");
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  // Form state for custom/edit mode
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<PhaseStatus>("pending");
  const [formColor, setFormColor] = useState(PHASE_COLORS[existingPhasesCount % PHASE_COLORS.length]);
  const [formDeadline, setFormDeadline] = useState<Date | null>(null);

  // Get templates for selected project type
  const templates = useMemo(() => {
    return PHASES_BY_PROJECT_TYPE[selectedProjectType] || [];
  }, [selectedProjectType]);

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && editingPhase) {
      // Editing mode - populate form
      setMode("custom");
      setFormName(editingPhase.name);
      setFormDescription(editingPhase.description || "");
      setFormStatus(editingPhase.status as PhaseStatus);
      setFormColor(editingPhase.color || PHASE_COLORS[0]);
      setFormDeadline(editingPhase.end_date ? new Date(editingPhase.end_date) : null);
      setSelectedTemplates(new Set());
    } else if (newOpen) {
      // Creating mode - reset form
      setMode("template");
      setFormName("");
      setFormDescription("");
      setFormStatus("pending");
      setFormColor(PHASE_COLORS[existingPhasesCount % PHASE_COLORS.length]);
      setFormDeadline(null);
      setSelectedTemplates(new Set());
    }
    onOpenChange(newOpen);
  };

  const toggleTemplate = (templateCode: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(templateCode)) {
        next.delete(templateCode);
      } else {
        next.add(templateCode);
      }
      return next;
    });
  };

  const selectAllBase = () => {
    const baseCodes = templates.filter(t => t.category === "base").map(t => t.code);
    setSelectedTemplates(new Set(baseCodes));
  };

  const selectAll = () => {
    setSelectedTemplates(new Set(templates.map(t => t.code)));
  };

  const clearSelection = () => {
    setSelectedTemplates(new Set());
  };

  const handleSubmit = () => {
    if (mode === "template" && selectedTemplates.size > 0 && !editingPhase) {
      // Submit multiple phases from templates
      const selectedPhases = templates
        .filter(t => selectedTemplates.has(t.code))
        .map((template, index) => ({
          name: template.name,
          description: template.description || undefined,
          status: "pending" as PhaseStatus,
          color: PHASE_COLORS[(existingPhasesCount + index) % PHASE_COLORS.length],
        }));

      if (onSubmitMultiple && selectedPhases.length > 1) {
        onSubmitMultiple(selectedPhases);
      } else if (selectedPhases.length === 1) {
        onSubmit(selectedPhases[0]);
      }
      
      setSelectedTemplates(new Set());
      onOpenChange(false);
    } else if (formName.trim()) {
      // Submit single custom phase
      onSubmit({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
        color: formColor,
        end_date: formDeadline ? formDeadline.toISOString().split("T")[0] : undefined,
      });

      setSelectedTemplates(new Set());
      setFormName("");
      setFormDescription("");
      onOpenChange(false);
    }
  };

  const isEditing = !!editingPhase;
  const canSubmit = mode === "template" 
    ? selectedTemplates.size > 0 
    : formName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? "Modifier la phase" 
              : selectedTemplates.size > 1 
                ? `Ajouter ${selectedTemplates.size} phases`
                : "Ajouter une phase"
            }
          </DialogTitle>
        </DialogHeader>

        {!isEditing && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "template" | "custom")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template" className="gap-2">
                <FileText className="h-4 w-4" />
                Phases types
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Plus className="h-4 w-4" />
                Personnalisée
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4 mt-4">
              {/* Project type selector */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Type de projet</Label>
                  <Select value={selectedProjectType} onValueChange={(v) => {
                    setSelectedProjectType(v as ProjectType);
                    setSelectedTemplates(new Set());
                  }}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-1 pt-5">
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllBase}>
                    Base
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>
                    Tout
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearSelection}>
                    Aucun
                  </Button>
                </div>
              </div>

              {/* Template list with checkboxes */}
              <ScrollArea className="h-[280px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {templates.map((template, index) => {
                    const isSelected = selectedTemplates.has(template.code);
                    const isFirstComplementary = template.category === "complementary" && 
                      (index === 0 || templates[index - 1].category === "base");
                    
                    return (
                      <div key={template.code}>
                        {isFirstComplementary && (
                          <div className="py-2 px-2 text-xs font-medium text-muted-foreground border-t mt-2 pt-3">
                            Missions complémentaires
                          </div>
                        )}
                        <div
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors cursor-pointer",
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleTemplate(template.code)}
                        >
                          <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={(checked) => {
                              // Prevent double toggle - let parent div handle it
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono shrink-0">
                                {template.code}
                              </Badge>
                              <span className="font-medium text-sm truncate">{template.name}</span>
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {template.description}
                              </p>
                            )}
                          </div>
                          {template.defaultPercentage && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {template.defaultPercentage}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Selection summary */}
              {selectedTemplates.size > 0 && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>
                    <strong>{selectedTemplates.size}</strong> phase{selectedTemplates.size > 1 ? "s" : ""} sélectionnée{selectedTemplates.size > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="mt-4">
              <CustomPhaseForm
                formName={formName}
                setFormName={setFormName}
                formDescription={formDescription}
                setFormDescription={setFormDescription}
                formStatus={formStatus}
                setFormStatus={setFormStatus}
                formColor={formColor}
                setFormColor={setFormColor}
                formDeadline={formDeadline}
                setFormDeadline={setFormDeadline}
              />
            </TabsContent>
          </Tabs>
        )}

        {isEditing && (
          <CustomPhaseForm
            formName={formName}
            setFormName={setFormName}
            formDescription={formDescription}
            setFormDescription={setFormDescription}
            formStatus={formStatus}
            setFormStatus={setFormStatus}
            formColor={formColor}
            setFormColor={setFormColor}
            formDeadline={formDeadline}
            setFormDeadline={setFormDeadline}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing 
              ? "Enregistrer" 
              : selectedTemplates.size > 1 
                ? `Ajouter ${selectedTemplates.size} phases`
                : "Ajouter"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Extracted form component to avoid duplication
function CustomPhaseForm({
  formName,
  setFormName,
  formDescription,
  setFormDescription,
  formStatus,
  setFormStatus,
  formColor,
  setFormColor,
  formDeadline,
  setFormDeadline,
}: {
  formName: string;
  setFormName: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formStatus: PhaseStatus;
  setFormStatus: (v: PhaseStatus) => void;
  formColor: string;
  setFormColor: (v: string) => void;
  formDeadline: Date | null;
  setFormDeadline: (v: Date | null) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Nom *</Label>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Ex: Esquisse"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Description de la phase..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={formStatus} onValueChange={(v) => setFormStatus(v as PhaseStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PHASE_STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Couleur</Label>
          <div className="flex gap-2 flex-wrap">
            {PHASE_COLORS.slice(0, 8).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full transition-all",
                  formColor === color && "ring-2 ring-offset-2 ring-primary"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date d'échéance</Label>
        <InlineDatePicker
          value={formDeadline}
          onChange={setFormDeadline}
          placeholder="Sélectionner une échéance..."
          className="w-full"
        />
      </div>
    </div>
  );
}
