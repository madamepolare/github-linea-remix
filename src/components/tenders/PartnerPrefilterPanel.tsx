import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Building2,
  CheckCircle2,
  Star,
  MapPin,
  Award,
  Users,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { SPECIALTIES } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

interface PartnerPrefilterPanelProps {
  requiredSpecialties: string[];
  existingPartnerIds: string[];
  tenderLocation?: string | null;
  onAddPartners: (partners: Array<{
    specialty: string;
    company_id: string;
    contact_id?: string;
    role: string;
  }>) => void;
  onClose?: () => void;
}

interface FilterState {
  search: string;
  specialty: string;
  locationMatch: boolean;
  hasReferences: boolean;
  hasContact: boolean;
}

export function PartnerPrefilterPanel({
  requiredSpecialties,
  existingPartnerIds,
  tenderLocation,
  onAddPartners,
  onClose,
}: PartnerPrefilterPanelProps) {
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    specialty: requiredSpecialties[0] || "",
    locationMatch: false,
    hasReferences: false,
    hasContact: true,
  });
  
  const [selectedCompanies, setSelectedCompanies] = useState<Map<string, {
    specialty: string;
    contactId?: string;
  }>>(new Map());

  // Get postal code from tender location
  const tenderPostalPrefix = tenderLocation?.match(/\d{2}/)?.[0] || null;

  // Get contacts for a company
  const getCompanyContacts = (companyId: string) => 
    contacts.filter(c => c.crm_company_id === companyId);

  // Score and filter companies
  const scoredCompanies = useMemo(() => {
    return companies
      .filter(company => {
        // Exclude already added partners
        if (existingPartnerIds.includes(company.id)) return false;
        
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (!company.name.toLowerCase().includes(searchLower) &&
              !company.city?.toLowerCase().includes(searchLower)) {
            return false;
          }
        }
        
        // Specialty filter
        if (filters.specialty) {
          const hasSpecialty = company.bet_specialties?.includes(filters.specialty) ||
            company.industry?.toLowerCase().includes(filters.specialty.replace('_', ' '));
          if (!hasSpecialty) return false;
        }
        
        // Location match filter
        if (filters.locationMatch && tenderPostalPrefix) {
          const companyPostal = company.postal_code?.substring(0, 2);
          if (companyPostal !== tenderPostalPrefix) return false;
        }
        
        // Has contact filter
        if (filters.hasContact) {
          const companyContacts = getCompanyContacts(company.id);
          if (companyContacts.length === 0) return false;
        }
        
        return true;
      })
      .map(company => {
        let score = 0;
        
        // Score by specialty match count
        const matchingSpecialties = requiredSpecialties.filter(s => 
          company.bet_specialties?.includes(s)
        );
        score += matchingSpecialties.length * 20;
        
        // Score by location proximity
        if (tenderPostalPrefix) {
          const companyPostal = company.postal_code?.substring(0, 2);
          if (companyPostal === tenderPostalPrefix) {
            score += 30;
          } else if (companyPostal) {
            // Nearby departments get partial score
            const diff = Math.abs(parseInt(companyPostal) - parseInt(tenderPostalPrefix));
            if (diff <= 5) score += 15;
          }
        }
        
        // Score by having contacts with email
        const companyContacts = getCompanyContacts(company.id);
        const contactsWithEmail = companyContacts.filter(c => c.email);
        if (contactsWithEmail.length > 0) score += 15;
        
        // Score by having multiple specialties (versatility)
        if (company.bet_specialties && company.bet_specialties.length > 1) {
          score += 5;
        }
        
        return {
          company,
          contacts: companyContacts,
          score,
          matchingSpecialties,
          isLocal: tenderPostalPrefix ? company.postal_code?.startsWith(tenderPostalPrefix) : false,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [companies, contacts, filters, existingPartnerIds, requiredSpecialties, tenderPostalPrefix]);

  const toggleCompany = (companyId: string, specialty: string) => {
    const newSelected = new Map(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      const companyContacts = getCompanyContacts(companyId);
      const primaryContact = companyContacts.find(c => c.email);
      newSelected.set(companyId, {
        specialty,
        contactId: primaryContact?.id,
      });
    }
    setSelectedCompanies(newSelected);
  };

  const handleAddSelected = () => {
    const partners = Array.from(selectedCompanies.entries()).map(([companyId, data]) => ({
      specialty: data.specialty,
      company_id: companyId,
      contact_id: data.contactId,
      role: "cotraitant",
    }));
    onAddPartners(partners);
    setSelectedCompanies(new Map());
  };

  // AI Suggestions based on missing specialties
  const suggestedBySpecialty = useMemo(() => {
    const suggestions: Record<string, typeof scoredCompanies> = {};
    requiredSpecialties.forEach(specialty => {
      suggestions[specialty] = scoredCompanies
        .filter(sc => sc.company.bet_specialties?.includes(specialty))
        .slice(0, 3);
    });
    return suggestions;
  }, [scoredCompanies, requiredSpecialties]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sélection intelligente de partenaires
          </h3>
          <p className="text-sm text-muted-foreground">
            Entreprises pré-filtrées selon les compétences requises et la localisation
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Suggestions */}
      {Object.entries(suggestedBySpecialty).some(([_, list]) => list.length > 0) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Suggestions par compétence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredSpecialties.map(specialty => {
              const suggestions = suggestedBySpecialty[specialty];
              if (!suggestions || suggestions.length === 0) return null;
              
              return (
                <div key={specialty}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {SPECIALTIES.find(s => s.value === specialty)?.label || specialty}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(({ company, isLocal, contacts }) => (
                      <Button
                        key={company.id}
                        variant={selectedCompanies.has(company.id) ? "default" : "outline"}
                        size="sm"
                        className="h-auto py-1.5 px-3"
                        onClick={() => toggleCompany(company.id, specialty)}
                      >
                        {company.name}
                        {isLocal && (
                          <MapPin className="h-3 w-3 ml-1 text-green-600" />
                        )}
                        {contacts.some(c => c.email) && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                            Contact
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select
              value={filters.specialty}
              onValueChange={(v) => setFilters({ ...filters, specialty: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Spécialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les spécialités</SelectItem>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              {tenderLocation && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="locationMatch"
                    checked={filters.locationMatch}
                    onCheckedChange={(v) => setFilters({ ...filters, locationMatch: !!v })}
                  />
                  <Label htmlFor="locationMatch" className="text-sm cursor-pointer flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Même département
                  </Label>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasContact"
                  checked={filters.hasContact}
                  onCheckedChange={(v) => setFilters({ ...filters, hasContact: !!v })}
                />
                <Label htmlFor="hasContact" className="text-sm cursor-pointer">
                  Avec contact
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {scoredCompanies.length} entreprise(s) trouvée(s)
            </CardTitle>
            {selectedCompanies.size > 0 && (
              <Button size="sm" onClick={handleAddSelected}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter {selectedCompanies.size} au pipeline
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {scoredCompanies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune entreprise ne correspond aux critères</p>
                  <p className="text-xs mt-1">Essayez d'ajuster les filtres</p>
                </div>
              ) : (
                scoredCompanies.map(({ company, contacts, score, matchingSpecialties, isLocal }) => {
                  const isSelected = selectedCompanies.has(company.id);
                  const primaryContact = contacts.find(c => c.email);
                  
                  return (
                    <div
                      key={company.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected 
                          ? "bg-primary/10 border-primary" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleCompany(company.id, filters.specialty || matchingSpecialties[0] || '')}
                    >
                      <Checkbox 
                        checked={isSelected}
                        className="mt-1"
                        onCheckedChange={() => toggleCompany(company.id, filters.specialty || matchingSpecialties[0] || '')}
                      />
                      
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={company.logo_url || undefined} />
                        <AvatarFallback>{company.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{company.name}</p>
                          {isLocal && (
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                              <MapPin className="h-2.5 w-2.5 mr-0.5" />
                              Local
                            </Badge>
                          )}
                          {score >= 50 && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Star className="h-2.5 w-2.5 mr-0.5 text-amber-500" />
                              Recommandé
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {company.city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {company.city} {company.postal_code && `(${company.postal_code.substring(0, 2)})`}
                            </span>
                          )}
                          {primaryContact && (
                            <span className="flex items-center gap-0.5">
                              <Users className="h-3 w-3" />
                              {primaryContact.name}
                            </span>
                          )}
                        </div>
                        
                        {matchingSpecialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {matchingSpecialties.map(s => (
                              <Badge 
                                key={s} 
                                variant="outline" 
                                className="text-[10px] px-1.5 py-0"
                              >
                                {SPECIALTIES.find(sp => sp.value === s)?.label || s}
                              </Badge>
                            ))}
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

      {/* Action Footer */}
      {selectedCompanies.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedCompanies.size} sélectionné(s)</Badge>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCompanies(new Map())}>
              Tout désélectionner
            </Button>
          </div>
          <Button onClick={handleAddSelected}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter au pipeline
          </Button>
        </div>
      )}
    </div>
  );
}
