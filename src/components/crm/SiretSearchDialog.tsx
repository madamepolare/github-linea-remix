import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Building2, MapPin, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CompanyResult {
  siren: string;
  siret: string;
  nom_complet: string;
  nom_raison_sociale: string;
  adresse: string;
  code_postal: string;
  ville: string;
  activite_principale: string;
  libelle_activite: string;
  nature_juridique: string;
  tranche_effectif: string;
  date_creation: string;
}

interface SiretSearchDialogProps {
  onSelect: (company: {
    siren: string;
    siret: string;
    name: string;
    address: string;
    postal_code: string;
    city: string;
    code_naf: string;
    forme_juridique: string;
  }) => void;
  trigger?: React.ReactNode;
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
  "7112": "EURL",
};

export function SiretSearchDialog({ onSelect, trigger }: SiretSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setHasSearched(false);
    }
  }, [open]);

  // Search API
  const searchCompanies = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(searchQuery)}&page=1&per_page=20`
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
          // Try to remove postal code and city from the end
          const fullAddr = siege.adresse;
          const postalCode = siege.code_postal || "";
          const city = siege.libelle_commune || "";
          if (postalCode && city) {
            // Remove "75018 PARIS" from end
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
          libelle_activite: item.libelle_activite_principale || "",
          nature_juridique: item.nature_juridique || "",
          tranche_effectif: item.tranche_effectif_salarie || "",
          date_creation: item.date_creation || "",
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
      }, 400);
    } else {
      setResults([]);
      setHasSearched(false);
    }
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleSelect = (company: CompanyResult) => {
    const natureJuridiqueLabel = NATURE_JURIDIQUE_MAP[company.nature_juridique] || company.nature_juridique;
    
    onSelect({
      siren: company.siren,
      siret: company.siret,
      name: company.nom_complet || company.nom_raison_sociale,
      address: company.adresse,
      postal_code: company.code_postal,
      city: company.ville,
      code_naf: company.activite_principale,
      forme_juridique: natureJuridiqueLabel,
    });
    setOpen(false);
  };

  const formatSiret = (siret: string) => {
    if (!siret) return "";
    return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
  };

  const formatSiren = (siren: string) => {
    if (!siren) return "";
    return siren.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Recherche d'entreprise
          </DialogTitle>
          <DialogDescription>
            Recherchez une entreprise par son nom, SIRET ou SIREN dans le registre national
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tapez un nom d'entreprise, SIRET ou SIREN..."
            className="pl-10 h-11"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6 min-h-[300px] max-h-[50vh]">
          {!hasSearched && query.length < 3 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">Saisissez au moins 3 caractères pour lancer la recherche</p>
              <p className="text-xs mt-1">Ex: "Dupont construction", "75008", "123456789"</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-sm">Recherche en cours...</p>
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">Aucune entreprise trouvée</p>
              <p className="text-xs mt-1">Vérifiez l'orthographe ou essayez un autre terme</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-2 py-2">
              {results.map((company) => (
                <button
                  key={company.siret || company.siren}
                  onClick={() => handleSelect(company)}
                  className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground truncate">
                          {company.nom_complet || company.nom_raison_sociale}
                        </span>
                        {NATURE_JURIDIQUE_MAP[company.nature_juridique] && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {NATURE_JURIDIQUE_MAP[company.nature_juridique]}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">
                          SIRET: {formatSiret(company.siret)}
                        </span>
                        <span className="font-mono text-xs">
                          SIREN: {formatSiren(company.siren)}
                        </span>
                      </div>

                      {(company.code_postal || company.ville) && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {company.adresse && <span>{company.adresse}, </span>}
                          <span>{company.code_postal} {company.ville}</span>
                        </div>
                      )}

                      {company.libelle_activite && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {company.activite_principale} - {company.libelle_activite}
                        </p>
                      )}
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Source: API Recherche d'entreprises (data.gouv.fr) - Registre national des entreprises
        </div>
      </DialogContent>
    </Dialog>
  );
}
