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
  existingPhasesCount: number;
}

export function PhaseFormDialog({
  open,
  onOpenChange,
  editingPhase,
  onSubmit,
  existingPhasesCount,
}: PhaseFormDialogProps) {
  const [mode, setMode] = useState<"template" | "custom">("template");
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>("architecture");
  const [selectedTemplate, setSelectedTemplate] = useState<PhaseTemplate | null>(null);

  // Form state
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
      setSelectedTemplate(null);
    } else if (newOpen) {
      // Creating mode - reset form
      setMode("template");
      setFormName("");
      setFormDescription("");
      setFormStatus("pending");
      setFormColor(PHASE_COLORS[existingPhasesCount % PHASE_COLORS.length]);
      setFormDeadline(null);
      setSelectedTemplate(null);
    }
    onOpenChange(newOpen);
  };

  const selectTemplate = (template: PhaseTemplate) => {
    setSelectedTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description || "");
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;

    onSubmit({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
      color: formColor,
      end_date: formDeadline ? formDeadline.toISOString().split("T")[0] : undefined,
    });

    // Reset and close
    setSelectedTemplate(null);
    setFormName("");
    setFormDescription("");
    onOpenChange(false);
  };

  const isEditing = !!editingPhase;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la phase" : "Ajouter une phase"}</DialogTitle>
        </DialogHeader>

        {!isEditing && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "template" | "custom")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template" className="gap-2">
                <FileText className="h-4 w-4" />
                Depuis les phases types
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Plus className="h-4 w-4" />
                Phase personnalisée
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4 mt-4">
              {/* Project type selector */}
              <div className="space-y-2">
                <Label>Type de projet</Label>
                <Select value={selectedProjectType} onValueChange={(v) => setSelectedProjectType(v as ProjectType)}>
                  <SelectTrigger>
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

              {/* Template list */}
              <div className="space-y-2">
                <Label>Sélectionner une phase</Label>
                <ScrollArea className="h-[200px] border rounded-lg p-2">
                  <div className="space-y-1">
                    {templates.map((template) => {
                      const isSelected = selectedTemplate?.code === template.code;
                      return (
                        <button
                          key={template.code}
                          type="button"
                          onClick={() => selectTemplate(template)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                            isSelected
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                              isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono shrink-0">
                                {template.code}
                              </Badge>
                              <span className="font-medium text-sm truncate">{template.name}</span>
                              {template.category === "complementary" && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Complémentaire
                                </Badge>
                              )}
                            </div>
                            {template.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {template.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Selected template preview */}
              {selectedTemplate && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{selectedTemplate.name}</h4>
                    <Badge variant="outline">{selectedTemplate.defaultPercentage}% honoraires</Badge>
                  </div>
                  {selectedTemplate.deliverables && selectedTemplate.deliverables.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Livrables types :</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.deliverables.slice(0, 4).map((d, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {d}
                          </Badge>
                        ))}
                        {selectedTemplate.deliverables.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{selectedTemplate.deliverables.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
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
          <Button
            onClick={handleSubmit}
            disabled={mode === "template" && !selectedTemplate && !isEditing ? true : !formName.trim()}
          >
            {isEditing ? "Enregistrer" : "Ajouter"}
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
