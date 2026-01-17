import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { useProjects, CreateProjectInput } from "@/hooks/useProjects";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { usePhaseTemplates } from "@/hooks/usePhaseTemplates";
import { useProjectTypeSettings } from "@/hooks/useProjectTypeSettings";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ProjectType,
  PHASE_COLORS,
} from "@/lib/projectTypes";
import { getDefaultPhases, DisciplineSlug } from "@/lib/disciplinesConfig";
import {
  Building2,
  Sofa,
  Theater,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Calendar,
  Wallet,
  Hammer,
  Maximize2,
  FileCheck,
  Map,
  LayoutGrid,
  Store,
  Home,
  UtensilsCrossed,
  Building,
  Frame,
  Landmark,
  PartyPopper,
  Box,
  Sparkles,
  Palette,
  Globe,
  FileVideo,
  Loader2,
} from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simplified steps - removed "Type" (sub-type) step
const STEPS = [
  { id: "discipline", label: "Discipline" },
  { id: "info", label: "Informations" },
  { id: "client", label: "Client" },
  { id: "summary", label: "Récapitulatif" },
];

// Disciplines that show surface field
const SURFACE_DISCIPLINES = ["architecture", "interior", "interieur", "archi"];

// Map icon names to components
const iconMap: Record<string, React.ElementType> = {
  Sofa: Sofa,
  Building2: Building2,
  Theater: Theater,
  Megaphone: Megaphone,
  Hammer: Hammer,
  Maximize2: Maximize2,
  FileCheck: FileCheck,
  Map: Map,
  LayoutGrid: LayoutGrid,
  Store: Store,
  Home: Home,
  UtensilsCrossed: UtensilsCrossed,
  Building: Building,
  Frame: Frame,
  Landmark: Landmark,
  PartyPopper: PartyPopper,
  Box: Box,
  Sparkles: Sparkles,
  Palette: Palette,
  Globe: Globe,
  Calendar: Calendar,
  FileVideo: FileVideo,
};

// Map discipline key to legacy ProjectType
function mapDisciplineToProjectType(disciplineKey: string): ProjectType | null {
  const mapping: Record<string, ProjectType> = {
    interior: "interior",
    interieur: "interior",
    architecture: "architecture",
    scenography: "scenography",
    scenographie: "scenography",
  };
  const normalized = disciplineKey.toLowerCase();
  return mapping[normalized] || "interior";
}

// Map project type key to discipline slug for phase defaults
function mapProjectTypeToDiscipline(projectType: string): DisciplineSlug | null {
  const mapping: Record<string, DisciplineSlug> = {
    interior: "interior",
    interieur: "interior",
    architecture: "architecture",
    scenography: "scenography",
    scenographie: "scenography",
    campagne: "communication",
    branding: "communication",
    supports: "communication",
    video: "communication",
    photo: "communication",
    print: "communication",
    motion: "communication",
    web: "communication",
    social: "communication",
  };
  const normalized = projectType.toLowerCase();
  return mapping[normalized] || null;
}

