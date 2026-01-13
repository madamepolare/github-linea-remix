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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  Mail,
  Phone,
  Globe,
  MapPin,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { CompanyCategory } from "@/lib/crmTypes";
import { EditCompanyDialog } from "./EditCompanyDialog";
import { InlineEditCell } from "./InlineEditCell";
import { CRMQuickFilters, FilterOption } from "./CRMQuickFilters";
import { CRMBulkActionsBar } from "./CRMBulkActionsBar";
import { cn } from "@/lib/utils";

export interface CRMCompanyTableProps {
  category?: CompanyCategory;
  search?: string;
  onCreateCompany: () => void;
}

export function CRMCompanyTable({ category = "all", search = "", onCreateCompany }: CRMCompanyTableProps) {
  const navigate = useNavigate();
  const { companies, allCompanies, isLoading, deleteCompany, updateCompany, statsByCategory } = useCRMCompanies({ category, search });
  const { companyCategories, getCompanyTypeShortLabel, getCompanyTypeColor, getCategoryFromType } = useCRMSettings();
  
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingCompany, setEditingCompany] = useState<CRMCompanyEnriched | null>(null);
  const [searchQuery, setSearchQuery] = useState(search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Filter companies
  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    // Filter by category
    if (selectedCategory !== "all") {
      const categoryConfig = companyCategories.find((c) => c.key === selectedCategory);
      if (categoryConfig?.types) {
        result = result.filter((c) => categoryConfig.types.includes(c.industry as string));
      }
    }

    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.city?.toLowerCase().includes(searchLower) ||
          c.primary_contact?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by letter
    if (letterFilter) {
      result = result.filter((c) => c.name.toUpperCase().startsWith(letterFilter));
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortBy as keyof CRMCompanyEnriched];
      let bVal: any = b[sortBy as keyof CRMCompanyEnriched];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allCompanies, selectedCategory, searchQuery, letterFilter, companyCategories, sortBy, sortDir]);

  // Category filter chips
  const categoryChips: FilterOption[] = useMemo(() => {
    const chips = [
      { id: "all", label: "Tous", count: allCompanies.length },
      ...companyCategories.map((cat) => ({
        id: cat.key,
        label: cat.label,
        color: cat.color,
        count: (statsByCategory as Record<string, number>)[cat.key] || 0,
      })),
    ];
    return chips.filter((c) => c.count > 0 || c.id === "all");
  }, [statsByCategory, allCompanies.length, companyCategories]);

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
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredCompanies.length;

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

        {/* Alphabet filter */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none pb-1">
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

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {filteredCompanies.length === 0 ? (
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
            ) : (
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
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
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
                    <TableHead className="w-20 text-center hidden lg:table-cell">Actions</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company, index) => {
                    const typeColor = getCompanyTypeColor(company.industry || "");
                    const typeLabel = getCompanyTypeShortLabel(company.industry || "");
                    const isSelected = selectedIds.has(company.id);
                    
                    return (
                      <motion.tr
                        key={company.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/40"
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
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium text-white px-1.5 py-0"
                            style={{ backgroundColor: typeColor }}
                          >
                            {typeLabel}
                          </Badge>
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
                        <TableCell className="py-2 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                          <InlineEditCell
                            value={company.primary_contact?.name || ""}
                            placeholder="Ajouter contact"
                            onSave={() => {}}
                            disabled
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                          <InlineEditCell
                            value={company.city || ""}
                            placeholder="—"
                            onSave={(val) => handleInlineUpdate(company.id, "city", val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {company.email && (
                              <a
                                href={`mailto:${company.email}`}
                                className="p-1.5 rounded hover:bg-muted transition-colors"
                                title={company.email}
                              >
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              </a>
                            )}
                            {company.phone && (
                              <a
                                href={`tel:${company.phone}`}
                                className="p-1.5 rounded hover:bg-muted transition-colors"
                                title={company.phone}
                              >
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              </a>
                            )}
                            {company.website && (
                              <a
                                href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-muted transition-colors"
                                title={company.website}
                              >
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              </a>
                            )}
                          </div>
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
            )}
          </div>
        </Card>

        {/* Bulk actions */}
        <CRMBulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onDelete={handleBulkDelete}
          onExport={() => {}}
          entityType="companies"
        />
      </div>

      <EditCompanyDialog
        company={editingCompany}
        open={!!editingCompany}
        onOpenChange={(open) => !open && setEditingCompany(null)}
      />
    </>
  );
}