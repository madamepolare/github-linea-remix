import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCRMSettings } from "./useCRMSettings";
import { useCRMCompanies, CRMCompanyEnriched } from "./useCRMCompanies";
import { useContacts, Contact } from "./useContacts";

export interface CategorizationSuggestion {
  id: string;
  name: string;
  suggested_category?: string;
  suggested_category_label?: string;
  suggested_type?: string;
  suggested_type_label?: string;
  suggested_bet_specialties?: string[];
  confidence: number;
  reason: string;
  selected?: boolean;
}

export type EntityType = "companies" | "contacts";
export type FilterMode = "all" | "uncategorized" | "unknown";

export function useAutoCategorize() {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<CategorizationSuggestion[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("uncategorized");
  const [entityType, setEntityType] = useState<EntityType>("companies");

  const { 
    companyCategories, 
    companyTypes, 
    betSpecialties,
    contactTypes 
  } = useCRMSettings();
  
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  // Get the category from company type (industry)
  const getCategoryFromType = useCallback((industry: string | null): string | null => {
    if (!industry) return null;
    const typeConfig = companyTypes.find(t => t.key === industry);
    return typeConfig?.category || null;
  }, [companyTypes]);

  // Get companies that need categorization
  const uncategorizedCompanies = useMemo(() => {
    if (!allCompanies) return [];
    
    const validTypes = companyTypes.map(t => t.key);

    return allCompanies.filter(company => {
      if (filterMode === "all") return true;
      if (filterMode === "uncategorized") {
        return !company.industry;
      }
      if (filterMode === "unknown") {
        return company.industry && !validTypes.includes(company.industry);
      }
      return false;
    });
  }, [allCompanies, filterMode, companyTypes]);

  // Get contacts that need categorization
  const uncategorizedContacts = useMemo(() => {
    if (!allContacts) return [];
    
    const validTypes = contactTypes.map(t => t.key);

    return allContacts.filter(contact => {
      if (filterMode === "all") return true;
      if (filterMode === "uncategorized") {
        return !contact.contact_type;
      }
      if (filterMode === "unknown") {
        return contact.contact_type && !validTypes.includes(contact.contact_type);
      }
      return false;
    });
  }, [allContacts, filterMode, contactTypes]);

  // Stats
  const stats = useMemo(() => {
    const companies = allCompanies || [];
    const contacts = allContacts || [];
    const validCompanyTypes = companyTypes.map(t => t.key);
    const validContactTypes = contactTypes.map(t => t.key);

    return {
      companies: {
        total: companies.length,
        uncategorized: companies.filter(c => !c.industry).length,
        unknownType: companies.filter(c => c.industry && !validCompanyTypes.includes(c.industry)).length,
      },
      contacts: {
        total: contacts.length,
        uncategorized: contacts.filter(c => !c.contact_type).length,
        unknownType: contacts.filter(c => c.contact_type && !validContactTypes.includes(c.contact_type)).length,
      }
    };
  }, [allCompanies, allContacts, companyTypes, contactTypes]);

  // Analyze entities with AI
  const analyzeEntities = useCallback(async (entitiesToAnalyze?: (CRMCompanyEnriched | Contact)[]) => {
    setIsAnalyzing(true);
    setSuggestions([]);

    try {
      let entities: any[];
      
      if (entityType === "companies") {
        const companies = (entitiesToAnalyze as CRMCompanyEnriched[]) || uncategorizedCompanies;
        entities = companies.slice(0, 20).map(c => ({
          id: c.id,
          name: c.name,
          website: c.website,
          notes: c.notes,
          email: c.email,
          current_industry: c.industry,
          current_category: getCategoryFromType(c.industry),
          bet_specialties: c.bet_specialties,
        }));
      } else {
        const contacts = (entitiesToAnalyze as Contact[]) || uncategorizedContacts;
        entities = contacts.slice(0, 20).map(c => ({
          id: c.id,
          name: c.name,
          role: c.role,
          email: c.email,
          current_type: c.contact_type,
          company_name: c.company?.name,
          company_industry: c.company?.industry,
        }));
      }

      if (entities.length === 0) {
        toast.info("Aucune entité à analyser");
        setIsAnalyzing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('auto-categorize-companies', {
        body: {
          entities,
          entityType,
          categories: companyCategories.map(c => ({ key: c.key, label: c.label })),
          types: companyTypes.map(t => ({ key: t.key, label: t.label, shortLabel: t.shortLabel, category: t.category })),
          betSpecialties: betSpecialties.map(s => ({ key: s.key, label: s.label })),
          contactTypes: contactTypes.map(t => ({ key: t.key, label: t.label })),
        }
      });

      if (error) throw error;

      const results = (data.results || []).map((r: CategorizationSuggestion) => ({
        ...r,
        selected: r.confidence >= 70, // Auto-select high confidence
      }));

      setSuggestions(results);
      toast.success(`${results.length} suggestion(s) générée(s)`);
    } catch (error: any) {
      console.error("Error analyzing entities:", error);
      toast.error("Erreur lors de l'analyse: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [entityType, uncategorizedCompanies, uncategorizedContacts, companyCategories, companyTypes, betSpecialties, contactTypes, getCategoryFromType]);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === id ? { ...s, selected: !s.selected } : s
    ));
  }, []);

  // Select all
  const selectAll = useCallback((selected: boolean) => {
    setSuggestions(prev => prev.map(s => ({ ...s, selected })));
  }, []);

  // Apply selected suggestions
  const applyMutation = useMutation({
    mutationFn: async () => {
      const selectedSuggestions = suggestions.filter(s => s.selected);
      
      if (selectedSuggestions.length === 0) {
        throw new Error("Aucune suggestion sélectionnée");
      }

      const updates = selectedSuggestions.map(async (suggestion) => {
        if (entityType === "companies") {
          const updateData: Record<string, any> = {};
          // We only update the industry (type) field - category is derived from type
          if (suggestion.suggested_type) {
            updateData.industry = suggestion.suggested_type;
          }
          if (suggestion.suggested_bet_specialties && suggestion.suggested_bet_specialties.length > 0) {
            updateData.bet_specialties = suggestion.suggested_bet_specialties;
          }

          if (Object.keys(updateData).length === 0) return;

          const { error } = await supabase
            .from('crm_companies')
            .update(updateData)
            .eq('id', suggestion.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('contacts')
            .update({ contact_type: suggestion.suggested_type })
            .eq('id', suggestion.id);

          if (error) throw error;
        }
      });

      await Promise.all(updates);
      return selectedSuggestions.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} ${entityType === "companies" ? "entreprise(s)" : "contact(s)"} mis à jour`);
      queryClient.invalidateQueries({ queryKey: ['crm-companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSuggestions([]);
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la mise à jour: " + error.message);
    }
  });

  return {
    // State
    isAnalyzing,
    suggestions,
    filterMode,
    entityType,
    stats,
    
    // Filtered entities
    uncategorizedCompanies,
    uncategorizedContacts,
    
    // Actions
    setFilterMode,
    setEntityType,
    analyzeEntities,
    toggleSelection,
    selectAll,
    applySuggestions: applyMutation.mutate,
    isApplying: applyMutation.isPending,
    
    // Clear
    clearSuggestions: () => setSuggestions([]),
  };
}
