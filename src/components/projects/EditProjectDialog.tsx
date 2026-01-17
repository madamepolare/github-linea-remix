import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjectTypeSettings, getProjectTypeIcon } from "@/hooks/useProjectTypeSettings";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ProjectType } from "@/lib/projectTypes";
import * as LucideIcons from "lucide-react";
import {
  Building2,
  Loader2,
  Home,
} from "lucide-react";

// Disciplines that show surface field
const SURFACE_DISCIPLINES = ["architecture", "interior", "interieur", "archi"];

interface Project {
  id: string;
  name: string;
  description: string | null;
  project_type: ProjectType | null;
  crm_company_id: string | null;
  address: string | null;
  city: string | null;
  postal_code?: string | null;
  surface_area: number | null;
  color: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  is_internal?: boolean;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSave: (updates: Partial<Project>) => void;
  isSaving?: boolean;
}

const colors = [
  { value: "#3B82F6", label: "Bleu" },
  { value: "#10B981", label: "Vert" },
  { value: "#F59E0B", label: "Ambre" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EF4444", label: "Rouge" },
  { value: "#EC4899", label: "Rose" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#000000", label: "Noir" },
];

// Helper to get icon component from name
const getIconComponent = (iconName: string): React.ElementType => {
  const icons = LucideIcons as unknown as Record<string, React.ElementType>;
  const Icon = icons[iconName];
  return Icon || Building2;
};

// Check if discipline should show surface field
function shouldShowSurface(disciplineKey: string | null): boolean {
  if (!disciplineKey) return false;
  return SURFACE_DISCIPLINES.some(d => 
    disciplineKey.toLowerCase().includes(d.toLowerCase())
  );
}

export function EditProjectDialog({ 
  open, 
  onOpenChange, 
  project, 
  onSave,
  isSaving = false 
}: EditProjectDialogProps) {
  const { companies } = useCRMCompanies();
  const { projectTypes: disciplines, isLoading: isLoadingDisciplines } = useProjectTypeSettings();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [projectType, setProjectType] = useState<ProjectType | null>(project.project_type);
  const [address, setAddress] = useState(project.address || "");
  const [city, setCity] = useState(project.city || "");
  const [postalCode, setPostalCode] = useState(project.postal_code || "");
  const [surfaceArea, setSurfaceArea] = useState(project.surface_area?.toString() || "");
  const [color, setColor] = useState(project.color || "#3B82F6");
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(project.crm_company_id);
  const [startDate, setStartDate] = useState<Date | null>(
    project.start_date ? parseISO(project.start_date) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    project.end_date ? parseISO(project.end_date) : null
  );
  const [budget, setBudget] = useState(project.budget?.toString() || "");
  const [isInternal, setIsInternal] = useState(project.is_internal || false);

  // Check if surface should be shown based on project type
  const showSurface = useMemo(() => shouldShowSurface(projectType), [projectType]);

  // Sync state when project changes
  useEffect(() => {
    setName(project.name);
    setDescription(project.description || "");
    setProjectType(project.project_type);
    setAddress(project.address || "");
    setCity(project.city || "");
    setPostalCode(project.postal_code || "");
    setSurfaceArea(project.surface_area?.toString() || "");
    setColor(project.color || "#3B82F6");
    setCrmCompanyId(project.crm_company_id);
    setStartDate(project.start_date ? parseISO(project.start_date) : null);
    setEndDate(project.end_date ? parseISO(project.end_date) : null);
    setBudget(project.budget?.toString() || "");
    setIsInternal(project.is_internal || false);
  }, [project]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      project_type: projectType,
      address: address.trim() || null,
      city: city.trim() || null,
      postal_code: postalCode.trim() || null,
      surface_area: showSurface && surfaceArea ? parseFloat(surfaceArea) : null,
      color,
      crm_company_id: isInternal ? null : crmCompanyId,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      budget: isInternal ? null : (budget ? parseFloat(budget) : null),
      is_internal: isInternal,
    });
  };

  // Filter client companies
  const clientCompanies = companies.filter(c => 
    c.industry === "client_particulier" || 
    c.industry === "client_professionnel" || 
    c.industry === "promoteur" || 
    c.industry === "investisseur" ||
    !c.industry
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Internal Project Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="edit-is-internal" className="text-sm font-medium cursor-pointer">
                  Projet interne
                </Label>
                <p className="text-xs text-muted-foreground">
                  Non facturable (admin, formation, commercial...)
                </p>
              </div>
            </div>
            <Switch
              id="edit-is-internal"
              checked={isInternal}
              onCheckedChange={setIsInternal}
            />
          </div>

          {/* Project Type from Settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Type de projet</Label>
            {isLoadingDisciplines ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : disciplines.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                Aucun type de projet configuré. Configurez-les dans les paramètres.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {disciplines.map((discipline) => {
                  const iconName = discipline.icon || getProjectTypeIcon(discipline.key);
                  const Icon = getIconComponent(iconName);
                  return (
                    <button
                      key={discipline.key}
                      type="button"
                      onClick={() => setProjectType(discipline.key as ProjectType)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                        projectType === discipline.key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        projectType === discipline.key ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-xs">{discipline.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Name & Color */}
          <div className="grid grid-cols-[1fr,auto] gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du projet"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-1.5 flex-wrap max-w-[140px]">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      color === c.value && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Client - hidden for internal projects */}
          {!isInternal && (
            <div className="space-y-2">
              <Label>Client</Label>
              <Select 
                value={crmCompanyId || "none"} 
                onValueChange={(v) => setCrmCompanyId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun client</SelectItem>
                  {clientCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location - hidden for internal projects */}
          {!isInternal && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 rue de Paris"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Surface & Budget - conditionally shown */}
          {!isInternal && (
            <div className={cn("grid gap-4", showSurface ? "grid-cols-2" : "grid-cols-1")}>
              {showSurface && (
                <div className="space-y-2">
                  <Label htmlFor="surface">Surface (m²)</Label>
                  <Input
                    id="surface"
                    type="number"
                    value={surfaceArea}
                    onChange={(e) => setSurfaceArea(e.target.value)}
                    placeholder="150"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (€)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="50000"
                />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <InlineDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <InlineDatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes sur le projet..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
