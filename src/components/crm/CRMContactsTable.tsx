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
} from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useContactPipelineEntries } from "@/hooks/useContactPipelineEntries";
import { useTableSelection } from "@/hooks/useTableSelection";
import { useTableSort } from "@/hooks/useTableSort";
import { ContactDetailSheet } from "./ContactDetailSheet";
import { ContactFormDialog } from "./ContactFormDialog";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { AutoCategorizeHelper } from "./AutoCategorizeHelper";
import { CRMQuickFilters, FilterOption } from "./CRMQuickFilters";
import { CRMBulkEmailDialog } from "./CRMBulkEmailDialog";
import { PipelineBadges } from "./PipelineBadges";
import { ContactMobileCard } from "./shared/CRMMobileCards";
import { ContentFiltersBar } from "@/components/shared/ContentFiltersBar";
import { ViewModeToggle, AlphabetFilter, StatusTabs } from "@/components/shared/filters";
import { BulkActionsBar, type BulkAction } from "@/components/shared/BulkActionsBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Mail, Trash2 as TrashIcon, Download, Tag } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [pageSize, setPageSize] = useState<number>(50);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  const effectiveSearch = externalSearch || searchQuery;

  // Sorting hook
  const { sortColumn, sortDirection, handleSort, sortData, getSortIcon } = useTableSort<Contact>({
    defaultColumn: "name",
    defaultDirection: "asc",
  });

  // Use hook with server-side filtering
  const { 
    contacts, 
    allContactsCount, 
    isLoading, 
    deleteContact, 
    confirmContact, 
    statsByType, 
    statsByStatus,
    availableLetters,
    pagination 
  } = useContacts({
    search: effectiveSearch,
    status: selectedStatus as 'lead' | 'confirmed' | 'all',
    selectedTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    pageSize,
    letterFilter: letterFilter || undefined,
  });

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
    items: contacts,
    getItemId: (c) => c.id,
  });

  // Auto-switch to cards on mobile
  const effectiveViewMode = isMobile ? "cards" : viewMode;

  // Local sorting (filtering is done server-side)
  const sortedContacts = useMemo(() => {
    return sortData(contacts, (contact, column) => {
      if (column === "company") {
        return contact.company?.name || "";
      }
      return (contact as any)[column];
    });
  }, [contacts, sortData]);

  // Status filter options for tabs
  const statusTabs = useMemo(() => [
    { id: "all", label: "Tous", count: statsByStatus?.all || 0 },
    { id: "lead", label: "Leads", count: statsByStatus?.lead || 0, icon: Target },
    { id: "confirmed", label: "Confirmés", count: statsByStatus?.confirmed || 0, icon: CheckCircle2 },
  ], [statsByStatus]);

  // Type filter options
  const typeFilterOptions: FilterOption[] = useMemo(() => {
    return contactTypes.map((type) => ({
      id: type.key,
      label: type.label,
      color: type.color,
      count: (statsByType as Record<string, number>)[type.key] || 0,
    }));
  }, [contactTypes, statsByType]);

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      deleteContact.mutate(id);
    });
    clearSelection();
  };

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
      icon: TrashIcon,
      onClick: handleBulkDelete,
      variant: "destructive",
      showInBar: false,
    },
  ], [handleBulkDelete]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedStatus("all");
    setLetterFilter(null);
  }, []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length > 0) count++;
    if (selectedStatus !== "all") count++;
    if (letterFilter) count++;
    return count;
  }, [selectedTypes, selectedStatus, letterFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <TableSkeleton rows={8} columns={6} showCheckbox showAvatar />
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
        {/* Status tabs as secondary bar */}
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
            placeholder: "Rechercher un contact...",
          }}
          filters={
            <CRMQuickFilters
              types={typeFilterOptions}
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
              totalCount={pagination.totalCount}
              filteredCount={sortedContacts.length}
              compactMode
            />
          }
          actions={
            <div className="flex items-center gap-2">
              <AutoCategorizeHelper />
              <CRMDataQualityManager />
              {onImportContacts && (
                <Button variant="outline" size="sm" className="h-8 hidden sm:inline-flex" onClick={onImportContacts}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Importer
                </Button>
              )}
            </div>
          }
          onClearAll={handleClearAllFilters}
          activeFiltersCount={activeFiltersCount}
          secondaryBar={
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Status tabs */}
              <StatusTabs
                options={statusTabs}
                value={selectedStatus}
                onChange={setSelectedStatus}
              />
              {/* Alphabet filter - hide on mobile */}
              <div className="hidden sm:block ml-auto">
                <AlphabetFilter
                  value={letterFilter}
                  onChange={setLetterFilter}
                  availableLetters={availableLetters}
                />
              </div>
            </div>
          }
        />

        {/* Content - Table or Cards */}
        {sortedContacts.length === 0 ? (
          <Card className="overflow-hidden">
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground">
                Aucun contact trouvé{effectiveSearch ? ` pour "${effectiveSearch}"` : ""}
              </p>
              <Button variant="link" size="sm" onClick={handleClearAllFilters}>
                Effacer les filtres
              </Button>
            </div>
          </Card>
        ) : effectiveViewMode === "cards" ? (
          /* Mobile/Card View */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedContacts.map((contact) => {
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
                  isSelected={isSelected(contact.id)}
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
                        ref={(el) => {
                          if (el) (el as any).indeterminate = isPartiallySelected;
                        }}
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
                          getSortIcon("name") ? "text-foreground" : "text-muted-foreground/50"
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
                          getSortIcon("company") ? "text-foreground" : "text-muted-foreground/50"
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
                    const contactSelected = isSelected(contact.id);
                    
                    return (
                      <motion.tr
                        key={contact.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          contactSelected ? "bg-muted/30" : "hover:bg-muted/20"
                        )}
                        onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      >
                        <TableCell className="py-2 pr-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={contactSelected}
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

        {/* Pagination - using shared component */}
        {pagination.totalPages > 1 && (
          <TablePagination
            page={pagination.page}
            pageSize={pageSize}
            totalCount={pagination.totalCount}
            totalPages={pagination.totalPages}
            onPageChange={pagination.goToPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
          />
        )}
      </div>

      {/* Bulk actions - using shared component */}
      <BulkActionsBar
        selectedCount={selectedCount}
        entityLabel={{ singular: "contact", plural: "contacts" }}
        onClearSelection={clearSelection}
        actions={bulkActions}
      />

      {/* Bulk email dialog */}
      <CRMBulkEmailDialog
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
        contacts={contacts.filter(c => selectedIds.has(c.id))}
        entityType="contacts"
        onComplete={clearSelection}
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
