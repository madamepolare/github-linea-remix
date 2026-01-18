import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";
import {
  Building2,
  User,
  Search,
  X,
  Check,
  Loader2,
} from "lucide-react";

export type ClientType = "company" | "contact";

export interface SelectedClient {
  type: ClientType;
  id: string;
  name: string;
}

interface ClientSelectorProps {
  value: SelectedClient | null;
  onChange: (client: SelectedClient | null) => void;
  companyId?: string | null; // For backwards compatibility
  onCompanyIdChange?: (id: string | null) => void;
  contactId?: string | null;
  onContactIdChange?: (id: string | null) => void;
  className?: string;
}

export function ClientSelector({
  value,
  onChange,
  companyId,
  onCompanyIdChange,
  contactId,
  onContactIdChange,
  className,
}: ClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ClientType>(value?.type || "company");
  
  const { companies, isLoading: companiesLoading } = useCRMCompanies();
  // Use a large pageSize to get all contacts for the selector
  const { contacts, isLoading: contactsLoading } = useContacts({ 
    contactType: undefined, // Get all contacts
    status: 'all',
    pageSize: 1000 // Get up to 1000 contacts to avoid pagination limit
  });

  // Show all companies (no filtering by industry)
  const clientCompanies = useMemo(() => {
    return companies;
  }, [companies]);

  // Show all contacts (no filtering)
  const privateContacts = useMemo(() => {
    return contacts;
  }, [contacts]);

  // Search filtering
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return clientCompanies;
    const query = searchQuery.toLowerCase();
    return clientCompanies.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.industry?.toLowerCase().includes(query)
    );
  }, [clientCompanies, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return privateContacts;
    const query = searchQuery.toLowerCase();
    return privateContacts.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  }, [privateContacts, searchQuery]);

  const handleSelectCompany = (company: typeof companies[0]) => {
    const selected: SelectedClient = {
      type: "company",
      id: company.id,
      name: company.name,
    };
    onChange(selected);
    onCompanyIdChange?.(company.id);
    onContactIdChange?.(null);
    setSearchQuery("");
  };

  const handleSelectContact = (contact: typeof contacts[0]) => {
    const selected: SelectedClient = {
      type: "contact",
      id: contact.id,
      name: contact.name,
    };
    onChange(selected);
    onCompanyIdChange?.(null);
    onContactIdChange?.(contact.id);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange(null);
    onCompanyIdChange?.(null);
    onContactIdChange?.(null);
  };

  // If a value is selected, show the selected state
  if (value) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>Client</Label>
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            value.type === "company" ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"
          )}>
            {value.type === "company" ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {value.type === "company" ? "Entreprise" : "Contact privé"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label>Client</Label>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une entreprise ou un contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs for Company/Contact */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ClientType)}>
        <TabsList className="w-full">
          <TabsTrigger value="company" className="flex-1 gap-2">
            <Building2 className="h-4 w-4" />
            Entreprises
            <Badge variant="secondary" className="ml-1">{filteredCompanies.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 gap-2">
            <User className="h-4 w-4" />
            Particuliers
            <Badge variant="secondary" className="ml-1">{filteredContacts.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-2">
          {companiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "Aucune entreprise trouvée" : "Aucune entreprise client"}
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{company.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[company.city, company.industry].filter(Boolean).join(" • ") || "Entreprise"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-2">
          {contactsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "Aucun contact trouvé" : "Aucun contact particulier"}
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.email || contact.phone || "Contact privé"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
