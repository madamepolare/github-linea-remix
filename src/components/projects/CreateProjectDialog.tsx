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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useProjects, CreateProjectInput, ProjectContactInput } from "@/hooks/useProjects";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjectTypeSettings } from "@/hooks/useProjectTypeSettings";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useContacts } from "@/hooks/useContacts";
import { useCommercialDocuments } from "@/hooks/useCommercialDocuments";
import { CLIENT_TEAM_ROLES } from "@/hooks/useProjectContacts";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { ClientSelector, SelectedClient } from "@/components/projects/ClientSelector";
import { PROJECT_CATEGORIES, ProjectCategory, getProjectCategoryConfig, categoryHasFeature } from "@/lib/projectCategories";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  FolderKanban,
  Calendar,
  Users,
  Check,
  Briefcase,
  Building,
  RefreshCw,
  Wrench,
  FileText,
  Euro,
  Clock,
} from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Briefcase,
  Building,
  RefreshCw,
  Wrench,
};

// Get icon component from name
const getIconComponent = (iconName: string): React.ElementType => {
  const icons = LucideIcons as unknown as Record<string, React.ElementType>;
  return icons[iconName] || FolderKanban;
};

// Budget mode type
type BudgetMode = 'quote' | 'manual' | 'later';

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { createProject } = useProjects();
  const { companies, isLoading: companiesLoading } = useCRMCompanies();
  const { projectTypes, isLoading: typesLoading } = useProjectTypeSettings();
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembers();
  const { documents = [], isLoading: docsLoading } = useCommercialDocuments();
  
  // Collapsible sections
  const [configOpen, setConfigOpen] = useState(true);
  const [planningOpen, setPlanningOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  
  // Configuration
  const [name, setName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>("standard");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "closed">("active");
  
  // Planning
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Équipe
  const [selectedReferents, setSelectedReferents] = useState<string[]>([]);
  
  // Client & Budget
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [budget, setBudget] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('later');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  
  // Client contacts
  const [selectedClientContacts, setSelectedClientContacts] = useState<{id: string; role: string}[]>([]);

  // Get current category config for conditional rendering
  const categoryConfig = useMemo(() => getProjectCategoryConfig(selectedCategory), [selectedCategory]);

  // Fetch contacts for selected company
  const { contacts: companyContacts = [], isLoading: contactsLoading } = useContacts({
    companyId: crmCompanyId || undefined,
  });

  // Get selected type configs
  const selectedTypeConfigs = useMemo(() => {
    return projectTypes.filter(t => selectedTypes.includes(t.key));
  }, [projectTypes, selectedTypes]);

  // Get signed/accepted quotes (without project linked)
  const availableQuotes = useMemo(() => {
    return documents.filter(
      d => d.document_type === 'quote' && 
      (d.status === 'accepted' || d.status === 'signed') &&
      !d.project_id // Only quotes not already linked to a project
    );
  }, [documents]);

  // Get selected quote
  const selectedQuote = useMemo(() => {
    return availableQuotes.find(q => q.id === selectedQuoteId);
  }, [availableQuotes, selectedQuoteId]);

  // Derived states from category
  const isInternal = selectedCategory === 'internal';
  const showClientSection = categoryConfig.features.isBillable;
  const showEndDate = categoryConfig.features.hasEndDate;
  const showBudget = categoryConfig.features.hasBudget;
  const showMonthlyBudget = categoryConfig.features.hasMonthlyBudget;

  // Filter client companies (for backwards compatibility and contacts display)
  const clientCompanies = companies.filter(c => 
    c.industry === "client_particulier" || 
    c.industry === "client_professionnel" || 
    c.industry === "promoteur" || 
    c.industry === "investisseur" ||
    !c.industry
  );

  const selectedCompany = selectedClient?.type === "company" 
    ? companies.find(c => c.id === selectedClient.id) 
    : null;

  const handleCreate = () => {
    if (!name.trim() || selectedTypes.length === 0) return;
    
    // Use first type's color
    const color = selectedTypeConfigs[0]?.color || "#3B82F6";
    
    // Determine budget based on mode
    let finalBudget: number | null = null;
    if (budgetMode === 'quote' && selectedQuote) {
      finalBudget = selectedQuote.total_amount || null;
    } else if (budgetMode === 'manual' && budget) {
      finalBudget = parseFloat(budget);
    }
    
    const input: CreateProjectInput = {
      name: name.trim(),
      project_type: selectedTypes[0] as any, // Use first type as main
      project_category: selectedCategory,
      description: description.trim() || null,
      crm_company_id: isInternal ? null : crmCompanyId,
      color,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: showEndDate && endDate ? format(endDate, "yyyy-MM-dd") : null,
      budget: showBudget ? finalBudget : null,
      monthly_budget: showMonthlyBudget && monthlyBudget ? parseFloat(monthlyBudget) : null,
      is_internal: isInternal,
      client_contacts: !isInternal && selectedClientContacts.length > 0 
        ? selectedClientContacts.map((c, i) => ({
            contact_id: c.id,
            role: c.role,
            is_primary: i === 0,
          }))
        : undefined,
    };
    
    createProject.mutate(input);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setSelectedCategory("standard");
    setSelectedTypes([]);
    setStatus("active");
    setDescription("");
    setStartDate(null);
    setEndDate(null);
    setSelectedReferents([]);
    setCrmCompanyId(null);
    setBudget("");
    setMonthlyBudget("");
    setBudgetMode('later');
    setSelectedQuoteId(null);
    setSelectedClientContacts([]);
    setConfigOpen(true);
    setPlanningOpen(true);
    setTeamOpen(false);
    setClientOpen(false);
  };

  // Reset selected contacts when company changes
  const handleCompanyChange = (value: string) => {
    const newCompanyId = value === "none" ? null : value;
    setCrmCompanyId(newCompanyId);
    setSelectedClientContacts([]);
  };

  const toggleClientContact = (contactId: string) => {
    setSelectedClientContacts(prev => {
      const existing = prev.find(c => c.id === contactId);
      if (existing) {
        return prev.filter(c => c.id !== contactId);
      }
      return [...prev, { id: contactId, role: "operational" }];
    });
  };

  const updateContactRole = (contactId: string, role: string) => {
    setSelectedClientContacts(prev => 
      prev.map(c => c.id === contactId ? { ...c, role } : c)
    );
  };

  const toggleReferent = (userId: string) => {
    setSelectedReferents(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const canCreate = !!name.trim() && selectedTypes.length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-xl">Nouveau projet</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            
            {/* Section: Configuration projet */}
            <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 font-medium">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  Configuration projet
                </div>
                {configOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {/* Titre */}
                <div className="space-y-2">
                  <Label htmlFor="name">Titre du projet *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom du projet"
                    autoFocus
                  />
                </div>

                {/* Catégorie du projet */}
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {PROJECT_CATEGORIES.map((cat) => {
                      const CategoryIcon = CATEGORY_ICONS[cat.icon] || Briefcase;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.key);
                            // Reset fields that don't apply to the new category
                            if (!categoryHasFeature(cat.key, 'isBillable')) {
                              setClientOpen(false);
                            }
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                            selectedCategory === cat.key
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              selectedCategory === cat.key ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                            style={selectedCategory === cat.key ? {} : { backgroundColor: `${cat.color}15` }}
                          >
                            <CategoryIcon 
                              className="h-4 w-4" 
                              style={{ color: selectedCategory === cat.key ? undefined : cat.color }} 
                            />
                          </div>
                          <span className="text-xs font-medium text-center leading-tight">{cat.labelShort}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">{categoryConfig.description}</p>
                </div>

                {/* Type de projet (multi-select) */}
                <div className="space-y-2">
                  <Label>Type de projet *</Label>
                  {typesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : projectTypes.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                      <FolderKanban className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <p className="text-sm">Aucun type configuré</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {projectTypes.map((type) => {
                        const Icon = getIconComponent(type.icon || "FolderKanban");
                        const isSelected = selectedTypes.includes(type.key);
                        return (
                          <button
                            key={type.key}
                            type="button"
                            onClick={() => {
                              setSelectedTypes(prev => 
                                isSelected 
                                  ? prev.filter(t => t !== type.key)
                                  : [...prev, type.key]
                              );
                            }}
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
                              style={isSelected ? {} : { backgroundColor: `${type.color}15` }}
                            >
                              <Icon 
                                className="h-4 w-4" 
                                style={{ color: isSelected ? undefined : type.color }} 
                              />
                            </div>
                            <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                            {isSelected && (
                              <Check className="h-3 w-3 text-primary absolute top-1 right-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {selectedTypes.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedTypes.length} types sélectionnés
                    </p>
                  )}
                </div>

                {/* Catégorie du projet */}
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {PROJECT_CATEGORIES.map((cat) => {
                      const CategoryIcon = CATEGORY_ICONS[cat.icon] || Briefcase;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.key);
                            // Reset fields that don't apply to the new category
                            if (!categoryHasFeature(cat.key, 'isBillable')) {
                              setClientOpen(false);
                            }
                          }}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                            selectedCategory === cat.key
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              selectedCategory === cat.key ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                            style={selectedCategory === cat.key ? {} : { backgroundColor: `${cat.color}15` }}
                          >
                            <CategoryIcon 
                              className="h-4 w-4" 
                              style={{ color: selectedCategory === cat.key ? undefined : cat.color }} 
                            />
                          </div>
                          <span className="text-xs font-medium text-center leading-tight">{cat.labelShort}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">{categoryConfig.description}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Section: Planification */}
            <Collapsible open={planningOpen} onOpenChange={setPlanningOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Planification
                </div>
                {planningOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {/* Dates */}
                <div className={cn("grid gap-4", showEndDate ? "grid-cols-2" : "grid-cols-1")}>
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <InlineDatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Date de début"
                      className="w-full"
                    />
                  </div>
                  {showEndDate && (
                    <div className="space-y-2">
                      <Label>Date de fin</Label>
                      <InlineDatePicker
                        value={endDate}
                        onChange={setEndDate}
                        placeholder="Date de fin"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description / Notes</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes sur le projet..."
                    rows={3}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Section: Équipe projet */}
            <Collapsible open={teamOpen} onOpenChange={setTeamOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Équipe projet
                  {selectedReferents.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{selectedReferents.length}</Badge>
                  )}
                </div>
                {teamOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-3">
                <Label className="text-sm text-muted-foreground">Référent(s) projet</Label>
                
                {teamLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p className="text-sm">Aucun membre dans le workspace</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {teamMembers.map((member) => (
                      <button
                        key={member.user_id}
                        type="button"
                        onClick={() => toggleReferent(member.user_id)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border transition-all text-left",
                          selectedReferents.includes(member.user_id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.profile?.full_name || "Utilisateur"}
                          </p>
                          {member.profile?.job_title && (
                            <p className="text-xs text-muted-foreground truncate">
                              {member.profile.job_title}
                            </p>
                          )}
                        </div>
                        {selectedReferents.includes(member.user_id) && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Section: Client & Localisation (masqué si non facturable) */}
            {showClientSection && (
              <Collapsible open={clientOpen} onOpenChange={setClientOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Client & Localisation
                    {selectedCompany && (
                      <Badge variant="outline" className="ml-1">{selectedCompany.name}</Badge>
                    )}
                  </div>
                  {clientOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  {/* Client Selection with Search */}
                  <ClientSelector
                    value={selectedClient}
                    onChange={(client) => {
                      setSelectedClient(client);
                      // Also update crmCompanyId for backwards compatibility
                      if (client?.type === "company") {
                        setCrmCompanyId(client.id);
                      } else {
                        setCrmCompanyId(null);
                      }
                      // Clear client contacts when client changes
                      setSelectedClientContacts([]);
                    }}
                    companyId={crmCompanyId}
                    onCompanyIdChange={setCrmCompanyId}
                  />

                  {/* Équipe client */}
                  {crmCompanyId && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Équipe client
                        {selectedClientContacts.length > 0 && (
                          <Badge variant="secondary">{selectedClientContacts.length}</Badge>
                        )}
                      </Label>
                      
                      {contactsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Chargement des contacts...
                        </div>
                      ) : companyContacts.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-3 px-3 border border-dashed rounded-lg text-center">
                          <Users className="h-5 w-5 mx-auto mb-1 opacity-50" />
                          Aucun contact pour cette société
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {companyContacts.map((contact) => {
                            const isSelected = selectedClientContacts.some(c => c.id === contact.id);
                            const selectedContact = selectedClientContacts.find(c => c.id === contact.id);
                            return (
                              <div 
                                key={contact.id}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-lg border transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleClientContact(contact.id)}
                                  className="flex items-center gap-3 flex-1 text-left"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={contact.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(contact.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{contact.name}</p>
                                    {contact.role && (
                                      <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                                    )}
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                                </button>
                                
                                {isSelected && (
                                  <Select 
                                    value={selectedContact?.role || "operational"}
                                    onValueChange={(v) => updateContactRole(contact.id, v)}
                                  >
                                    <SelectTrigger className="h-7 w-[130px] text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CLIENT_TEAM_ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                          {role.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Budget */}
                  {showBudget && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        Budget du projet
                      </Label>
                      
                      <RadioGroup 
                        value={budgetMode} 
                        onValueChange={(v) => setBudgetMode(v as BudgetMode)}
                        className="space-y-2"
                      >
                        {/* Option: Depuis un devis */}
                        <div className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all",
                          budgetMode === 'quote' ? "border-primary bg-primary/5" : "border-border"
                        )}>
                          <RadioGroupItem value="quote" id="budget-quote" className="mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="budget-quote" className="cursor-pointer flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Charger depuis un devis signé
                            </Label>
                            {budgetMode === 'quote' && (
                              <>
                                {docsLoading ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Chargement...
                                  </div>
                                ) : availableQuotes.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    Aucun devis signé disponible
                                  </p>
                                ) : (
                                  <Select 
                                    value={selectedQuoteId || ""} 
                                    onValueChange={setSelectedQuoteId}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Sélectionner un devis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableQuotes.map((quote) => (
                                        <SelectItem key={quote.id} value={quote.id}>
                                          <div className="flex items-center justify-between gap-4">
                                            <span>{quote.title || quote.document_number}</span>
                                            {quote.total_amount && (
                                              <span className="text-muted-foreground">
                                                {quote.total_amount.toLocaleString('fr-FR')} €
                                              </span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                {selectedQuote && (
                                  <p className="text-sm font-medium text-primary">
                                    Budget: {selectedQuote.total_amount?.toLocaleString('fr-FR')} €
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Option: Saisie manuelle */}
                        <div className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all",
                          budgetMode === 'manual' ? "border-primary bg-primary/5" : "border-border"
                        )}>
                          <RadioGroupItem value="manual" id="budget-manual" className="mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="budget-manual" className="cursor-pointer flex items-center gap-2">
                              <Euro className="h-4 w-4" />
                              Saisir manuellement
                            </Label>
                            {budgetMode === 'manual' && (
                              <Input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="50000"
                                className="h-8"
                              />
                            )}
                          </div>
                        </div>

                        {/* Option: Configurer plus tard */}
                        <div className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          budgetMode === 'later' ? "border-primary bg-primary/5" : "border-border"
                        )}>
                          <RadioGroupItem value="later" id="budget-later" />
                          <Label htmlFor="budget-later" className="cursor-pointer flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Configurer plus tard
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {showMonthlyBudget && (
                    <div className="space-y-2">
                      <Label>Budget mensuel (€)</Label>
                      <Input
                        type="number"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(e.target.value)}
                        placeholder="2500"
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!canCreate || createProject.isPending}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
