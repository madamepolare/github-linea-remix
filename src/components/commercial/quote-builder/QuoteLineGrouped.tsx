import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp,
  Folder,
  FolderOpen,
  Trash2,
  GripVertical
} from 'lucide-react';
import { QuoteLine, LINE_TYPE_COLORS } from '@/types/quoteTypes';

interface QuoteLineGroupedProps {
  group: QuoteLine;
  childLines: QuoteLine[];
  onUpdateGroup: (id: string, updates: Partial<QuoteLine>) => void;
  onDeleteGroup: (id: string) => void;
  formatCurrency: (value: number) => string;
  dragHandleProps?: {
    onDragStart: () => void;
    onDragEnd: () => void;
  };
}

export function QuoteLineGrouped({
  group,
  childLines,
  onUpdateGroup,
  onDeleteGroup,
  formatCurrency,
  dragHandleProps
}: QuoteLineGroupedProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate group subtotal
  const groupSubtotal = useMemo(() => {
    return childLines
      .filter(l => l.is_included && l.line_type !== 'discount')
      .reduce((sum, l) => sum + (l.amount || 0), 0);
  }, [childLines]);

  const discountTotal = useMemo(() => {
    return childLines
      .filter(l => l.line_type === 'discount')
      .reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  }, [childLines]);

  const netGroupTotal = groupSubtotal - discountTotal;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={`border-2 rounded-lg ${LINE_TYPE_COLORS.group} transition-all`}>
        {/* Group header */}
        <div className="flex items-center gap-2 p-3 bg-muted/30">
          <div 
            className="cursor-grab shrink-0 p-1"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="p-1.5 rounded shrink-0 bg-slate-500/20">
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-slate-600" />
            ) : (
              <Folder className="h-4 w-4 text-slate-600" />
            )}
          </div>

          <Input
            value={group.phase_name}
            onChange={(e) => onUpdateGroup(group.id, { phase_name: e.target.value })}
            className="flex-1 h-9 font-medium"
            placeholder="Nom du groupe..."
          />

          <Badge variant="secondary" className="shrink-0">
            {childLines.length} ligne{childLines.length > 1 ? 's' : ''}
          </Badge>

          <div className="text-sm font-medium shrink-0 min-w-[100px] text-right">
            {formatCurrency(netGroupTotal)}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={() => onDeleteGroup(group.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Group content */}
        <CollapsibleContent>
          <div className="p-3 pt-0 space-y-2">
            {/* Child lines placeholder - actual lines are rendered outside */}
            {childLines.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Glissez des lignes dans ce groupe
              </div>
            )}

            {/* Group subtotal footer */}
            {childLines.length > 0 && (
              <Card className="mt-2 bg-slate-50">
                <CardContent className="py-2 px-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">
                      Sous-total {group.phase_name || 'groupe'}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(netGroupTotal)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
