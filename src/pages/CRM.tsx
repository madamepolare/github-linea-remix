import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Loader2, Search, Plus, ChevronRight, ChevronDown,
  Layers, Building2, Users, Ruler, HardHat, Package, Lightbulb, Landmark, MoreHorizontal, Target, BarChart3,
} from "lucide-react";
import { CRMContactsTable } from "@/components/crm/CRMContactsTable";
import { CRMCompanyTable } from "@/components/crm/CRMCompanyTable";
import { LeadPipeline } from "@/components/crm/LeadPipeline";
import { CreateContactDialog } from "@/components/crm/CreateContactDialog";
import { CreateCompanyDialog } from "@/components/crm/CreateCompanyDialog";
import { CreateLeadDialog } from "@/components/crm/CreateLeadDialog";
import { CRMOverview } from "@/components/crm/CRMOverview";
import { usePipelines, useLeads } from "@/hooks/useLeads";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { COMPANY_CATEGORIES, CompanyCategory, getCompanyTypeConfig } from "@/lib/crmTypes";
import { cn } from "@/lib/utils";

type CRMView = "overview" | "companies" | "contacts" | "leads";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  client: Building2,
  bet: Ruler,
  partenaire: Users,
  entreprise: HardHat,
  fournisseur: Package,
  conseil: Lightbulb,
  admin: Landmark,
  autre: MoreHorizontal,
};

