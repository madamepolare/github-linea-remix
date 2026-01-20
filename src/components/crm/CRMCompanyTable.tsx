import { useState, useMemo, useCallback } from "react";
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
  Mail,
  Download,
  Tag,
} from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { CompanyCategory } from "@/lib/crmTypes";
import { CompanyFormDialog } from "./CompanyFormDialog";
import { InlineEditCell } from "./InlineEditCell";
import { CRMQuickFilters, FilterOption } from "./CRMQuickFilters";
import { CRMBulkEmailDialog } from "./CRMBulkEmailDialog";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { AutoCategorizeHelper } from "./AutoCategorizeHelper";
import { useContactPipelineEntries } from "@/hooks/useContactPipelineEntries";
import { PipelineBadges } from "./PipelineBadges";
import { CompanyMobileCard } from "./shared/CRMMobileCards";
import { ContentFiltersBar } from "@/components/shared/ContentFiltersBar";
import { ViewModeToggle, AlphabetFilter } from "@/components/shared/filters";
import { BulkActionsBar, type BulkAction } from "@/components/shared/BulkActionsBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useTableSelection } from "@/hooks/useTableSelection";
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
  const [pageSize, setPageSize] = useState<number>(50);

  // Pass filters to hook for server-side filtering
  const { 
    companies, 
    allCompanies, 
    isLoading, 
    isFetching,
    deleteCompany, 
    updateCompany, 
    statsByCategory,
    availableLetters,
    pagination,
    goToPage,
  } = useCRMCompanies({ 
    category: selectedCategory !== "all" ? selectedCategory as CompanyCategory : undefined, 
    search: searchQuery,
    letterFilter: letterFilter || undefined,
    sortBy,
    sortDir,
  });
  
  const { companyCategories, companyTypes } = useCRMSettings();
  const { entriesByCompanyId } = useContactPipelineEntries();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [editingCompany, setEditingCompany] = useState<CRMCompanyEnriched | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);

  // Selection hook
  const {
    selectedIds,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
  } = useTableSelection({
    items: companies,
    getItemId: (c) => c.id,
  });

  // Auto-switch to cards on mobile
  const effectiveViewMode = isMobile ? "cards" : viewMode;

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

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach((id) => {
      deleteCompany.mutate(id);
    });
    clearSelection();
  }, [selectedIds, deleteCompany, clearSelection]);

  // Bulk actions configuration
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: "email",
      label: "Email",
      icon: Mail,
      onClick: () => setBulkEmailOpen(true),
      showInBar: true,
    },
    {
      id: "export",
      label: "Exporter",
      icon: Download,
      onClick: () => console.log("Export"),
      showInBar: true,
    },
    {
      id: "tag",
      label: "Ajouter tag",
      icon: Tag,
      onClick: () => console.log("Add tag"),
      showInBar: false,
    },
    {
      id: "delete",
      label: "Supprimer",
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: "destructive",
      showInBar: false,
    },
  ], [handleBulkDelete]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setLetterFilter(null);
  }, []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (letterFilter) count++;
    return count;
  }, [selectedCategory, letterFilter]);

  // Use companies from server (already filtered and paginated)
  const filteredCompanies = companies;

  if (isLoading && !isFetching) {
    return (
      <div className="space-y-4">
        <TableSkeleton rows={8} columns={5} showCheckbox showAvatar={false} />
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
        {/* Unified Filter Bar */}
        <ContentFiltersBar
          viewToggle={
            <div className="hidden md:block">
              <ViewModeToggle
                value={effectiveViewMode}
                onChange={(v) => setViewMode(v as "table" | "cards")}
              />
            </div>
          }
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "Rechercher une entreprise...",
          }}
          filters={
            <CRMQuickFilters
              categories={categoryChips}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              totalCount={allCompanies.length}
              filteredCount={filteredCompanies.length}
              compactMode
            />
          }
          actions={
            <div className="flex items-center gap-2">
              <AutoCategorizeHelper />
              <CRMDataQualityManager />
            </div>
          }
          onClearAll={() => {
            setSearchQuery("");
            setSelectedCategory("all");
            setLetterFilter(null);
          }}
          activeFiltersCount={
            (selectedCategory !== "all" ? 1 : 0) + 
            (letterFilter ? 1 : 0)
          }
          secondaryBar={
            <div className="hidden sm:block">
              <AlphabetFilter
                value={letterFilter}
                onChange={setLetterFilter}
                availableLetters={availableLetters}
                isLoading={isFetching}
              />
            </div>
          }
        />

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
            
            {/* Pagination Controls - using shared component */}
            {pagination.totalPages > 1 && (
              <TablePagination
                page={pagination.page}
                pageSize={pageSize}
                totalCount={pagination.totalCount}
                totalPages={pagination.totalPages}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100]}
              />
            )}
          </div>
        )}
      </div>

      {/* Bulk actions - using shared component */}
      <BulkActionsBar
        selectedCount={selectedCount}
        entityLabel={{ singular: "entreprise", plural: "entreprises" }}
        onClearSelection={clearSelection}
        actions={bulkActions}
      />

      {/* Bulk email dialog */}
      <CRMBulkEmailDialog
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
        companies={companies.filter(c => selectedIds.has(c.id))}
        entityType="companies"
        onComplete={clearSelection}
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
