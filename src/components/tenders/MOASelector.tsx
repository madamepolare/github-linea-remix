import { useState, useMemo } from "react";
import { Building2, Plus, Search, X, AlertTriangle, Merge, Check } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";

interface MOASelectorProps {
  value: string | null;
  clientName: string | null;
  onChange: (companyId: string | null, clientName: string | null) => void;
}

// Normalize text for comparison (lowercase, remove accents, extra spaces, etc.)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, ' ') // Replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

// Calculate similarity between two strings (0-1)
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  
  if (norm1 === norm2) return 1;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.9;
  }
  
  // Levenshtein-based similarity for short strings
  const words1 = norm1.split(' ').filter(Boolean);
  const words2 = norm2.split(' ').filter(Boolean);
  
  // Count matching words
  const matchingWords = words1.filter(w1 => 
    words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
  );
  
  const wordSimilarity = matchingWords.length / Math.max(words1.length, words2.length);
  
  return wordSimilarity;
}

interface SimilarCompany {
  company: {
    id: string;
    name: string;
    city?: string | null;
    industry?: string | null;
  };
  similarity: number;
}

export function MOASelector({ value, clientName, onChange }: MOASelectorProps) {
  const { companies, createCompany, isLoading, updateCompany } = useCRMCompanies();
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [similarCompanies, setSimilarCompanies] = useState<SimilarCompany[]>([]);
  const [pendingNewName, setPendingNewName] = useState("");

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

  // Find similar companies based on search
  const filteredCompanies = moaCompanies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find potential duplicates when typing
  const potentialDuplicates = useMemo(() => {
    if (searchQuery.length < 3) return [];
    
    const similars: SimilarCompany[] = [];
    
    for (const company of companies) {
      const similarity = calculateSimilarity(searchQuery, company.name);
      if (similarity >= 0.6 && similarity < 1) {
        similars.push({ company, similarity });
      }
    }
    
    return similars.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }, [searchQuery, companies]);

  const selectedCompany = companies.find(c => c.id === value);

  const handleSelect = (company: typeof companies[0]) => {
    onChange(company.id, company.name);
  };

  const handleClear = () => {
    onChange(null, null);
  };

  const checkForDuplicatesBeforeCreate = (name: string) => {
    const similars: SimilarCompany[] = [];
    
    for (const company of companies) {
      const similarity = calculateSimilarity(name, company.name);
      if (similarity >= 0.6) {
        similars.push({ company, similarity });
      }
    }
    
    const sorted = similars.sort((a, b) => b.similarity - a.similarity);
    
    if (sorted.length > 0) {
      setSimilarCompanies(sorted);
      setPendingNewName(name);
      setShowMergeDialog(true);
      return true;
    }
    
    return false;
  };

  const handleQuickAdd = async () => {
    if (!newCompanyName.trim()) return;
    
    // Check for duplicates first
    if (checkForDuplicatesBeforeCreate(newCompanyName.trim())) {
      setShowQuickAdd(false);
      return;
    }
    
    await createNewCompany(newCompanyName.trim());
  };

  const createNewCompany = async (name: string) => {
    setIsCreating(true);
    try {
      const result = await createCompany.mutateAsync({
        name: name,
        industry: 'client_public',
      });
      onChange(result.id, result.name);
      setShowQuickAdd(false);
      setShowMergeDialog(false);
      setNewCompanyName("");
      setPendingNewName("");
      setSimilarCompanies([]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectExisting = (company: SimilarCompany['company']) => {
    onChange(company.id, company.name);
    setShowMergeDialog(false);
    setShowQuickAdd(false);
    setNewCompanyName("");
    setPendingNewName("");
    setSimilarCompanies([]);
  };

  const handleCreateAnyway = async () => {
    await createNewCompany(pendingNewName);
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

      {/* Similar companies warning */}
      {potentialDuplicates.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Existants similaires :</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {potentialDuplicates.map((dup) => (
                <Button
                  key={dup.company.id}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-white dark:bg-background"
                  onClick={() => handleSelect(dup.company as typeof companies[0])}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {dup.company.name}
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

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

      {/* Merge / Duplicate Detection Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Organismes similaires détectés
            </DialogTitle>
            <DialogDescription>
              "{pendingNewName}" ressemble à des organismes existants dans le CRM.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium">Voulez-vous sélectionner un existant ?</p>
            
            <div className="space-y-2">
              {similarCompanies.map((sim) => (
                <button
                  key={sim.company.id}
                  type="button"
                  onClick={() => handleSelectExisting(sim.company)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                >
                  <div className="p-2 rounded bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{sim.company.name}</p>
                    {sim.company.city && (
                      <p className="text-xs text-muted-foreground">{sim.company.city}</p>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      sim.similarity >= 0.9 && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                      sim.similarity >= 0.7 && sim.similarity < 0.9 && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    {Math.round(sim.similarity * 100)}% similaire
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowMergeDialog(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleCreateAnyway}
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              {isCreating ? "Création..." : `Créer "${pendingNewName}" quand même`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
