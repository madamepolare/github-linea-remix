import { useState } from 'react';
import { InspectorResult, Issue } from '@/hooks/usePageInspector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Copy, 
  Check, 
  ChevronDown, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Palette,
  Zap,
  Accessibility,
  Smartphone,
  MousePointer,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PageInspectorResultsProps {
  result: InspectorResult;
  onReanalyze: () => void;
  isAnalyzing: boolean;
}

const typeIcons: Record<Issue['type'], React.ReactNode> = {
  graphique: <Palette className="h-4 w-4" />,
  comportement: <Zap className="h-4 w-4" />,
  accessibilite: <Accessibility className="h-4 w-4" />,
  responsive: <Smartphone className="h-4 w-4" />,
  ux: <MousePointer className="h-4 w-4" />,
};

const typeLabels: Record<Issue['type'], string> = {
  graphique: 'Graphique',
  comportement: 'Comportement',
  accessibilite: 'Accessibilité',
  responsive: 'Responsive',
  ux: 'UX',
};

const severityConfig: Record<Issue['severity'], { icon: React.ReactNode; color: string; bgColor: string }> = {
  critique: { 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  important: { 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  mineur: { 
    icon: <Info className="h-4 w-4" />, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

function IssueCard({ issue }: { issue: Issue }) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const severity = severityConfig[issue.severity];

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(issue.lovablePrompt);
    setCopied(true);
    toast.success('Prompt copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn('border-l-4', severity.bgColor, 
        issue.severity === 'critique' && 'border-l-destructive',
        issue.severity === 'important' && 'border-l-amber-500',
        issue.severity === 'mineur' && 'border-l-muted-foreground'
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className={cn('mt-0.5', severity.color)}>
                  {severity.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium leading-tight">
                    {issue.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs gap-1 py-0">
                      {typeIcons[issue.type]}
                      {typeLabels[issue.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {issue.location}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                isOpen && 'rotate-180'
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {issue.description}
            </p>
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Prompt Lovable suggéré
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={copyPrompt}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm font-mono bg-background rounded px-2 py-1.5 border">
                {issue.lovablePrompt}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À améliorer';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${(score / 100) * 176} 176`}
            strokeLinecap="round"
            className={getScoreColor(score)}
          />
        </svg>
        <span className={cn(
          'absolute inset-0 flex items-center justify-center text-lg font-bold',
          getScoreColor(score)
        )}>
          {score}
        </span>
      </div>
      <div>
        <p className={cn('font-semibold', getScoreColor(score))}>
          {getScoreLabel(score)}
        </p>
        <p className="text-xs text-muted-foreground">
          Score global
        </p>
      </div>
    </div>
  );
}

export function PageInspectorResults({ result, onReanalyze, isAnalyzing }: PageInspectorResultsProps) {
  const criticalIssues = result.issues.filter(i => i.severity === 'critique');
  const importantIssues = result.issues.filter(i => i.severity === 'important');
  const minorIssues = result.issues.filter(i => i.severity === 'mineur');

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{result.pageName}</CardTitle>
              <CardDescription>
                Analysé le {new Date(result.analyzedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </CardDescription>
            </div>
            <ScoreGauge score={result.overallScore} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {criticalIssues.length} critique{criticalIssues.length > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                <AlertTriangle className="h-3 w-3" />
                {importantIssues.length} important{importantIssues.length > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Info className="h-3 w-3" />
                {minorIssues.length} mineur{minorIssues.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isAnalyzing && 'animate-spin')} />
              Réanalyser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues list */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Problèmes détectés ({result.issues.length})
        </h3>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {result.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Suggestions d'amélioration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
