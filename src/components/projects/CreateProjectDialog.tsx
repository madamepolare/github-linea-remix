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
import { useProjectTypeSettings } from "@/hooks/useProjectTypeSettings";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Loader2,
  Home,
  FolderKanban,
} from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simple 3-step flow
const STEPS = [
  { id: "type", label: "Type de projet" },
  { id: "info", label: "Informations" },
  { id: "client", label: "Client" },
];

// Disciplines that show surface field
const SURFACE_TYPES = ["architecture", "interior", "interieur", "archi"];

// Get icon component from name
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
  const { companies, isLoading: companiesLoading } = useCRMCompanies();
  const { projectTypes, isLoading: typesLoading } = useProjectTypeSettings();
  
  const [step, setStep] = useState(0);
  
  // Step 1: Type
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isInternal, setIsInternal] = useState(false);
  
  // Step 2: Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budget, setBudget] = useState("");
  
  // Step 3: Client
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(null);

  // Get selected type config
  const selectedTypeConfig = useMemo(() => {
    return projectTypes.find(t => t.key === selectedType);
  }, [projectTypes, selectedType]);

  // Check if surface should be shown
  const showSurface = useMemo(() => shouldShowSurface(selectedType), [selectedType]);

  const handleCreate = () => {
    if (!name.trim() || !selectedType) return;
    
    const color = selectedTypeConfig?.color || "#3B82F6";
    
    const input: CreateProjectInput = {
      name: name.trim(),
      project_type: selectedType as any,
      description: description.trim() || null,
      crm_company_id: isInternal ? null : crmCompanyId,
      address: isInternal ? null : (address.trim() || null),
      city: isInternal ? null : (city.trim() || null),
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
    setSelectedType(null);
    setIsInternal(false);
    setName("");
    setDescription("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setSurfaceArea("");
    setStartDate(null);
    setEndDate(null);
    setBudget("");
    setCrmCompanyId(null);
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
      case 0: // Type
        return !!selectedType;
      case 1: // Info
        return !!name.trim();
      case 2: // Client
        return true; // Client is optional
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
    !c.industry
  );

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
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
                    "w-16 h-0.5 mx-1",
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
              {/* Step 0: Project Type */}
              {step === 0 && (
                <div className="space-y-4">
                  {/* Internal Project Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div className="space-y-0.5">
                        <Label htmlFor="is-internal" className="text-sm font-medium cursor-pointer">
                          Projet interne
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Non facturable (admin, R&D, formation...)
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="is-internal"
                      checked={isInternal}
                      onCheckedChange={setIsInternal}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Sélectionnez le type de projet.
                  </p>
                  
                  {typesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : projectTypes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun type de projet configuré.</p>
                      <p className="text-xs">Configurez-les dans les paramètres.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {projectTypes.map((type) => {
                        const Icon = getIconComponent(type.icon || "FolderKanban");
                        return (
                          <button
                            key={type.key}
                            onClick={() => setSelectedType(type.key)}
                            className={cn(
                              "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                              selectedType === type.key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                          >
                            <div 
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                selectedType === type.key ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}
                              style={selectedType === type.key ? {} : { backgroundColor: `${type.color}20` }}
                            >
                              <Icon 
                                className="h-5 w-5" 
                                style={{ color: selectedType === type.key ? undefined : type.color }} 
                              />
                            </div>
                            <span className="font-medium text-sm text-center">{type.label}</span>
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
                    <Badge variant="outline" style={{ borderColor: selectedTypeConfig?.color, color: selectedTypeConfig?.color }}>
                      {selectedTypeConfig?.label}
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
                      placeholder={isInternal ? "Ex: R&D, Formation équipe" : "Ex: Campagne été 2024"}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Notes sur le projet..."
                      rows={2}
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

                  {!isInternal && (
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
                  )}
                </div>
              )}

              {/* Step 2: Client */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" style={{ borderColor: selectedTypeConfig?.color, color: selectedTypeConfig?.color }}>
                      {selectedTypeConfig?.label}
                    </Badge>
                    {isInternal && (
                      <Badge variant="secondary">Projet interne</Badge>
                    )}
                  </div>

                  {isInternal ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Projet interne</p>
                      <p className="text-sm">Pas de client associé</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Associez un client à ce projet (optionnel).
                      </p>

                      {companiesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-3">
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
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    {company.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedCompany && (
                            <div className="p-3 rounded-lg border border-border bg-muted/30">
                              <p className="font-medium">{selectedCompany.name}</p>
                              {selectedCompany.email && (
                                <p className="text-sm text-muted-foreground">{selectedCompany.email}</p>
                              )}
                              {selectedCompany.phone && (
                                <p className="text-sm text-muted-foreground">{selectedCompany.phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Summary */}
                  <div className="mt-6 p-4 rounded-lg border border-border bg-muted/20">
                    <h4 className="font-medium mb-3">Récapitulatif</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span>{selectedTypeConfig?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nom</span>
                        <span className="font-medium">{name}</span>
                      </div>
                      {!isInternal && city && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Localisation</span>
                          <span>{city}</span>
                        </div>
                      )}
                      {startDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Début</span>
                          <span>{format(startDate, "dd/MM/yyyy")}</span>
                        </div>
                      )}
                      {!isInternal && selectedCompany && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Client</span>
                          <span>{selectedCompany.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            
            {step < STEPS.length - 1 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || !selectedType || createProject.isPending}
              >
                {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer le projet
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
