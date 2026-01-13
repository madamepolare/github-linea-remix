import { useState, useEffect, useMemo } from "react";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Target, 
  Mail, 
  Phone, 
  ExternalLink,
  Plus,
  Search,
  ArrowRight
} from "lucide-react";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useLeads } from "@/hooks/useLeads";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { cn } from "@/lib/utils";

interface CRMCommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CRMCommandBar({ open, onOpenChange }: CRMCommandBarProps) {
  const { navigate } = useWorkspaceNavigation();
  const [search, setSearch] = useState("");
  
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();
  const { leads } = useLeads();
  const { getCompanyTypeShortLabel, getCompanyTypeColor, getContactTypeLabel, getContactTypeColor } = useCRMSettings();

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Filter results based on search
  const filteredCompanies = useMemo(() => {
    if (!search) return allCompanies.slice(0, 5);
    const searchLower = search.toLowerCase();
    return allCompanies
      .filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.city?.toLowerCase().includes(searchLower)
      )
      .slice(0, 8);
  }, [allCompanies, search]);

  const filteredContacts = useMemo(() => {
    if (!search) return allContacts.slice(0, 5);
    const searchLower = search.toLowerCase();
    return allContacts
      .filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.role?.toLowerCase().includes(searchLower) ||
        c.company?.name?.toLowerCase().includes(searchLower)
      )
      .slice(0, 8);
  }, [allContacts, search]);

  const filteredLeads = useMemo(() => {
    if (!search) return leads.slice(0, 5);
    const searchLower = search.toLowerCase();
    return leads
      .filter(l => 
        l.title.toLowerCase().includes(searchLower) ||
        l.company?.name?.toLowerCase().includes(searchLower) ||
        l.contact?.name?.toLowerCase().includes(searchLower)
      )
      .slice(0, 8);
  }, [leads, search]);

  const hasResults = filteredCompanies.length > 0 || filteredContacts.length > 0 || filteredLeads.length > 0;

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleAction = (action: string) => {
    onOpenChange(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(action));
    }, 100);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Rechercher contacts, entreprises, opportunités..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-6 text-center text-sm">
          <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">Aucun résultat pour "{search}"</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Essayez avec un autre terme de recherche
          </p>
        </CommandEmpty>

        {/* Quick actions */}
        {!search && (
          <>
            <CommandGroup heading="Actions rapides">
              <CommandItem onSelect={() => handleAction("open-create-contact")}>
                <Plus className="mr-2 h-4 w-4 text-primary" />
                <span>Nouveau contact</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  C
                </kbd>
              </CommandItem>
              <CommandItem onSelect={() => handleAction("open-create-company")}>
                <Plus className="mr-2 h-4 w-4 text-primary" />
                <span>Nouvelle entreprise</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  E
                </kbd>
              </CommandItem>
              <CommandItem onSelect={() => handleAction("open-create-lead")}>
                <Plus className="mr-2 h-4 w-4 text-primary" />
                <span>Nouvelle opportunité</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  O
                </kbd>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Contacts */}
        {filteredContacts.length > 0 && (
          <CommandGroup heading={`Contacts ${search ? `(${filteredContacts.length})` : ""}`}>
            {filteredContacts.map((contact) => (
              <CommandItem
                key={contact.id}
                value={`contact-${contact.id}`}
                onSelect={() => handleSelect(`/crm/contacts/${contact.id}`)}
                className="flex items-center gap-3 py-2"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={contact.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{contact.name}</span>
                    {contact.contact_type && (
                      <div 
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: getContactTypeColor(contact.contact_type) }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {contact.company?.name && (
                      <span className="truncate">{contact.company.name}</span>
                    )}
                    {contact.role && (
                      <>
                        <span>•</span>
                        <span className="truncate">{contact.role}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {contact.email && (
                    <a 
                      href={`mailto:${contact.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
              </CommandItem>
            ))}
            {search && filteredContacts.length >= 8 && (
              <CommandItem 
                onSelect={() => handleSelect("/crm/contacts")}
                className="text-xs text-muted-foreground justify-center"
              >
                Voir tous les résultats
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {/* Companies */}
        {filteredCompanies.length > 0 && (
          <CommandGroup heading={`Entreprises ${search ? `(${filteredCompanies.length})` : ""}`}>
            {filteredCompanies.map((company) => {
              const typeColor = getCompanyTypeColor(company.industry || "");
              const typeLabel = getCompanyTypeShortLabel(company.industry || "");
              return (
                <CommandItem
                  key={company.id}
                  value={`company-${company.id}`}
                  onSelect={() => handleSelect(`/crm/companies/${company.id}`)}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-[10px] font-medium shrink-0">
                    {company.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{company.name}</span>
                      {typeLabel && (
                        <Badge 
                          variant="secondary" 
                          className="text-[9px] h-4 px-1 text-white shrink-0"
                          style={{ backgroundColor: typeColor }}
                        >
                          {typeLabel}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {company.city && <span>{company.city}</span>}
                      {company.primary_contact && (
                        <>
                          <span>•</span>
                          <span className="truncate">{company.primary_contact.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Leads */}
        {filteredLeads.length > 0 && (
          <CommandGroup heading={`Opportunités ${search ? `(${filteredLeads.length})` : ""}`}>
            {filteredLeads.map((lead) => (
              <CommandItem
                key={lead.id}
                value={`lead-${lead.id}`}
                onSelect={() => handleSelect(`/crm/leads`)}
                className="flex items-center gap-3 py-2"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 shrink-0">
                  <Target className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{lead.title}</span>
                    {lead.stage && (
                      <Badge 
                        variant="outline" 
                        className="text-[9px] h-4 px-1 shrink-0"
                      >
                        {lead.stage.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {lead.company?.name && <span>{lead.company.name}</span>}
                    {lead.estimated_value && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-foreground">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(lead.estimated_value)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation shortcuts */}
        {!search && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => handleSelect("/crm/overview")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Vue d'ensemble
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/crm/contacts")}>
                <Users className="mr-2 h-4 w-4" />
                Tous les contacts
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/crm/companies")}>
                <Building2 className="mr-2 h-4 w-4" />
                Toutes les entreprises
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/crm/leads")}>
                <Target className="mr-2 h-4 w-4" />
                Opportunités & Pipelines
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
