import { useState, useEffect } from "react";
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
import { useProjects, CreateProjectInput } from "@/hooks/useProjects";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { usePhaseTemplates } from "@/hooks/usePhaseTemplates";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { AIRewriteButton } from "@/components/projects/meeting-report/AIRewriteButton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  PROJECT_TYPES,
  ProjectType,
  DEFAULT_PHASES,
  PHASE_COLORS,
} from "@/lib/projectTypes";
import {
  Building2,
  Sofa,
  Theater,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Calendar,
  Wallet,
} from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


const STEPS = [
  { id: "type", label: "Type" },
  { id: "info", label: "Informations" },
  { id: "client", label: "Client" },
  { id: "phases", label: "Phases" },
  { id: "dates", label: "Dates & Budget" },
];

const iconMap: Record<string, React.ElementType> = {
  Sofa: Sofa,
  Building2: Building2,
  Theater: Theater,
};

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject } = useProjects();
  const { companies, isLoading: companiesLoading } = useCRMCompanies();
  
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budget, setBudget] = useState("");
  const [phases, setPhases] = useState<{ name: string; description: string; color: string; code?: string; deliverables?: string[]; percentage_fee?: number }[]>([]);

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
      // Fallback to hardcoded defaults
      const defaultPhases = DEFAULT_PHASES[projectType] || [];
      setPhases(
        defaultPhases.map((phase, index) => ({
          name: phase.name,
          description: phase.description,
          color: PHASE_COLORS[index % PHASE_COLORS.length],
        }))
      );
    }
  }, [projectType, phaseTemplates]);

  const handleCreate = () => {
    if (!name.trim() || !projectType) return;
    
    // Use project type color as the project color
    const projectTypeConfig = PROJECT_TYPES.find(t => t.value === projectType);
    
    const input: CreateProjectInput = {
      name: name.trim(),
      project_type: projectType,
      description: description.trim() || null,
      crm_company_id: isInternal ? null : crmCompanyId,
      address: address.trim() || null,
      city: city.trim() || null,
      surface_area: surfaceArea ? parseFloat(surfaceArea) : null,
      color: projectTypeConfig?.color || "#3B82F6",
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
    setProjectType(null);
    setName("");
    setDescription("");
    setAddress("");
    setCity("");
    setRegion("");
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
    setRegion(result.region);
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!projectType;
      case 1:
        return !!name.trim();
      case 2:
        return true; // Client is optional
      case 3:
        return phases.length > 0;
      case 4:
        return !!startDate && !!endDate; // Dates are now required
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
                    "w-8 h-0.5 mx-1",
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
              {/* Step 1: Project Type */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez le type de projet pour générer automatiquement les phases adaptées.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {PROJECT_TYPES.map((type) => {
                      const Icon = iconMap[type.icon] || Building2;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setProjectType(type.value)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                            projectType === type.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            projectType === type.value ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <span className="font-medium text-sm">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Project Info */}
              {step === 1 && (
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
                          Adresse
                        </Label>
                        <AddressAutocomplete
                          value={address}
                          onChange={setAddress}
                          onAddressSelect={handleAddressSelect}
                          placeholder="Rechercher une adresse..."
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">Ville</Label>
                          <Input
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Paris"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="region">Région</Label>
                          <Input
                            id="region"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="Île-de-France"
                          />
                        </div>
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
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Description</Label>
                      <AIRewriteButton
                        text={description}
                        onRewrite={setDescription}
                        context="description de projet d'architecture"
                      />
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez brièvement le projet..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Client Selection */}
              {step === 2 && (
                <div className="space-y-4">
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
                        {companies
                          .filter(c => c.industry === "client_particulier" || c.industry === "client_professionnel" || c.industry === "promoteur" || c.industry === "investisseur")
                          .map((company) => (
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
                </div>
              )}

              {/* Step 4: Phases Preview */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Les phases suivantes seront créées automatiquement. Vous pourrez les modifier après création.
                  </p>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {phases.map((phase, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: phase.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{phase.name}</p>
                          {phase.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {phase.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Dates & Budget */}
              {step === 4 && (
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Date de début *
                      </Label>
                      <InlineDatePicker
                        value={startDate}
                        onChange={setStartDate}
                        placeholder="Sélectionner..."
                        className="w-full"
                      />
                      {!startDate && (
                        <p className="text-xs text-destructive">Requis pour calculer les phases</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Date de fin prévue *</Label>
                      <InlineDatePicker
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="Sélectionner..."
                        className="w-full"
                      />
                      {!endDate && (
                        <p className="text-xs text-destructive">Requis pour calculer les phases</p>
                      )}
                    </div>
                  </div>

                  {startDate && endDate && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm text-primary">
                        Les {phases.length} phases seront automatiquement réparties sur la durée du projet.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="budget">
                      <Wallet className="h-3.5 w-3.5 inline mr-1" />
                      Budget (€)
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="50000"
                    />
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="font-medium mb-3">Récapitulatif</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Type</dt>
                        <dd className="font-medium">
                          {PROJECT_TYPES.find(t => t.value === projectType)?.label}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Nom</dt>
                        <dd className="font-medium truncate max-w-48">{name}</dd>
                      </div>
                      {selectedCompany && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Client</dt>
                          <dd className="font-medium">{selectedCompany.name}</dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Phases</dt>
                        <dd className="font-medium">{phases.length} phases</dd>
                      </div>
                      {budget && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Budget</dt>
                          <dd className="font-medium">{parseFloat(budget).toLocaleString("fr-FR")} €</dd>
                        </div>
                      )}
                    </dl>
                  </div>
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
              disabled={!canProceed() || createProject.isPending}
            >
              {createProject.isPending ? "Création..." : "Créer le projet"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
