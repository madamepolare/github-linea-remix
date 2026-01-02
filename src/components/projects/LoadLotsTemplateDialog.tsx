import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getDefaultLotsForProjectType, LotTemplate, DefaultLot } from "@/lib/defaultLots";
import { ProjectType, PROJECT_TYPES } from "@/lib/projectTypes";
import { FileStack, Package } from "lucide-react";

interface LoadLotsTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectType: ProjectType | null;
  onLoadLots: (lots: DefaultLot[]) => void;
}

export function LoadLotsTemplateDialog({
  isOpen,
  onClose,
  projectType,
  onLoadLots,
}: LoadLotsTemplateDialogProps) {
  const [selectedType, setSelectedType] = useState<ProjectType>(projectType || "interior");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedLots, setSelectedLots] = useState<Set<number>>(new Set());

  const templates = getDefaultLotsForProjectType(selectedType);
  const currentTemplate = templates.find(t => t.name === selectedTemplate);

  const handleTypeChange = (type: ProjectType) => {
    setSelectedType(type);
    setSelectedTemplate(null);
    setSelectedLots(new Set());
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = templates.find(t => t.name === templateName);
    if (template) {
      // Select all lots by default
      setSelectedLots(new Set(template.lots.map((_, idx) => idx)));
    }
  };

  const toggleLot = (index: number) => {
    const newSelected = new Set(selectedLots);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLots(newSelected);
  };

  const toggleAll = () => {
    if (!currentTemplate) return;
    if (selectedLots.size === currentTemplate.lots.length) {
      setSelectedLots(new Set());
    } else {
      setSelectedLots(new Set(currentTemplate.lots.map((_, idx) => idx)));
    }
  };

  const handleLoad = () => {
    if (!currentTemplate) return;
    const lotsToLoad = currentTemplate.lots.filter((_, idx) => selectedLots.has(idx));
    onLoadLots(lotsToLoad);
    onClose();
    setSelectedTemplate(null);
    setSelectedLots(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            Charger des lots prédéfinis
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un modèle de lots adapté à votre type de projet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type de projet */}
          <div className="space-y-2">
            <Label>Type de projet</Label>
            <Select value={selectedType} onValueChange={(v) => handleTypeChange(v as ProjectType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label>Modèle de lots</Label>
            <Select 
              value={selectedTemplate || ""} 
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un modèle..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.name} value={template.name}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {template.name}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {template.lots.length} lots
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Liste des lots */}
          {currentTemplate && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lots à importer ({selectedLots.size}/{currentTemplate.lots.length})</Label>
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selectedLots.size === currentTemplate.lots.length ? "Tout désélectionner" : "Tout sélectionner"}
                </Button>
              </div>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                  {currentTemplate.lots.map((lot, index) => (
                    <label
                      key={index}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedLots.has(index)}
                        onCheckedChange={() => toggleLot(index)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{lot.name}</p>
                        {lot.description && (
                          <p className="text-xs text-muted-foreground">{lot.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleLoad} 
            disabled={!currentTemplate || selectedLots.size === 0}
          >
            Importer {selectedLots.size > 0 ? `(${selectedLots.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
