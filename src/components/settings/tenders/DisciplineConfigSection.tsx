import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Frame, Megaphone, Users, FileText, Award, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDiscipline } from "@/hooks/useDiscipline";
import { CustomizableListEditor, type ListItem } from "./CustomizableListEditor";
import { 
  getDiscipline, 
  getAllDisciplines,
  type DisciplineSlug 
} from "@/lib/disciplines";
import { useDisciplineOverrides } from "@/hooks/useDisciplineOverrides";

const DISCIPLINE_ICONS: Record<DisciplineSlug, React.ComponentType<{ className?: string }>> = {
  architecture: Building2,
  scenographie: Frame,
  communication: Megaphone,
};

export function DisciplineConfigSection() {
  const { disciplineSlug: workspaceDiscipline } = useDiscipline();
  const allDisciplines = getAllDisciplines();
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineSlug>("architecture");

  const discipline = getDiscipline(activeDiscipline);
  const tenderConfig = discipline.tenders;

  const {
    overrides,
    isLoading,
    updateOverrides,
  } = useDisciplineOverrides(activeDiscipline);

  const handleAddSpecialty = (item: ListItem) => {
    const current = overrides?.custom_team_specialties || [];
    updateOverrides({
      custom_team_specialties: [...current, item],
    });
  };

  const handleRemoveSpecialty = (value: string) => {
    const current = overrides?.custom_team_specialties || [];
    updateOverrides({
      custom_team_specialties: current.filter(s => s.value !== value),
    });
  };

  const handleToggleSpecialtyHidden = (value: string, isHidden: boolean) => {
    const current = overrides?.hidden_team_specialties || [];
    updateOverrides({
      hidden_team_specialties: isHidden
        ? [...current, value]
        : current.filter(v => v !== value),
    });
  };

  const handleAddCandidatureDoc = (item: ListItem) => {
    const current = overrides?.custom_document_types?.candidature || [];
    updateOverrides({
      custom_document_types: {
        ...overrides?.custom_document_types,
        candidature: [...current, { ...item, mandatory: false }],
      },
    });
  };

  const handleAddOffreDoc = (item: ListItem) => {
    const current = overrides?.custom_document_types?.offre || [];
    updateOverrides({
      custom_document_types: {
        ...overrides?.custom_document_types,
        offre: [...current, { ...item, mandatory: false }],
      },
    });
  };

  const handleRemoveCandidatureDoc = (value: string) => {
    const current = overrides?.custom_document_types?.candidature || [];
    updateOverrides({
      custom_document_types: {
        ...overrides?.custom_document_types,
        candidature: current.filter(d => d.value !== value),
      },
    });
  };

  const handleRemoveOffreDoc = (value: string) => {
    const current = overrides?.custom_document_types?.offre || [];
    updateOverrides({
      custom_document_types: {
        ...overrides?.custom_document_types,
        offre: current.filter(d => d.value !== value),
      },
    });
  };

  const handleToggleDocHidden = (value: string, isHidden: boolean) => {
    const current = overrides?.hidden_document_types || [];
    updateOverrides({
      hidden_document_types: isHidden
        ? [...current, value]
        : current.filter(v => v !== value),
    });
  };

  const handleAddCriterion = (item: ListItem) => {
    const current = overrides?.custom_criterion_types || [];
    updateOverrides({
      custom_criterion_types: [...current, item],
    });
  };

  const handleRemoveCriterion = (value: string) => {
    const current = overrides?.custom_criterion_types || [];
    updateOverrides({
      custom_criterion_types: current.filter(c => c.value !== value),
    });
  };

  const handleToggleCriterionHidden = (value: string, isHidden: boolean) => {
    const current = overrides?.hidden_criterion_types || [];
    updateOverrides({
      hidden_criterion_types: isHidden
        ? [...current, value]
        : current.filter(v => v !== value),
    });
  };

  const handleAddMemoireSection = (item: ListItem) => {
    const current = overrides?.custom_memoire_sections || [];
    updateOverrides({
      custom_memoire_sections: [...current, item],
    });
  };

  const handleRemoveMemoireSection = (value: string) => {
    const current = overrides?.custom_memoire_sections || [];
    updateOverrides({
      custom_memoire_sections: current.filter(s => s.value !== value),
    });
  };

  const handleToggleMemoireSectionHidden = (value: string, isHidden: boolean) => {
    const current = overrides?.hidden_memoire_sections || [];
    updateOverrides({
      hidden_memoire_sections: isHidden
        ? [...current, value]
        : current.filter(v => v !== value),
    });
  };

  // Get specialty categories from the discipline config
  const specialtyCategories = Array.from(
    new Set(tenderConfig.teamSpecialties.map(s => s.category).filter(Boolean))
  ).map(cat => ({ value: cat!, label: cat! }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Configuration par discipline</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez les listes et options pour chaque discipline. 
          Les modifications s'appliquent uniquement à ce workspace.
        </p>
      </div>

      {/* Discipline Selector */}
      <div className="flex gap-2">
        {allDisciplines.map((d) => {
          const Icon = DISCIPLINE_ICONS[d.slug];
          const isActive = activeDiscipline === d.slug;
          const isPrimary = d.slug === workspaceDiscipline;

          return (
            <button
              key={d.slug}
              onClick={() => setActiveDiscipline(d.slug)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{d.shortName}</span>
              {isPrimary && (
                <Badge variant="secondary" className="text-[10px] h-4">
                  Principal
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Équipe</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="criteria" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Critères</span>
          </TabsTrigger>
          <TabsTrigger value="memoire" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Mémoire</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Spécialités d'équipe</CardTitle>
              <CardDescription>
                Définissez les spécialités disponibles lors de la composition d'une équipe pour un AO.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomizableListEditor
                title="Spécialités disponibles"
                baseItems={tenderConfig.teamSpecialties}
                customItems={overrides?.custom_team_specialties || []}
                hiddenItems={overrides?.hidden_team_specialties || []}
                onAddItem={handleAddSpecialty}
                onRemoveCustomItem={handleRemoveSpecialty}
                onToggleHidden={handleToggleSpecialtyHidden}
                showCategory
                categoryOptions={specialtyCategories}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents de candidature</CardTitle>
              <CardDescription>
                Documents attendus lors de la phase de candidature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomizableListEditor
                title="Types de documents"
                baseItems={tenderConfig.requiredDocuments.candidature.map(d => ({
                  value: d.value,
                  label: d.label,
                  mandatory: d.mandatory,
                }))}
                customItems={overrides?.custom_document_types?.candidature || []}
                hiddenItems={overrides?.hidden_document_types || []}
                onAddItem={handleAddCandidatureDoc}
                onRemoveCustomItem={handleRemoveCandidatureDoc}
                onToggleHidden={handleToggleDocHidden}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents d'offre</CardTitle>
              <CardDescription>
                Documents attendus lors de la phase d'offre.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomizableListEditor
                title="Types de documents"
                baseItems={tenderConfig.requiredDocuments.offre.map(d => ({
                  value: d.value,
                  label: d.label,
                  mandatory: d.mandatory,
                }))}
                customItems={overrides?.custom_document_types?.offre || []}
                hiddenItems={overrides?.hidden_document_types || []}
                onAddItem={handleAddOffreDoc}
                onRemoveCustomItem={handleRemoveOffreDoc}
                onToggleHidden={handleToggleDocHidden}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="criteria">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Types de critères</CardTitle>
              <CardDescription>
                Catégories de critères utilisés pour noter les offres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomizableListEditor
                title="Critères disponibles"
                baseItems={tenderConfig.criterionTypes}
                customItems={overrides?.custom_criterion_types || []}
                hiddenItems={overrides?.hidden_criterion_types || []}
                onAddItem={handleAddCriterion}
                onRemoveCustomItem={handleRemoveCriterion}
                onToggleHidden={handleToggleCriterionHidden}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memoire">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sections du mémoire technique</CardTitle>
              <CardDescription>
                Structure par défaut pour la rédaction du mémoire technique.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomizableListEditor
                title="Sections disponibles"
                baseItems={tenderConfig.memoireSections}
                customItems={overrides?.custom_memoire_sections || []}
                hiddenItems={overrides?.hidden_memoire_sections || []}
                onAddItem={handleAddMemoireSection}
                onRemoveCustomItem={handleRemoveMemoireSection}
                onToggleHidden={handleToggleMemoireSectionHidden}
                allowReorder
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}