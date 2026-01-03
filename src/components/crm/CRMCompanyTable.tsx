import { useState, useMemo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  ExternalLink,
  List,
  LayoutGrid,
  Globe,
} from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { COMPANY_CATEGORIES, getCompanyTypeConfig, CompanyCategory } from "@/lib/crmTypes";
import { EditCompanyDialog } from "./EditCompanyDialog";
import { cn } from "@/lib/utils";

export interface CRMCompanyTableProps {
  category?: CompanyCategory;
  search?: string;
  onCreateCompany: () => void;
}

export function CRMCompanyTable({ category = "all", search = "", onCreateCompany }: CRMCompanyTableProps) {
  const navigate = useNavigate();
  const { companies, allCompanies, isLoading, deleteCompany, statsByCategory } = useCRMCompanies({ category, search });
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory>("all");
  const [editingCompany, setEditingCompany] = useState<CRMCompanyEnriched | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Filter companies by selected category and letter
  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    // Filter by category
    if (selectedCategory !== "all") {
      const categoryConfig = COMPANY_CATEGORIES.find((c) => c.id === selectedCategory);
      if (categoryConfig?.types) {
        result = result.filter((c) => categoryConfig.types!.includes(c.industry as any));
      }
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.city?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by letter
    if (letterFilter) {
      result = result.filter((c) => c.name.toUpperCase().startsWith(letterFilter));
    }

    return result;
  }, [allCompanies, selectedCategory, search, letterFilter]);

  // Category filter chips with counts
  const categoryChips = useMemo(() => {
    return [
      { id: "all" as CompanyCategory, label: "Tous", count: allCompanies.length },
      ...COMPANY_CATEGORIES.filter((c) => c.id !== "all").map((cat) => ({
        id: cat.id,
        label: cat.label,
        count: (statsByCategory as Record<string, number>)[cat.id] || 0,
      })),
    ].filter((c) => c.count > 0 || c.id === "all");
  }, [statsByCategory, allCompanies.length]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
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
      <div className="p-6">
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
      </div>
    );
  }

  return (
    <>
      <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        {/* Category filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {categoryChips.map((chip) => (
            <Button
              key={chip.id}
              variant={selectedCategory === chip.id ? "default" : "outline"}
              size="sm"
              className="h-7 sm:h-8 text-xs sm:text-sm"
              onClick={() => setSelectedCategory(chip.id)}
            >
              {chip.label}
              <Badge
                variant={selectedCategory === chip.id ? "secondary" : "outline"}
                className="ml-1.5 sm:ml-2 text-2xs sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5"
              >
                {chip.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Alphabet filter + view toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap overflow-x-auto scrollbar-none">
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
                    "h-6 w-6 sm:h-7 sm:w-7 p-0 text-2xs sm:text-xs font-medium",
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

          <div className="flex items-center gap-1 border rounded-md p-0.5 shrink-0">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted-foreground text-sm sm:text-base">Aucune entreprise trouvée</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] sm:w-[100px]">Type</TableHead>
                      <TableHead>Société</TableHead>
                      <TableHead className="hidden md:table-cell">Interlocuteur</TableHead>
                      <TableHead className="hidden sm:table-cell">Ville</TableHead>
                      <TableHead className="w-[50px] sm:w-[60px] text-center hidden lg:table-cell">
                        <Globe className="h-4 w-4 mx-auto" />
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">Facturé</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company, index) => {
                      const typeConfig = getCompanyTypeConfig(company.industry);
                      return (
                        <motion.tr
                          key={company.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="group cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/crm/companies/${company.id}`)}
                        >
                          <TableCell className="py-2 sm:py-4">
                            <Badge
                              variant="secondary"
                              className={cn("text-white text-2xs sm:text-xs", typeConfig.color)}
                            >
                              {typeConfig.shortLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded bg-muted text-2xs sm:text-xs font-medium shrink-0">
                                {company.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{company.name}</p>
                                {company.email && (
                                  <p className="text-2xs sm:text-xs text-muted-foreground truncate">{company.email}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground italic text-sm hidden md:table-cell">
                            {company.primary_contact?.name || "Aucun contact"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                            {company.city || "—"}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground hidden lg:table-cell">
                            {company.website ? "✓" : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">—</TableCell>
                          <TableCell className="py-2 sm:py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/crm/companies/${company.id}`);
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCompany(company);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCompany.mutate(company.id);
                                  }}
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
            )}
          </CardContent>
        </Card>

        <EditCompanyDialog
          company={editingCompany}
          open={!!editingCompany}
          onOpenChange={(open) => !open && setEditingCompany(null)}
        />
      </div>
    </>
  );
}
