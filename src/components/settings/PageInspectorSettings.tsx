import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzablePages, AnalyzablePage } from '@/config/analyzablePages';
import { usePageInspector } from '@/hooks/usePageInspector';
import { PageInspectorResults } from './PageInspectorResults';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ScanSearch, 
  ArrowRight, 
  Sparkles, 
  ChevronLeft,
  FileSearch,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function PageCard({ 
  page, 
  isSelected, 
  onClick 
}: { 
  page: AnalyzablePage; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all',
        'hover:border-primary/50 hover:bg-muted/50',
        isSelected && 'border-primary bg-primary/5 ring-1 ring-primary'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">{page.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {page.description}
          </p>
        </div>
        <ArrowRight className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          isSelected && 'text-primary translate-x-1'
        )} />
      </div>
    </button>
  );
}

function AnalysisLoadingState() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PageInspectorSettings() {
  const { t } = useTranslation();
  const [selectedPage, setSelectedPage] = useState<AnalyzablePage | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const { isAnalyzing, result, error, analyzePage, clearResult } = usePageInspector();

  const handleAnalyze = () => {
    if (selectedPage) {
      analyzePage(selectedPage, additionalContext || undefined);
    }
  };

  const handleBack = () => {
    setSelectedPage(null);
    clearResult();
    setAdditionalContext('');
  };

  // Show results view
  if (result && selectedPage) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <PageInspectorResults 
          result={result} 
          onReanalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
      </div>
    );
  }

  // Show loading state
  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
          disabled
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <div>
            <p className="font-medium text-sm">Analyse en cours...</p>
            <p className="text-xs text-muted-foreground">
              L'IA analyse "{selectedPage?.name}" pour détecter les problèmes UI/UX
            </p>
          </div>
        </div>
        <AnalysisLoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ScanSearch className="h-5 w-5" />
          Inspecteur IA de Pages
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Analysez vos pages pour détecter les incohérences graphiques et les comportements manquants.
          L'IA génère des prompts Lovable pour corriger chaque problème.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Page selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Sélectionner une page
            </CardTitle>
            <CardDescription>
              Choisissez la page que vous souhaitez analyser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {analyzablePages.map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    isSelected={selectedPage?.id === page.id}
                    onClick={() => setSelectedPage(page)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Analysis config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Configuration de l'analyse
            </CardTitle>
            <CardDescription>
              {selectedPage 
                ? `Prêt à analyser "${selectedPage.name}"`
                : 'Sélectionnez une page pour commencer'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPage && (
              <>
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">{selectedPage.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPage.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedPage.expectedFeatures.slice(0, 3).map((feature, i) => (
                      <span 
                        key={i}
                        className="text-xs bg-background px-2 py-0.5 rounded border"
                      >
                        {feature}
                      </span>
                    ))}
                    {selectedPage.expectedFeatures.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{selectedPage.expectedFeatures.length - 3} autres
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Contexte additionnel (optionnel)</Label>
                  <Textarea
                    id="context"
                    placeholder="Ex: Focus sur les états de chargement, vérifier la cohérence des boutons..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ajoutez des détails spécifiques pour orienter l'analyse
                  </p>
                </div>
              </>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!selectedPage || isAnalyzing}
              className="w-full gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" />
                  Lancer l'analyse IA
                </>
              )}
            </Button>

            {error && (
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Comment ça fonctionne ?</h4>
              <p className="text-sm text-muted-foreground">
                L'inspecteur IA analyse chaque page selon des critères de cohérence graphique, 
                comportements attendus, accessibilité et UX. Pour chaque problème détecté, 
                un prompt Lovable est généré pour vous permettre de corriger rapidement l'issue.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
