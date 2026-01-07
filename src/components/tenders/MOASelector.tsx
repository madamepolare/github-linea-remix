import { useState } from "react";
import { Building2, Plus, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";

interface MOASelectorProps {
  value: string | null;
  clientName: string | null;
  onChange: (companyId: string | null, clientName: string | null) => void;
}

export function MOASelector({ value, clientName, onChange }: MOASelectorProps) {
  const { companies, createCompany, isLoading } = useCRMCompanies();
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filter MOA/client companies
  const moaCompanies = companies.filter(c => 
    c.industry === 'client_public' || 
    c.industry === 'client_prive' ||
    c.industry === 'collectivite' ||
    c.industry === 'bailleur_social' ||
    c.industry === 'etablissement_public' ||
    c.industry === 'etat' ||
    c.industry?.includes('client') ||
    c.industry?.includes('moa')
  );

  const filteredCompanies = moaCompanies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.id === value);

  const handleSelect = (company: typeof companies[0]) => {
    onChange(company.id, company.name);
  };

  const handleClear = () => {
    onChange(null, null);
  };

  const handleQuickAdd = async () => {
    if (!newCompanyName.trim()) return;
    
    setIsCreating(true);
    try {
      const result = await createCompany.mutateAsync({
        name: newCompanyName.trim(),
        industry: 'client_public',
      });
      onChange(result.id, result.name);
      setShowQuickAdd(false);
      setNewCompanyName("");
    } finally {
      setIsCreating(false);
    }
  };

  if (selectedCompany) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
        <div className="p-2 rounded-lg bg-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{selectedCompany.name}</p>
          {selectedCompany.city && (
            <p className="text-xs text-muted-foreground">{selectedCompany.city}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un MOA dans le CRM..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Companies list */}
      <ScrollArea className="h-48 rounded-lg border">
        <div className="p-2 space-y-1">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => handleSelect(company)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                  "hover:bg-muted"
                )}
              >
                <div className="p-1.5 rounded bg-muted">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{company.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {company.city || 'Aucune localisation'}
                  </p>
                </div>
                {company.industry && (
                  <Badge variant="secondary" className="text-xs">
                    {company.industry === 'client_public' ? 'Public' : 
                     company.industry === 'client_prive' ? 'Privé' : 
                     company.industry}
                  </Badge>
                )}
              </button>
            ))
          ) : searchQuery ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">
                Aucun MOA trouvé pour "{searchQuery}"
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewCompanyName(searchQuery);
                  setShowQuickAdd(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Créer "{searchQuery}"
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {isLoading ? "Chargement..." : "Aucun MOA dans le CRM"}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick add button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setShowQuickAdd(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un nouveau MOA
      </Button>

      {/* Quick add dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un MOA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de l'organisme</Label>
              <Input
                placeholder="Ex: Ville de Paris"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              L'entreprise sera automatiquement catégorisée comme "MOA Public" dans le CRM.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickAdd(false)}>
              Annuler
            </Button>
            <Button onClick={handleQuickAdd} disabled={!newCompanyName.trim() || isCreating}>
              {isCreating ? "Création..." : "Créer et sélectionner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
