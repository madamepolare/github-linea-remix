import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  ExternalLink,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { CompanyCategory } from "@/lib/crmTypes";
import { CompanyFormDialog } from "./CompanyFormDialog";
import { InlineEditCell } from "./InlineEditCell";
import { CRMQuickFilters, FilterOption } from "./CRMQuickFilters";
import { CRMBulkActionsBar } from "./CRMBulkActionsBar";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { AutoCategorizeHelper } from "./AutoCategorizeHelper";
import { useContactPipelineEntries } from "@/hooks/useContactPipelineEntries";
import { PipelineBadges } from "./PipelineBadges";
import { CompanyMobileCard } from "./shared/CRMMobileCards";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface CRMCompanyTableProps {
  category?: CompanyCategory;
  search?: string;
  onCreateCompany: () => void;
}

export function CRMCompanyTable({ category = "all", search = "", onCreateCompany }: CRMCompanyTableProps) {
  const navigate = useNavigate();
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState(search);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pass filters to hook for server-side filtering
  const { 
    companies, 
    allCompanies, 
    isLoading, 
    deleteCompany, 
    updateCompany, 
    statsByCategory,
    pagination,
    goToPage,
    nextPage,
    prevPage,
  } = useCRMCompanies({ 
    category: selectedCategory !== "all" ? selectedCategory as CompanyCategory : undefined, 
    search: searchQuery,
    letterFilter: letterFilter || undefined,
    sortBy,
    sortDir,
  });
  
  const { companyCategories, companyTypes, getCategoryFromType } = useCRMSettings();
  const { entriesByCompanyId, isLoading: isLoadingPipelines } = useContactPipelineEntries();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [editingCompany, setEditingCompany] = useState<CRMCompanyEnriched | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Auto-switch to cards on mobile
  const effectiveViewMode = isMobile ? "cards" : viewMode;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Use companies from server (already filtered and paginated)
  const filteredCompanies = companies;

  // Category filter chips - use totalCount from pagination
  const categoryChips: FilterOption[] = useMemo(() => {
    const chips = [
      { id: "all", label: "Tous", count: pagination.totalCount },
      ...companyCategories.map((cat) => ({
        id: cat.key,
        label: cat.label,
        color: cat.color,
        count: (statsByCategory as Record<string, number>)[cat.key] || 0,
      })),
    ];
    return chips.filter((c) => c.count > 0 || c.id === "all");
  }, [statsByCategory, pagination.totalCount, companyCategories]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredCompanies.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredCompanies]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleInlineUpdate = useCallback((id: string, field: string, value: string) => {
    updateCompany.mutate({ id, [field]: value });
  }, [updateCompany]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      deleteCompany.mutate(id);
    });
    setSelectedIds(new Set());
  };

  const isAllSelected = filteredCompanies.length > 0 && selectedIds.size === filteredCompanies.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-7 w-7 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allCompanies.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Building2}
            title="Aucune entreprise"
            description="Ajoutez votre première entreprise pour commencer à gérer vos relations."
            action={{ label: "Créer une entreprise", onClick: onCreateCompany }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <CRMQuickFilters
              search={searchQuery}
              onSearchChange={setSearchQuery}
              categories={categoryChips}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              placeholder="Rechercher une entreprise..."
              totalCount={allCompanies.length}
              filteredCount={filteredCompanies.length}
              onClearAllFilters={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setLetterFilter(null);
              }}
            />
          </div>
          <AutoCategorizeHelper />
          <CRMDataQualityManager />
          {/* View mode toggle - hidden on mobile */}
          <div className="hidden md:flex items-center border rounded-md">
            <Button
              variant={effectiveViewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={effectiveViewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2 rounded-l-none"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alphabet filter - hide on mobile */}
        <div className="hidden sm:flex items-center gap-0.5 overflow-x-auto scrollbar-none pb-1">
          {alphabet.map((letter) => {
            const hasCompanies = filteredCompanies.some((c) =>
              c.name.toUpperCase().startsWith(letter)
            );
            return (
              <Button
                key={letter}
                variant={letterFilter === letter ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0 text-[10px] font-medium shrink-0",
                  !hasCompanies && "text-muted-foreground/30"
                )}
                onClick={() => setLetterFilter(letterFilter === letter ? null : letter)}
                disabled={!hasCompanies}
              >
                {letter}
              </Button>
            );
          })}
        </div>

        {/* Content - Table or Cards */}
        {filteredCompanies.length === 0 ? (
          <Card className="overflow-hidden">
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground">Aucune entreprise trouvée</p>
              <Button variant="link" size="sm" onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setLetterFilter(null);
              }}>
                Effacer les filtres
              </Button>
            </div>
          </Card>
        ) : effectiveViewMode === "cards" ? (
          /* Mobile/Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCompanies.map((company) => {
              const industryKey = company.industry || "";
              const typeConfig = companyTypes.find(t => t.key === industryKey);
              const typeLabel = typeConfig?.shortLabel || typeConfig?.label || industryKey || undefined;
              const typeColor = typeConfig?.color || "#6B7280";
              const isSelected = selectedIds.has(company.id);

              return (
                <CompanyMobileCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  email={company.email}
                  city={company.city}
                  industry={company.industry}
                  industryLabel={typeLabel}
                  industryColor={typeColor}
                  primaryContactName={company.primary_contact?.name}
                  status={company.status as "lead" | "confirmed" | undefined}
                  isSelected={isSelected}
                  onSelect={(checked) => handleSelectOne(company.id, checked)}
                  onClick={() => navigate(`/crm/companies/${company.id}`)}
                  onEdit={() => setEditingCompany(company)}
                  onDelete={() => deleteCompany.mutate(company.id)}
                />
              );
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="border-t">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 pr-0">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Sélectionner tout"
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead className="w-14">Type</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Entreprise
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "name" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Contact principal</TableHead>
                    <TableHead 
                      className="hidden sm:table-cell cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("city")}
                    >
                      <div className="flex items-center gap-1">
                        Ville
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "city" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead className="hidden xl:table-cell w-16">Pays</TableHead>
                    <TableHead className="hidden lg:table-cell">Pipelines</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company, index) => {
                    // Determine the display type - use industry if it's a known type, otherwise show abbreviation
                    const industryKey = company.industry || "";
                    const typeConfig = companyTypes.find(t => t.key === industryKey);
                    const typeLabel = typeConfig?.shortLabel || (industryKey.length > 10 ? industryKey.slice(0, 8) + "…" : industryKey) || "—";
                    const typeColor = typeConfig?.color || "#6B7280";
                    const isSelected = selectedIds.has(company.id);
                    
                    return (
                      <motion.tr
                        key={company.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isSelected ? "bg-muted/30" : "hover:bg-muted/20"
                        )}
                        onClick={() => navigate(`/crm/companies/${company.id}`)}
                      >
                        <TableCell className="py-2 pr-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(company.id, checked as boolean)}
                            aria-label={`Sélectionner ${company.name}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium text-white px-1.5 py-0 max-w-[80px] truncate"
                              style={{ backgroundColor: typeColor }}
                              title={company.industry || undefined}
                            >
                              {typeLabel}
                            </Badge>
                            {company.status === 'lead' && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 border-amber-500 text-amber-600 bg-amber-50"
                              >
                                Lead
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-[10px] font-medium shrink-0">
                              {company.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate leading-tight">
                                {company.name}
                              </p>
                              {company.email && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {company.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                          {company.primary_contact ? (
                            <div className="min-w-0">
                              <p className="text-sm truncate">{company.primary_contact.name}</p>
                              {company.primary_contact.email && (
                                <a
                                  href={`mailto:${company.primary_contact.email}`}
                                  className="text-[11px] text-muted-foreground hover:text-primary truncate block"
                                >
                                  {company.primary_contact.email}
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                          <InlineEditCell
                            value={company.city || ""}
                            placeholder="—"
                            onSave={(val) => handleInlineUpdate(company.id, "city", val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell">
                          <CountryFlag country={company.country} size="sm" />
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                          <PipelineBadges entries={entriesByCompanyId[company.id] || []} />
                        </TableCell>
                        <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => navigate(`/crm/companies/${company.id}`)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingCompany(company)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteCompany.mutate(company.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-xs text-muted-foreground">
                  {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} sur {pagination.totalCount}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => goToPage(1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={prevPage}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs px-2">
                    Page {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={nextPage}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => goToPage(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk actions */}
      <CRMBulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        entityType="companies"
      />

      {/* Edit dialog */}
      <CompanyFormDialog
        mode="edit"
        company={editingCompany}
        open={!!editingCompany}
        onOpenChange={(open) => !open && setEditingCompany(null)}
      />
    </>
  );
}
