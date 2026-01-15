import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Loader2 } from "lucide-react";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { getIndustryLabel } from "@/lib/crmConstants";
import { cn } from "@/lib/utils";

interface CompanySearchSelectProps {
  value: string | undefined;
  onChange: (companyId: string) => void;
  onCreateCompany?: (name: string) => Promise<any>;
  allowCreate?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CompanySearchSelect({
  value,
  onChange,
  onCreateCompany,
  allowCreate = false,
  placeholder = "Rechercher une entreprise...",
  disabled = false,
  className,
}: CompanySearchSelectProps) {
  const { companies } = useCRMCompanies();
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === value);
  }, [companies, value]);

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies.slice(0, 10);
    const searchLower = search.toLowerCase();
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  }, [companies, search]);

  const handleCreateCompany = async () => {
    if (!onCreateCompany || !search.trim()) return;
    
    setIsCreating(true);
    try {
      const newCompany = await onCreateCompany(search.trim());
      onChange(newCompany.id);
      setSearch("");
      setShowDropdown(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelect = (companyId: string) => {
    onChange(companyId);
    setSearch("");
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange("");
    setSearch("");
  };

  if (selectedCompany) {
    return (
      <div className={cn("flex items-center gap-2 p-2.5 rounded-md border border-border bg-muted/30", className)}>
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm truncate">{selectedCompany.name}</span>
        {selectedCompany.industry && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
            {getIndustryLabel(selectedCompany.industry)}
          </Badge>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleClear}
          disabled={disabled}
        >
          Changer
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-9"
          disabled={disabled}
        />
      </div>
      
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {/* No company option */}
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors text-muted-foreground"
            onClick={() => {
              handleSelect("");
              setShowDropdown(false);
            }}
          >
            Aucune entreprise
          </button>
          
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => handleSelect(company.id)}
              >
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{company.name}</span>
                {company.industry && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    {getIndustryLabel(company.industry)}
                  </Badge>
                )}
              </button>
            ))
          ) : search.trim() ? (
            <p className="text-xs text-muted-foreground p-3">
              Aucune entreprise trouvée
            </p>
          ) : (
            <p className="text-xs text-muted-foreground p-3">
              Tapez pour rechercher...
            </p>
          )}
          
          {/* Create option */}
          {allowCreate && search.trim() && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 border-t text-primary"
              onClick={handleCreateCompany}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>Créer "{search.trim()}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
