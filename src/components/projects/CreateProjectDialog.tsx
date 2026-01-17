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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects, CreateProjectInput } from "@/hooks/useProjects";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjectTypeSettings, getProjectTypeIcon } from "@/hooks/useProjectTypeSettings";
import { useProjectCategorySettings } from "@/hooks/useProjectCategorySettings";
import { ClientSelector, SelectedClient } from "@/components/projects/ClientSelector";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import {
  Building2,
  Loader2,
  Home,
  FolderKanban,
  MapPin,
  Calendar,
  Wallet,
  FileText,
  Settings,
  Lock,
  TrendingUp,
  Receipt,
  Briefcase,
  Building,
  RefreshCw,
  Wrench,
} from "lucide-react";

// Disciplines that show surface field
const SURFACE_TYPES = ["architecture", "interior", "interieur", "archi"];

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Briefcase,
  Building,
  RefreshCw,
  Wrench,
};

// Helper to get icon component from name
const getIconComponent = (iconName: string): React.ElementType => {
  const icons = LucideIcons as unknown as Record<string, React.ElementType>;
  return icons[iconName] || FolderKanban;
};

// Check if project type should show surface field
function shouldShowSurface(projectType: string | null): boolean {
  if (!projectType) return false;
  return SURFACE_TYPES.some(t => 
    projectType.toLowerCase().includes(t.toLowerCase())
  );
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject } = useProjects();
  const { companies } = useCRMCompanies();
  const { enabledCategories, isLoading: isLoadingCategories, getCategoryConfig } = useProjectCategorySettings();
  
  const [activeTab, setActiveTab] = useState("general");
  
  // General
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<string | null>(null);
  const [projectCategory, setProjectCategory] = useState<string>("standard");
  const [color, setColor] = useState("#3B82F6");
  
  // Client & Location
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [budget, setBudget] = useState("");
  
  // Planning
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Fetch project types filtered by category
  const { projectTypes, isLoading: isLoadingTypes } = useProjectTypeSettings(projectCategory);

  // Derived states
  const isInternal = projectCategory === "internal";
  const categoryConfig = useMemo(() => getCategoryConfig(projectCategory), [getCategoryConfig, projectCategory]);
  const showSurface = useMemo(() => shouldShowSurface(projectType), [projectType]);
  const showEndDate = categoryConfig.features.hasEndDate;
  const showBudget = categoryConfig.features.hasBudget;

  // Get current type config
  const currentTypeConfig = useMemo(() => {
    return projectTypes.find(t => t.key === projectType);
  }, [projectTypes, projectType]);

  // Ensure selected category is still enabled, otherwise select first enabled
  useMemo(() => {
    if (!isLoadingCategories && enabledCategories.length > 0) {
      const currentCategoryEnabled = enabledCategories.some(c => c.key === projectCategory);
      if (!currentCategoryEnabled) {
        setProjectCategory(enabledCategories[0].key);
      }
    }
  }, [enabledCategories, isLoadingCategories]);

  // Reset project type when category changes if current type is not available
  useMemo(() => {
    if (projectType && projectTypes.length > 0) {
      const typeStillAvailable = projectTypes.some(t => t.key === projectType);
      if (!typeStillAvailable) {
        setProjectType(null);
      }
    }
  }, [projectCategory, projectTypes]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setProjectType(null);
    setProjectCategory("standard");
    setColor("#3B82F6");
    setCrmCompanyId(null);
    setSelectedClient(null);
    setAddress("");
    setCity("");
    setPostalCode("");
    setSurfaceArea("");
    setBudget("");
    setStartDate(null);
    setEndDate(null);
    setActiveTab("general");
  };

  const handleCreate = () => {
    if (!name.trim() || !projectType) return;
    
    const input: CreateProjectInput = {
      name: name.trim(),
      description: description.trim() || null,
      project_type: projectType as any,
      project_category: projectCategory,
      color: currentTypeConfig?.color || color,
      crm_company_id: isInternal ? null : crmCompanyId,
      address: isInternal ? null : (address.trim() || null),
      city: isInternal ? null : (city.trim() || null),
      surface_area: showSurface && surfaceArea ? parseFloat(surfaceArea) : null,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: showEndDate && endDate ? format(endDate, "yyyy-MM-dd") : null,
      budget: showBudget && budget ? parseFloat(budget) : null,
      is_internal: isInternal,
      categoryConfig: categoryConfig,
    };
    
    createProject.mutate(input);
    onOpenChange(false);
    resetForm();
  };

  const canCreate = !!name.trim() && !!projectType;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 pt-2 border-b">
            <TabsList className="h-9 bg-transparent p-0 w-full justify-start gap-4">
              <TabsTrigger value="general" className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                <Settings className="h-4 w-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="client" className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                <Building2 className="h-4 w-4 mr-2" />
                Client
              </TabsTrigger>
              <TabsTrigger value="planning" className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                <Calendar className="h-4 w-4 mr-2" />
                Planning
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(90vh-200px)] px-6 py-4">
            {/* General Tab */}
            <TabsContent value="general" className="mt-0 space-y-6">
              {/* Category Selection */}
              <div className="space-y-3">
              <Label className="text-sm font-medium">Catégorie de projet</Label>
                {isLoadingCategories ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className={cn(
                    "grid gap-2",
                    enabledCategories.length <= 2 ? "grid-cols-2" : 
                    enabledCategories.length === 3 ? "grid-cols-3" : "grid-cols-4"
                  )}>
                    {enabledCategories.map((cat) => {
                      const CategoryIcon = CATEGORY_ICONS[cat.icon] || Briefcase;
                      const isSelected = projectCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setProjectCategory(cat.key)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                            style={isSelected ? {} : { backgroundColor: `${cat.color}15` }}
                          >
                            <CategoryIcon 
                              className="h-4 w-4" 
                              style={{ color: isSelected ? undefined : cat.color }} 
                            />
                          </div>
                          <span className="text-xs font-medium text-center leading-tight">{cat.labelShort}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{categoryConfig.description}</p>
              </div>

              <Separator />

              {/* Project Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Typologie de projet *</Label>
                {isLoadingTypes ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : projectTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                    Aucun type de projet configuré.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {projectTypes.map((type) => {
                      const iconName = type.icon || getProjectTypeIcon(type.key);
                      const Icon = getIconComponent(iconName);
                      const isSelected = projectType === type.key;
                      return (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => setProjectType(type.key)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <Icon 
                            className="h-3.5 w-3.5" 
                            style={{ color: isSelected ? undefined : type.color }}
                          />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Name & Color */}
              <div className="grid grid-cols-[1fr,auto] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du projet *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom du projet"
                    autoFocus
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description du projet..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Client Tab */}
            <TabsContent value="client" className="mt-0 space-y-6">
              {isInternal ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Home className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Les projets internes n'ont pas de client associé.
                  </p>
                </div>
              ) : (
                <>
                  {/* Client Selector */}
                  <ClientSelector
                    value={selectedClient}
                    onChange={(client) => {
                      setSelectedClient(client);
                      setCrmCompanyId(client?.type === "company" ? client.id : null);
                    }}
                    companyId={crmCompanyId}
                    onCompanyIdChange={setCrmCompanyId}
                  />

                  <Separator />

                  {/* Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Localisation du projet</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs text-muted-foreground">Adresse</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Adresse du projet"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-xs text-muted-foreground">Ville</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ville"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal-code" className="text-xs text-muted-foreground">Code postal</Label>
                        <Input
                          id="postal-code"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Code postal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Surface (conditional) */}
                  {showSurface && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="surface" className="text-sm font-medium">Surface</Label>
                        <div className="relative">
                          <Input
                            id="surface"
                            type="number"
                            value={surfaceArea}
                            onChange={(e) => setSurfaceArea(e.target.value)}
                            placeholder="Surface du projet"
                            className="pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            m²
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Budget */}
                  {showBudget && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="budget" className="text-sm font-medium">Budget</Label>
                        </div>
                        <div className="relative">
                          <Input
                            id="budget"
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="Budget du projet"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            €
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Planning Tab */}
            <TabsContent value="planning" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Dates du projet</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Date de début</Label>
                    <InlineDatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Date de début"
                    />
                  </div>
                  
                  {showEndDate && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Date de fin</Label>
                      <InlineDatePicker
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="Date de fin"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate || createProject.isPending}>
            {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le projet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}