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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Pencil,
  Trash2,
  Eye,
  Users,
  ExternalLink,
  Upload,
  ArrowUpDown,
  CheckCircle2,
  Target,
  User,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useContactPipelineEntries } from "@/hooks/useContactPipelineEntries";
import { ContactDetailSheet } from "./ContactDetailSheet";
import { ContactFormDialog } from "./ContactFormDialog";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { CRMQuickFilters, FilterOption } from "./CRMQuickFilters";
import { CRMBulkActionsBar } from "./CRMBulkActionsBar";
import { PipelineBadges } from "./PipelineBadges";
import { ContactMobileCard } from "./shared/CRMMobileCards";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface CRMContactsTableProps {
  search?: string;
  onCreateContact: () => void;
  onImportContacts?: () => void;
}

export function CRMContactsTable({ search: externalSearch = "", onCreateContact, onImportContacts }: CRMContactsTableProps) {
  const navigate = useNavigate();
  const { canViewSensitiveData, canEditContacts, canDeleteContacts } = useWorkspaceRole();
  const { getContactTypeLabel, getContactTypeColor, contactTypes } = useCRMSettings();
  const { entriesByContactId } = useContactPipelineEntries();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState(externalSearch);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [pageSize, setPageSize] = useState<number>(50);

  const effectiveSearch = externalSearch || searchQuery;

  // Use hook with server-side filtering
  const { 
    contacts, 
    allContactsCount, 
    isLoading, 
    deleteContact, 
    updateContact, 
    confirmContact, 
    statsByType, 
    statsByStatus,
    pagination 
  } = useContacts({
    search: effectiveSearch,
    status: selectedStatus as 'lead' | 'confirmed' | 'all',
    selectedTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    pageSize,
  });

  // Auto-switch to cards on mobile
  const effectiveViewMode = isMobile ? "cards" : viewMode;

  // Local sorting only (filtering is done server-side)
  const sortedContacts = useMemo(() => {
    let result = [...contacts];

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Contact];
      let bVal: any = b[sortBy as keyof Contact];
      if (sortBy === "company") {
        aVal = a.company?.name || "";
        bVal = b.company?.name || "";
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [contacts, sortBy, sortDir]);

  // Status filter options
  const statusFilterOptions: FilterOption[] = useMemo(() => {
    return [
      { id: "all", label: "Tous", count: statsByStatus?.all || 0 },
      { id: "lead", label: "Leads", color: "#f97316", count: statsByStatus?.lead || 0 },
      { id: "confirmed", label: "Confirmés", color: "#22c55e", count: statsByStatus?.confirmed || 0 },
    ];
  }, [statsByStatus]);

  // Type filter options
  const typeFilterOptions: FilterOption[] = useMemo(() => {
    return contactTypes.map((type) => ({
      id: type.key,
      label: type.label,
      color: type.color,
      count: (statsByType as Record<string, number>)[type.key] || 0,
    }));
  }, [contactTypes, statsByType]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedContacts.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [sortedContacts]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

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
      deleteContact.mutate(id);
    });
    setSelectedIds(new Set());
  };

  const isAllSelected = sortedContacts.length > 0 && selectedIds.size === sortedContacts.length;

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
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allContactsCount === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Users}
            title="Aucun contact"
            description="Ajoutez votre premier contact pour commencer à gérer vos relations clients."
            action={{ label: "Créer un contact", onClick: onCreateContact }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 border-b">
          {statusFilterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedStatus(option.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                selectedStatus === option.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {option.id === "lead" && <Target className="h-3.5 w-3.5" />}
              {option.id === "confirmed" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {option.label}
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {option.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Filters + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CRMQuickFilters
              search={searchQuery}
              onSearchChange={setSearchQuery}
              types={typeFilterOptions}
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
              placeholder="Rechercher un contact..."
              totalCount={pagination.totalCount}
              filteredCount={sortedContacts.length}
              onClearAllFilters={() => {
                setSearchQuery("");
                setSelectedTypes([]);
                setSelectedStatus("all");
              }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CRMDataQualityManager />
            {onImportContacts && (
              <Button variant="outline" size="sm" className="h-9 hidden sm:inline-flex" onClick={onImportContacts}>
                <Upload className="h-4 w-4 mr-1.5" />
                Importer
              </Button>
            )}
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
        </div>

        {/* Content - Table or Cards */}
        {sortedContacts.length === 0 ? (
          <Card className="overflow-hidden">
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground">
                Aucun contact trouvé{effectiveSearch ? ` pour "${effectiveSearch}"` : ""}
              </p>
              <Button variant="link" size="sm" onClick={() => {
                setSearchQuery("");
                setSelectedTypes([]);
              }}>
                Effacer les filtres
              </Button>
            </div>
          </Card>
        ) : effectiveViewMode === "cards" ? (
          /* Mobile/Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedContacts.map((contact) => {
              const isSelected = selectedIds.has(contact.id);
              const typeLabel = contact.contact_type ? getContactTypeLabel(contact.contact_type) : undefined;
              const typeColor = contact.contact_type ? getContactTypeColor(contact.contact_type) : undefined;

              return (
                <ContactMobileCard
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  role={contact.role}
                  email={canViewSensitiveData ? contact.email : null}
                  phone={canViewSensitiveData ? contact.phone : null}
                  avatarUrl={contact.avatar_url}
                  companyName={contact.company?.name}
                  status={contact.status as "lead" | "confirmed" | undefined}
                  typeBadge={typeLabel ? { label: typeLabel, color: typeColor } : undefined}
                  isSelected={isSelected}
                  onSelect={(checked) => handleSelectOne(contact.id, checked)}
                  onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                  onEdit={canEditContacts ? () => setEditingContact(contact) : undefined}
                  onDelete={canDeleteContacts ? () => deleteContact.mutate(contact.id) : undefined}
                  onView={() => navigate(`/crm/contacts/${contact.id}`)}
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
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Contact
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "name" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead 
                      className="hidden sm:table-cell cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("company")}
                    >
                      <div className="flex items-center gap-1">
                        Entreprise
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "company" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead className="hidden xl:table-cell w-16">Pays</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Pipelines</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContacts.map((contact, index) => {
                    const isSelected = selectedIds.has(contact.id);
                    
                    return (
                      <motion.tr
                        key={contact.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isSelected ? "bg-muted/30" : "hover:bg-muted/20"
                        )}
                        onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      >
                        <TableCell className="py-2 pr-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(contact.id, checked as boolean)}
                            aria-label={`Sélectionner ${contact.name}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={contact.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-[10px] font-medium">
                                {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground truncate leading-tight">{contact.name}</p>
                              {contact.role && (
                                <p className="text-[11px] text-muted-foreground truncate">{contact.role}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                          {canViewSensitiveData && contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-sm text-muted-foreground hover:text-primary transition-colors truncate block max-w-[180px]"
                              title={contact.email}
                            >
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                          {canViewSensitiveData && contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell min-w-[180px]">
                          {contact.company ? (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[200px]" title={contact.company.name}>{contact.company.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell">
                          <CountryFlag 
                            location={contact.location} 
                            country={contact.company?.country}
                            size="sm" 
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          {/* Show status badge (Lead or Contact) */}
                          {(() => {
                            const isLead = contact.status === 'lead';
                            const displayLabel = isLead ? 'Lead' : 'Contact';
                            const displayColor = isLead ? '#f97316' : '#22c55e';
                            const IconComponent = isLead ? Target : User;
                            
                            return (
                              <Badge 
                                variant="outline" 
                                className="gap-1 text-[10px] h-5 px-1.5 font-medium whitespace-nowrap"
                                style={{ 
                                  borderColor: `${displayColor}40`,
                                  backgroundColor: `${displayColor}15`,
                                  color: displayColor
                                }}
                              >
                                <IconComponent className="h-3 w-3 shrink-0" />
                                {displayLabel}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell">
                          <PipelineBadges entries={entriesByContactId[contact.id] || []} />
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
                              <DropdownMenuItem onClick={() => setSelectedContact(contact)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Aperçu
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/crm/contacts/${contact.id}`)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              {canEditContacts && (
                                <>
                                  <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  {contact.status === 'lead' && (
                                    <DropdownMenuItem onClick={() => confirmContact.mutate(contact.id)}>
                                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                      Confirmer
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {canDeleteContacts && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteContact.mutate(contact.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} sur {pagination.totalCount}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span>Page {pagination.page} / {pagination.totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Page size selector */}
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">par page</span>
              
              {/* Navigation buttons */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => pagination.goToPage(1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={pagination.prevPage}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={pagination.nextPage}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => pagination.goToPage(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      <CRMBulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        entityType="contacts"
      />

      {/* Detail sheet */}
      <ContactDetailSheet
        contact={selectedContact}
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
      />

      {/* Edit dialog */}
      <ContactFormDialog
        mode="edit"
        contact={editingContact}
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
      />
    </>
  );
}