// Check if discipline should show surface field
function shouldShowSurface(disciplineKey: string | null): boolean {
  if (!disciplineKey) return false;
  return SURFACE_DISCIPLINES.some(d => 
    disciplineKey.toLowerCase().includes(d.toLowerCase())
  );
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject } = useProjects();
  const { companies, isLoading: companiesLoading } = useCRMCompanies();
  const { projectTypes: disciplines, isLoading: disciplinesLoading } = useProjectTypeSettings();
  
  const [step, setStep] = useState(0);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budget, setBudget] = useState("");
  const [phases, setPhases] = useState<{ name: string; description: string; color: string; code?: string; deliverables?: string[]; percentage_fee?: number }[]>([]);

  // Get selected discipline config
  const selectedDisciplineConfig = useMemo(() => {
    return disciplines.find(d => d.key === selectedDiscipline);
  }, [disciplines, selectedDiscipline]);

  // Check if surface should be shown
  const showSurface = useMemo(() => shouldShowSurface(selectedDiscipline), [selectedDiscipline]);

  // When discipline changes, set projectType
  useEffect(() => {
    if (selectedDiscipline) {
      const legacyType = mapDisciplineToProjectType(selectedDiscipline);
      setProjectType(legacyType);
    }
  }, [selectedDiscipline]);

  // Fetch phase templates from database
  const { templates: phaseTemplates, initializeDefaultsIfEmpty } = usePhaseTemplates(projectType || undefined);

  // Initialize phases when project type is selected
  useEffect(() => {
    if (projectType) {
      initializeDefaultsIfEmpty.mutate(projectType);
    }
  }, [projectType]);

  // Update phases when templates are loaded
  useEffect(() => {
    if (projectType && phaseTemplates.length > 0) {
      const activeTemplates = phaseTemplates.filter(t => t.is_active);
      setPhases(
        activeTemplates.map((phase, index) => ({
          name: phase.name,
          description: phase.description || '',
          color: phase.color || PHASE_COLORS[index % PHASE_COLORS.length],
          code: phase.code,
          deliverables: phase.deliverables,
          percentage_fee: phase.default_percentage
        }))
      );
    } else if (projectType) {
      const disciplineSlug = mapProjectTypeToDiscipline(projectType);
      if (disciplineSlug) {
        const defaultPhases = getDefaultPhases(disciplineSlug);
        setPhases(
          defaultPhases.map((phase, index) => ({
            name: phase.name,
            description: phase.description || '',
            color: PHASE_COLORS[index % PHASE_COLORS.length],
          }))
        );
      }
    }
  }, [projectType, phaseTemplates, selectedDisciplineConfig]);

  const handleCreate = () => {
    if (!name.trim() || !projectType) return;
    
    const color = selectedDisciplineConfig?.color || "#3B82F6";
    
    const input: CreateProjectInput = {
      name: name.trim(),
      project_type: projectType,
      description: description.trim() || null,
      crm_company_id: isInternal ? null : crmCompanyId,
      address: address.trim() || null,
      city: city.trim() || null,
      surface_area: showSurface && surfaceArea ? parseFloat(surfaceArea) : null,
      color,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      budget: isInternal ? null : (budget ? parseFloat(budget) : null),
      is_internal: isInternal,
    };
    
    createProject.mutate(input);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(0);
    setSelectedDiscipline(null);
    setProjectType(null);
    setName("");
    setDescription("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setSurfaceArea("");
    setIsInternal(false);
    setCrmCompanyId(null);
    setStartDate(null);
    setEndDate(null);
    setBudget("");
    setPhases([]);
  };

  const handleAddressSelect = (result: {
    address: string;
    city: string;
    postalCode: string;
    region: string;
  }) => {
    setCity(result.city);
    setPostalCode(result.postalCode);
  };

  const canProceed = () => {
    switch (step) {
      case 0: // Discipline
        return !!selectedDiscipline;
      case 1: // Info
        return !!name.trim();
      case 2: // Client
        return true; // Client is optional
      case 3: // Summary
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1 && canProceed()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const selectedCompany = companies.find(c => c.id === crmCompanyId);

  // Filter client companies
  const clientCompanies = companies.filter(c => 
    c.industry === "client_particulier" || 
    c.industry === "client_professionnel" || 
    c.industry === "promoteur" || 
    c.industry === "investisseur" ||
    !c.industry // Include companies without industry set
  );

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle>Nouveau projet</DialogTitle>
          
          {/* Step indicators */}
          <div className="flex items-center gap-1 pt-4">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all",
                    index < step && "bg-primary text-primary-foreground cursor-pointer",
                    index === step && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                    index > step && "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </button>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-1",
                    index < step ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground pt-2">{STEPS[step].label}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Discipline Selection */}
              {step === 0 && (
                <div className="space-y-4">
                  {/* Internal Project Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="is-internal" className="text-sm font-medium cursor-pointer">
                        Projet interne
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Non facturable (admin, formation, commercial...)
                      </p>
                    </div>
                    <Switch
                      id="is-internal"
                      checked={isInternal}
                      onCheckedChange={setIsInternal}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Sélectionnez la discipline pour ce projet.
                  </p>
                  
                  {disciplinesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {disciplines.map((discipline) => {
                        const Icon = iconMap[discipline.icon || "Building2"] || Building2;
                        return (
                          <button
                            key={discipline.key}
                            onClick={() => setSelectedDiscipline(discipline.key)}
                            className={cn(
                              "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                              selectedDiscipline === discipline.key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                          >
                            <div 
                              className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center",
                                selectedDiscipline === discipline.key ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}
                              style={selectedDiscipline === discipline.key ? {} : { backgroundColor: `${discipline.color}20` }}
                            >
                              <Icon className="h-6 w-6" style={{ color: selectedDiscipline === discipline.key ? undefined : discipline.color }} />
                            </div>
                            <span className="font-medium text-sm">{discipline.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Project Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" style={{ borderColor: selectedDisciplineConfig?.color, color: selectedDisciplineConfig?.color }}>
                      {selectedDisciplineConfig?.label}
                    </Badge>
                    {isInternal && (
                      <Badge variant="secondary">Projet interne</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du projet *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isInternal ? "Ex: Administration, Formation équipe" : "Ex: Rénovation appartement Haussmannien"}
                      autoFocus
                    />
                  </div>

                  {!isInternal && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="address">
                          <MapPin className="h-3.5 w-3.5 inline mr-1" />
                          Adresse du projet
                        </Label>
                        <AddressAutocomplete
                          value={address}
                          onChange={setAddress}
                          onAddressSelect={handleAddressSelect}
                          placeholder="Rechercher une adresse..."
                        />
                      </div>

                      <div className={cn("grid gap-4", showSurface ? "grid-cols-3" : "grid-cols-2")}>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Code postal</Label>
                          <Input
                            id="postalCode"
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
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez brièvement le projet..."
                      rows={3}
                    />
                  </div>

                  {/* Dates inline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Date de début
                      </Label>
                      <InlineDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="Sélectionner..."
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de fin prévue</Label>
                      <InlineDatePicker
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="Sélectionner..."
                        className="w-full"
                      />
                    </div>
                  </div>

                  {!isInternal && (
                    <div className="space-y-2">
                      <Label htmlFor="budget">
                        <Wallet className="h-3.5 w-3.5 inline mr-1" />
                        Budget estimé (€)
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Client Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  {isInternal ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <Home className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm font-medium">Projet interne</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pas de client associé aux projets internes
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Sélectionnez un client depuis le CRM ou passez cette étape.
                      </p>
                      
                      <div className="space-y-2">
                        <Label>Client (optionnel)</Label>
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

                      {selectedCompany && (
                        <div className="p-4 rounded-lg border border-border bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{selectedCompany.name}</p>
                              {selectedCompany.email && (
                                <p className="text-sm text-muted-foreground">{selectedCompany.email}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Summary */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vérifiez les informations avant de créer le projet.
                  </p>
                  
                  {/* Summary card */}
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${selectedDisciplineConfig?.color}20` }}
                      >
                        {(() => {
                          const Icon = iconMap[selectedDisciplineConfig?.icon || "Building2"] || Building2;
                          return <Icon className="h-6 w-6" style={{ color: selectedDisciplineConfig?.color }} />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" style={{ borderColor: selectedDisciplineConfig?.color, color: selectedDisciplineConfig?.color }}>
                            {selectedDisciplineConfig?.label}
                          </Badge>
                          {isInternal && <Badge variant="secondary">Interne</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <dl className="space-y-3 text-sm">
                    {description && (
                      <div>
                        <dt className="text-muted-foreground">Description</dt>
                        <dd className="font-medium mt-0.5">{description}</dd>
                      </div>
                    )}
                    
                    {!isInternal && (address || city) && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Localisation</dt>
                        <dd className="font-medium text-right">
                          {[address, postalCode, city].filter(Boolean).join(", ")}
                        </dd>
                      </div>
                    )}

                    {showSurface && surfaceArea && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Surface</dt>
                        <dd className="font-medium">{parseFloat(surfaceArea).toLocaleString("fr-FR")} m²</dd>
                      </div>
                    )}

                    {startDate && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Dates</dt>
                        <dd className="font-medium">
                          {format(startDate, "dd/MM/yyyy")}
                          {endDate && ` → ${format(endDate, "dd/MM/yyyy")}`}
                        </dd>
                      </div>
                    )}

                    {selectedCompany && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Client</dt>
                        <dd className="font-medium">{selectedCompany.name}</dd>
                      </div>
                    )}

                    {budget && !isInternal && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Budget</dt>
                        <dd className="font-medium">{parseFloat(budget).toLocaleString("fr-FR")} €</dd>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t">
                      <dt className="text-muted-foreground">Phases</dt>
                      <dd className="font-medium">{phases.length} phases seront créées</dd>
                    </div>
                  </dl>

                  {/* Phases preview */}
                  {phases.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Phases du projet :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {phases.map((phase, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: phase.color, color: phase.color }}
                          >
                            {phase.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={step === 0 ? () => onOpenChange(false) : prevStep}
          >
            {step === 0 ? (
              "Annuler"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </>
            )}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreate} 
              disabled={!name.trim() || !projectType || createProject.isPending}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le projet"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