export default function CRM() {
  const [view, setView] = useState<CRMView>("overview");
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["client"]));
  const [searchQuery, setSearchQuery] = useState("");

  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);

  const { pipelines, isLoading: pipelinesLoading, createDefaultPipeline } = usePipelines();
  const { stats: leadStats } = useLeads();
  const { statsByCategory, allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  useEffect(() => {
    if (!pipelinesLoading && pipelines.length === 0) {
      createDefaultPipeline.mutate();
    }
  }, [pipelinesLoading, pipelines.length]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleCategoryClick = (categoryId: CompanyCategory) => {
    setSelectedCategory(categoryId);
    setView("companies");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getViewTitle = () => {
    switch (view) {
      case "overview":
        return "Vue d'ensemble";
      case "leads":
        return "Opportunités";
      case "contacts":
        return "Contacts";
      case "companies":
        const cat = COMPANY_CATEGORIES.find((c) => c.id === selectedCategory);
        return selectedCategory === "all" ? "Toutes les entreprises" : cat?.label || "Entreprises";
      default:
        return "CRM";
    }
  };

  const getViewSubtitle = () => {
    switch (view) {
      case "overview":
        return `${allCompanies.length} entreprises · ${allContacts.length} contacts · ${leadStats.total} opportunités`;
      case "leads":
        return `${leadStats.total} opportunités · ${formatCurrency(leadStats.weightedValue)} pondéré`;
      case "contacts":
        return `${allContacts.length} contacts`;
      case "companies":
        const count = statsByCategory[selectedCategory] || 0;
        return `${count} entreprise${count > 1 ? "s" : ""}`;
      default:
        return "";
    }
  };

  return (
    <>
      <MainLayout>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-56 border-r border-border bg-muted/20 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {/* Overview */}
                <button
                  onClick={() => setView("overview")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    view === "overview"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Vue d'ensemble</span>
                </button>

                {/* Leads */}
                <button
                  onClick={() => setView("leads")}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    view === "leads"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Opportunités</span>
                  </div>
                  <Badge variant="secondary" className="text-2xs h-5 px-1.5">
                    {leadStats.total}
                  </Badge>
                </button>

                {/* Contacts */}
                <button
                  onClick={() => setView("contacts")}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    view === "contacts"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Contacts</span>
                  </div>
                  <Badge variant="secondary" className="text-2xs h-5 px-1.5">
                    {allContacts.length}
                  </Badge>
                </button>

                {/* Separator */}
                <div className="my-3 border-t border-border" />

                {/* Companies section header */}
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Entreprises
                </div>

                {/* All companies */}
                <button
                  onClick={() => handleCategoryClick("all")}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    view === "companies" && selectedCategory === "all"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>Toutes</span>
                  </div>
                  <Badge variant="secondary" className="text-2xs h-5 px-1.5">
                    {statsByCategory.all || 0}
                  </Badge>
                </button>

                {/* Categories with collapsible sub-types */}
                {COMPANY_CATEGORIES.filter((cat) => cat.id !== "all").map((category) => {
                  const Icon = CATEGORY_ICONS[category.id] || Building2;
                  const count = statsByCategory[category.id] || 0;
                  const isExpanded = expandedCategories.has(category.id);
                  const isSelected = view === "companies" && selectedCategory === category.id;
                  const hasSubTypes = category.types && category.types.length > 1;

                  return (
                    <div key={category.id}>
                      <Collapsible open={isExpanded} onOpenChange={() => hasSubTypes && toggleCategory(category.id)}>
                        <div className="flex items-center">
                          <button
                            onClick={() => handleCategoryClick(category.id)}
                            className={cn(
                              "flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{category.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-2xs h-5 px-1.5">
                                {count}
                              </Badge>
                            </div>
                          </button>
                          {hasSubTypes && (
                            <CollapsibleTrigger asChild>
                              <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground">
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                        {hasSubTypes && (
                          <CollapsibleContent>
                            <div className="ml-6 mt-1 space-y-0.5">
                              {category.types?.map((type) => {
                                const config = getCompanyTypeConfig(type);
                                const typeCount = allCompanies.filter((c) => c.industry === type).length;
                                if (typeCount === 0) return null;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      // Could filter by specific type
                                    }}
                                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", config.color)} />
                                      <span>{config.shortLabel}</span>
                                    </div>
                                    <span className="text-2xs">{typeCount}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Bottom add button */}
            <div className="p-3 border-t border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setCreateCompanyOpen(true)}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Entreprise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreateContactOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreateLeadOpen(true)}>
                    <Target className="h-4 w-4 mr-2" />
                    Opportunité
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold">{getViewTitle()}</h1>
                <p className="text-sm text-muted-foreground">{getViewSubtitle()}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-9 h-9"
                  />
                </div>

                {/* Action button */}
                {view === "companies" && (
                  <Button size="sm" onClick={() => setCreateCompanyOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Entreprise
                  </Button>
                )}
                {view === "contacts" && (
                  <Button size="sm" onClick={() => setCreateContactOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                )}
                {view === "leads" && (
                  <Button size="sm" onClick={() => setCreateLeadOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Opportunité
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {view === "overview" && (
                <CRMOverview
                  onNavigate={(v) => setView(v as CRMView)}
                  companiesCount={allCompanies.length}
                  contactsCount={allContacts.length}
                  leadStats={leadStats}
                />
              )}

              {view === "companies" && (
                <CRMCompanyTable
                  category={selectedCategory}
                  search={searchQuery}
                  onCreateCompany={() => setCreateCompanyOpen(true)}
                />
              )}

              {view === "contacts" && (
                <CRMContactsTable
                  search={searchQuery}
                  onCreateContact={() => setCreateContactOpen(true)}
                />
              )}

              {view === "leads" && (
                pipelinesLoading || createDefaultPipeline.isPending ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pipelines.length > 0 ? (
                  <LeadPipeline pipeline={pipelines[0]} onCreateLead={() => setCreateLeadOpen(true)} />
                ) : null
              )}
            </div>
          </div>
        </div>
      </MainLayout>

      <CreateContactDialog open={createContactOpen} onOpenChange={setCreateContactOpen} />
      <CreateCompanyDialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen} />
      <CreateLeadDialog
        open={createLeadOpen}
        onOpenChange={setCreateLeadOpen}
        pipeline={pipelines[0]}
      />
    </>
  );
}
