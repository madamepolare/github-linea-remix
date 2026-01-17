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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjectTypeSettings, getProjectTypeIcon } from "@/hooks/useProjectTypeSettings";
import { ClientSelector, SelectedClient } from "@/components/projects/ClientSelector";

import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
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
  Users,
  Target,
} from "lucide-react";

// Disciplines that show surface field
const SURFACE_TYPES = ["architecture", "interior", "interieur", "archi"];

// Progress tracking types
const PROGRESS_TYPES = [
  { value: "manual", label: "Manuel", description: "Avancement saisi manuellement" },
  { value: "phases", label: "Phases", description: "Basé sur les phases terminées" },
  { value: "tasks", label: "Tâches", description: "Basé sur les tâches terminées" },
  { value: "billing", label: "Facturation", description: "Basé sur les factures émises" },
  { value: "time", label: "Temps", description: "Basé sur le temps passé vs estimé" },
];

interface Project {
  id: string;
  name: string;
  description: string | null;
  project_type: string | null;
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
  status?: string;
  is_restricted?: boolean;
  progress_type?: string;
  invoice_details?: string | null;
  show_quote_on_invoice?: boolean;
  market_reference?: string | null;
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
  return icons[iconName] || FolderKanban;
};

// Check if project type should show surface field
function shouldShowSurface(projectType: string | null): boolean {
  if (!projectType) return false;
  return SURFACE_TYPES.some(t => 
    projectType.toLowerCase().includes(t.toLowerCase())
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
  const { projectTypes, isLoading: isLoadingTypes } = useProjectTypeSettings();
  
  const [activeTab, setActiveTab] = useState("general");
  
  // General
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [projectType, setProjectType] = useState<string | null>(project.project_type);
  const [color, setColor] = useState(project.color || "#3B82F6");
  const [isInternal, setIsInternal] = useState(project.is_internal || false);
  const [status, setStatus] = useState<"active" | "closed">(project.status === "closed" ? "closed" : "active");
  const [isRestricted, setIsRestricted] = useState(project.is_restricted || false);
  
  // Client & Location
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(project.crm_company_id);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(() => {
    if (project.crm_company_id) {
      return { type: "company", id: project.crm_company_id, name: "" };
    }
    return null;
  });
  const [address, setAddress] = useState(project.address || "");
  const [city, setCity] = useState(project.city || "");
  const [postalCode, setPostalCode] = useState(project.postal_code || "");
  const [surfaceArea, setSurfaceArea] = useState(project.surface_area?.toString() || "");
  const [budget, setBudget] = useState(project.budget?.toString() || "");
  
  // Planning
  const [startDate, setStartDate] = useState<Date | null>(
    project.start_date ? parseISO(project.start_date) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    project.end_date ? parseISO(project.end_date) : null
  );
  
  // Advanced
  const [progressType, setProgressType] = useState(project.progress_type || "phases");
  const [invoiceDetails, setInvoiceDetails] = useState(project.invoice_details || "");
  const [showQuoteOnInvoice, setShowQuoteOnInvoice] = useState(project.show_quote_on_invoice ?? true);
  const [marketReference, setMarketReference] = useState(project.market_reference || "");

  // Check if surface should be shown based on project type
  const showSurface = useMemo(() => shouldShowSurface(projectType), [projectType]);

  // Get current type config
  const currentTypeConfig = useMemo(() => {
    return projectTypes.find(t => t.key === projectType);
  }, [projectTypes, projectType]);

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
    // Initialize selectedClient based on crm_company_id
    if (project.crm_company_id) {
      setSelectedClient({ type: "company", id: project.crm_company_id, name: "" });
    } else {
      setSelectedClient(null);
    }
    setStartDate(project.start_date ? parseISO(project.start_date) : null);
    setEndDate(project.end_date ? parseISO(project.end_date) : null);
    setBudget(project.budget?.toString() || "");
    setIsInternal(project.is_internal || false);
    setStatus(project.status === "closed" ? "closed" : "active");
    setIsRestricted(project.is_restricted || false);
    setProgressType(project.progress_type || "phases");
    setInvoiceDetails(project.invoice_details || "");
    setShowQuoteOnInvoice(project.show_quote_on_invoice ?? true);
    setMarketReference(project.market_reference || "");
    setActiveTab("general");
  }, [project]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    // Only save fields that exist in the database
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      project_type: projectType as any,
      address: isInternal ? null : (address.trim() || null),
      city: isInternal ? null : (city.trim() || null),
      postal_code: isInternal ? null : (postalCode.trim() || null),
      surface_area: showSurface && surfaceArea ? parseFloat(surfaceArea) : null,
      color,
      crm_company_id: isInternal ? null : crmCompanyId,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      budget: isInternal ? null : (budget ? parseFloat(budget) : null),
      is_internal: isInternal,
      status,
    });
    
    // Close the dialog after saving
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Paramètres du projet</DialogTitle>
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
              <TabsTrigger value="advanced" className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                <TrendingUp className="h-4 w-4 mr-2" />
                Avancé
              </TabsTrigger>
              <TabsTrigger value="invoice" className="px-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
                <Receipt className="h-4 w-4 mr-2" />
                Facturation
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(90vh-200px)] px-6 py-4">
            {/* General Tab */}
            <TabsContent value="general" className="mt-0 space-y-6">
              {/* Status & Toggles */}
              <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Statut</Label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setStatus("active")}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all",
                        status === "active"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                          : "border-border hover:border-emerald-500/50"
                      )}
                    >
                      Ouvert
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("closed")}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all",
                        status === "closed"
                          ? "border-muted-foreground bg-muted text-muted-foreground"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      Fermé
                    </button>
                  </div>
                </div>

                {/* Project Type Quick Display */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="h-[42px] flex items-center gap-2 px-3 rounded-lg border bg-muted/30">
                    {currentTypeConfig ? (
                      <>
                        {(() => {
                          const iconName = currentTypeConfig.icon || getProjectTypeIcon(currentTypeConfig.key);
                          const Icon = getIconComponent(iconName);
                          return <Icon className="h-4 w-4" style={{ color: currentTypeConfig.color }} />;
                        })()}
                        <span className="text-sm font-medium">{currentTypeConfig.label}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Non défini</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isInternal ? "border-primary/50 bg-primary/5" : "border-border"
                )}>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="edit-is-internal" className="text-xs font-medium cursor-pointer">
                        Projet interne
                      </Label>
                      <p className="text-2xs text-muted-foreground">Non facturable</p>
                    </div>
                  </div>
                  <Switch
                    id="edit-is-internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                  />
                </div>

                <div className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isRestricted ? "border-amber-500/50 bg-amber-500/5" : "border-border"
                )}>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="edit-is-restricted" className="text-xs font-medium cursor-pointer">
                        Projet restreint
                      </Label>
                      <p className="text-2xs text-muted-foreground">Accès limité</p>
                    </div>
                  </div>
                  <Switch
                    id="edit-is-restricted"
                    checked={isRestricted}
                    onCheckedChange={setIsRestricted}
                  />
                </div>
              </div>

              {/* Project Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Typologie de projet</Label>
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

              {/* Planning */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Planification
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Date de début</Label>
                    <InlineDatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Sélectionner..."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Date de fin</Label>
                    <InlineDatePicker
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Sélectionner..."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Notes</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes sur le projet..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Client Tab */}
            <TabsContent value="client" className="mt-0 space-y-6">
              {isInternal ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Home className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Projet interne - pas de client associé
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => { setIsInternal(false); setActiveTab("client"); }}
                    className="mt-2"
                  >
                    Convertir en projet client
                  </Button>
                </div>
              ) : (
                <>
                  {/* Client Selection with Search */}
                  <ClientSelector
                    value={selectedClient}
                    onChange={setSelectedClient}
                    companyId={crmCompanyId}
                    onCompanyIdChange={setCrmCompanyId}
                  />

                  <Separator />

                  {/* Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Lieu d'exécution
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 rue de Paris"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                  <Separator />

                  {/* Budget & Surface */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      Budget & Détails
                    </div>

                    <div className={cn("grid gap-4", showSurface ? "grid-cols-2" : "grid-cols-1")}>
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget HT (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="50000"
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
                  </div>
                </>
              )}
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="mt-0 space-y-6">
              {/* Progress Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Type d'avancement</Label>
                <p className="text-xs text-muted-foreground">
                  Méthode de calcul de l'avancement du projet
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {PROGRESS_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setProgressType(type.value)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                        progressType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center",
                        progressType === type.value ? "border-primary" : "border-muted-foreground/30"
                      )}>
                        {progressType === type.value && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{type.label}</span>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Market Reference */}
              <div className="space-y-2">
                <Label htmlFor="market_reference">Numéro de marché / Référence</Label>
                <Input
                  id="market_reference"
                  value={marketReference}
                  onChange={(e) => setMarketReference(e.target.value)}
                  placeholder="Ex: MARCH-2024-001"
                />
                <p className="text-xs text-muted-foreground">
                  Référence pour les marchés publics ou identifiant client
                </p>
              </div>
            </TabsContent>

            {/* Invoice Tab */}
            <TabsContent value="invoice" className="mt-0 space-y-6">
              {isInternal ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Home className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Projet interne - pas de facturation
                  </p>
                </div>
              ) : (
                <>
                  {/* Invoice Details */}
                  <div className="space-y-2">
                    <Label htmlFor="invoice_details">Détails à ajouter sur les factures</Label>
                    <Textarea
                      id="invoice_details"
                      value={invoiceDetails}
                      onChange={(e) => setInvoiceDetails(e.target.value)}
                      placeholder="Numéro de bon de commande, référence PO..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ces informations apparaîtront sur toutes les factures du projet
                    </p>
                  </div>

                  <Separator />

                  {/* Invoice Options */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Options d'affichage</Label>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="show_quote" className="text-sm font-medium cursor-pointer">
                          Afficher le détail du devis sur les factures
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Inclut les lignes du devis accepté
                        </p>
                      </div>
                      <Switch
                        id="show_quote"
                        checked={showQuoteOnInvoice}
                        onCheckedChange={setShowQuoteOnInvoice}
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
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
