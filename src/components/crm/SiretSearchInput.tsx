import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Building2, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CompanyResult {
  siren: string;
  siret: string;
  nom_complet: string;
  nom_raison_sociale: string;
  adresse: string;
  code_postal: string;
  ville: string;
  activite_principale: string;
  nature_juridique: string;
  tranche_effectif: string;
}

interface SiretSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onCompanySelect?: (company: {
    siren: string;
    siret: string;
    name: string;
    address: string;
    postal_code: string;
    city: string;
    code_naf: string;
    forme_juridique: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

// Map nature juridique codes to readable labels
const NATURE_JURIDIQUE_MAP: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "5499": "SA",
  "5505": "SA à directoire",
  "5510": "SA à conseil d'administration",
  "5599": "SA",
  "5710": "SAS",
  "5720": "SASU",
  "5800": "SE",
  "6540": "SARL",
  "6599": "SARL",
  "7112": "SARL unipersonnelle (EURL)",
};

export function SiretSearchInput({
  value,
  onChange,
  onCompanySelect,
  placeholder = "Rechercher par SIRET, SIREN ou nom...",
  className,
}: SiretSearchInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Search API
  const searchCompanies = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using the French government open API for company search
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(searchQuery)}&page=1&per_page=10`
      );
      
      if (!response.ok) throw new Error("API error");
      
      const data = await response.json();
      
      const companies: CompanyResult[] = (data.results || []).map((item: any) => {
        const siege = item.siege || {};
        
        // Build address from components (excluding postal code and city)
        let adresse = "";
        if (siege.numero_voie) adresse += siege.numero_voie + " ";
        if (siege.type_voie) adresse += siege.type_voie + " ";
        if (siege.libelle_voie) adresse += siege.libelle_voie;
        adresse = adresse.trim();
        
        // If no components, use the full address but try to extract just the street
        if (!adresse && siege.adresse) {
          const fullAddr = siege.adresse;
          const postalCode = siege.code_postal || "";
          const city = siege.libelle_commune || "";
          if (postalCode && city) {
            adresse = fullAddr.replace(new RegExp(`\\s*${postalCode}\\s*${city}\\s*$`, 'i'), '').trim();
          } else {
            adresse = fullAddr;
          }
        }
        
        return {
          siren: item.siren || "",
          siret: siege.siret || "",
          nom_complet: item.nom_complet || item.nom_raison_sociale || "",
          nom_raison_sociale: item.nom_raison_sociale || "",
          adresse: adresse,
          code_postal: siege.code_postal || "",
          ville: siege.libelle_commune || "",
          activite_principale: item.activite_principale || siege.activite_principale || "",
          nature_juridique: item.nature_juridique || "",
          tranche_effectif: item.tranche_effectif_salarie || "",
        };
      });
      
      setResults(companies);
    } catch (error) {
      console.error("Error searching companies:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (query.length >= 3) {
      searchTimeout.current = setTimeout(() => {
        searchCompanies(query);
      }, 300);
    } else {
      setResults([]);
    }
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleSelect = (company: CompanyResult) => {
    setSelectedCompany(company);
    onChange(company.siret);
    setOpen(false);
    setQuery("");
    
    if (onCompanySelect) {
      const natureJuridiqueLabel = NATURE_JURIDIQUE_MAP[company.nature_juridique] || company.nature_juridique;
      
      onCompanySelect({
        siren: company.siren,
        siret: company.siret,
        name: company.nom_complet || company.nom_raison_sociale,
        address: company.adresse,
        postal_code: company.code_postal,
        city: company.ville,
        code_naf: company.activite_principale,
        forme_juridique: natureJuridiqueLabel,
      });
    }
  };

  const formatSiret = (siret: string) => {
    if (!siret) return "";
    // Format: XXX XXX XXX XXXXX
    return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2">
        SIRET
        <span className="text-xs text-muted-foreground font-normal">(recherche auto)</span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={open ? query : value}
              onChange={(e) => {
                if (open) {
                  setQuery(e.target.value);
                } else {
                  onChange(e.target.value);
                }
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="pr-10"
              maxLength={14}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start" sideOffset={4}>
          <Command shouldFilter={false}>
            <div className="p-2 border-b">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par SIRET, SIREN ou nom..."
                className="h-9"
                autoFocus
              />
            </div>
            <CommandList>
              {isLoading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Recherche en cours...
                </div>
              )}
              {!isLoading && query.length < 3 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Saisissez au moins 3 caractères pour rechercher
                </div>
              )}
              {!isLoading && query.length >= 3 && results.length === 0 && (
                <CommandEmpty>Aucune entreprise trouvée</CommandEmpty>
              )}
              {!isLoading && results.length > 0 && (
                <CommandGroup heading="Entreprises">
                  {results.map((company) => (
                    <CommandItem
                      key={company.siret || company.siren}
                      value={company.siret}
                      onSelect={() => handleSelect(company)}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Building2 className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium truncate flex-1">
                          {company.nom_complet || company.nom_raison_sociale}
                        </span>
                        {selectedCompany?.siret === company.siret && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                        <span className="font-mono">{formatSiret(company.siret)}</span>
                        {company.code_postal && company.ville && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {company.code_postal} {company.ville}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedCompany && (
        <p className="text-xs text-muted-foreground">
          ✓ {selectedCompany.nom_complet} sélectionné
        </p>
      )}
    </div>
  );
}
