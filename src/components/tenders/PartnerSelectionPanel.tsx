import { useState, useMemo } from "react";
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  Filter,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { SPECIALTIES } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

interface PartnerSelectionPanelProps {
  specialty: string;
  selectedIds: string[];
  onSelect: (companyId: string, contactId?: string) => void;
  onDeselect: (companyId: string) => void;
}

export function PartnerSelectionPanel({
  specialty,
  selectedIds,
  onSelect,
  onDeselect,
}: PartnerSelectionPanelProps) {
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState<string>(specialty);

  // Mapping between SPECIALTIES values and possible industry values
  const specialtyToIndustryMap: Record<string, string[]> = {
    'architecte': ['architecte', 'architect'],
    'bet_structure': ['bet_structure', 'structure', 'bet structure'],
    'bet_fluides': ['bet_fluides', 'fluides', 'bet fluides', 'cvc', 'plomberie'],
    'bet_electricite': ['bet_electricite', 'electricite', 'bet électricité', 'électricité'],
    'thermicien': ['thermicien', 'bet_thermique', 'thermique', 're2020', 'bet thermique'],
    'economiste': ['economiste', 'économiste', 'bet_economie'],
    'acousticien': ['acousticien', 'bet_acoustique', 'acoustique'],
    'paysagiste': ['paysagiste', 'paysage'],
    'vrd': ['vrd', 'bet_vrd', 'voirie'],
    'opc': ['opc', 'ordonnancement'],
    'ssi': ['ssi', 'sécurité incendie'],
    'cuisiniste': ['cuisiniste', 'cuisine'],
    'bet_facade': ['bet_facade', 'facade', 'façade'],
    'geometre': ['geometre', 'géomètre', 'topographe'],
    'geotechnicien': ['geotechnicien', 'géotechnicien', 'geotechnique', 'géotechnique'],
  };

  // Filter companies by specialty (BET companies)
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // If no filter, show all companies with any specialty-related industry or bet_specialties
      const filterLower = filterSpecialty.toLowerCase();
      const possibleMatches = specialtyToIndustryMap[filterSpecialty] || [filterSpecialty];
      
      // Check if company has the required specialty in bet_specialties array
      const hasBetSpecialty = company.bet_specialties?.some(s => 
        s.toLowerCase() === filterLower || possibleMatches.includes(s.toLowerCase())
      );
      
      // Check if company industry matches (case-insensitive, flexible matching)
      const industryLower = company.industry?.toLowerCase() || '';
      const hasIndustryMatch = possibleMatches.some(match => 
        industryLower.includes(match.toLowerCase()) || 
        industryLower === match.toLowerCase()
      );

      const hasSpecialty = hasBetSpecialty || hasIndustryMatch;

      // Check search
      const matchesSearch = !search || 
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.email?.toLowerCase().includes(search.toLowerCase());

      return hasSpecialty && matchesSearch;
    });
  }, [companies, filterSpecialty, search]);

  // Get primary contact for each company
  const getCompanyContact = (companyId: string) => {
    return contacts.find(c => c.crm_company_id === companyId);
  };

  const specialtyLabel = SPECIALTIES.find(s => s.value === specialty)?.label || specialty;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Entreprises CRM
          </span>
          <Badge variant="secondary">{filteredCompanies.length}</Badge>
        </CardTitle>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-4 pb-4 space-y-2">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune entreprise trouvée</p>
                <p className="text-xs mt-1">
                  Ajoutez des entreprises avec la spécialité "{specialtyLabel}" dans le CRM
                </p>
              </div>
            ) : (
              filteredCompanies.map((company) => {
                const contact = getCompanyContact(company.id);
                const isSelected = selectedIds.includes(company.id);

                return (
                  <div
                    key={company.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() => {
                      if (isSelected) {
                        onDeselect(company.id);
                      } else {
                        onSelect(company.id, contact?.id);
                      }
                    }}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={company.logo_url || undefined} />
                      <AvatarFallback>
                        {company.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{company.name}</p>
                      {contact && (
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.name} {contact.email ? `(${contact.email})` : ''}
                        </p>
                      )}
                      {company.bet_specialties && company.bet_specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {company.bet_specialties.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] px-1 py-0">
                              {SPECIALTIES.find(sp => sp.value === s)?.label || s}
                            </Badge>
                          ))}
                          {company.bet_specialties.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              +{company.bet_specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
