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
} from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { ContactDetailSheet } from "./ContactDetailSheet";
import { EditContactDialog } from "./EditContactDialog";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { CRMQuickFilters, FilterOption } from "./CRMQuickFilters";
import { CRMBulkActionsBar } from "./CRMBulkActionsBar";
import { cn } from "@/lib/utils";

export interface CRMContactsTableProps {
  search?: string;
  onCreateContact: () => void;
  onImportContacts?: () => void;
}

export function CRMContactsTable({ search: externalSearch = "", onCreateContact, onImportContacts }: CRMContactsTableProps) {
  const navigate = useNavigate();
  const { contacts, allContacts, isLoading, deleteContact, updateContact, statsByType } = useContacts();
  const { canViewSensitiveData, canEditContacts, canDeleteContacts } = useWorkspaceRole();
  const { getContactTypeLabel, getContactTypeColor, contactTypes } = useCRMSettings();
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState(externalSearch);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const effectiveSearch = externalSearch || searchQuery;

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Filter by search
    if (effectiveSearch) {
      const searchLower = effectiveSearch.toLowerCase();
      result = result.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.company?.name?.toLowerCase().includes(searchLower) ||
          contact.role?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by type
    if (selectedTypes.length > 0) {
      result = result.filter((c) => c.contact_type && selectedTypes.includes(c.contact_type));
    }

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
  }, [contacts, effectiveSearch, selectedTypes, sortBy, sortDir]);

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
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredContacts]);

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

  const isAllSelected = filteredContacts.length > 0 && selectedIds.size === filteredContacts.length;

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

  if (contacts.length === 0) {
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
              totalCount={contacts.length}
              filteredCount={filteredContacts.length}
              onClearAllFilters={() => {
                setSearchQuery("");
                setSelectedTypes([]);
              }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CRMDataQualityManager />
            {onImportContacts && (
              <Button variant="outline" size="sm" className="h-9" onClick={onImportContacts}>
                <Upload className="h-4 w-4 mr-1.5" />
                Importer
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {filteredContacts.length === 0 ? (
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
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact, index) => {
                    const isSelected = selectedIds.has(contact.id);
                    
                    return (
                      <motion.tr
                        key={contact.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/40"
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
                              <p className="font-medium text-sm truncate leading-tight">{contact.name}</p>
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
                        <TableCell className="py-2 hidden sm:table-cell">
                          {contact.company ? (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[120px]">{contact.company.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell">
                          <CountryFlag location={contact.location} size="sm" />
                        </TableCell>
                        <TableCell className="py-2">
                          {contact.contact_type && (
                            <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: getContactTypeColor(contact.contact_type) }}
                              />
                              {getContactTypeLabel(contact.contact_type)}
                            </Badge>
                          )}
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
                                <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
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
            )}
          </div>
        </Card>
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
      <EditContactDialog
        contact={editingContact}
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
      />
    </>
  );
}
