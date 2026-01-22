import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ArrowRight,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { format, addWeeks, addMonths, differenceInWeeks, differenceInDays, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface QuotePlanningTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  lines: QuoteLine[];
  onLinesChange: (lines: QuoteLine[]) => void;
  isLocked?: boolean;
}

export function QuotePlanningTab({ 
  document, 
  onDocumentChange, 
  lines, 
  onLinesChange,
  isLocked = false 
}: QuotePlanningTabProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    // Try to get from first phase line
    const firstPhase = lines.find(l => l.line_type === 'phase' && l.start_date);
    if (firstPhase?.start_date) {
      const parsed = parseISO(firstPhase.start_date);
      return isValid(parsed) ? parsed : undefined;
    }
    return undefined;
  });

  // Get phase lines
  const phaseLines = useMemo(() => 
    lines.filter(l => l.line_type === 'phase' || l.phase_code),
    [lines]
  );

  // Calculate durations based on percentages and total duration
  const [totalDurationWeeks, setTotalDurationWeeks] = useState(24);

  const calculatePhaseDates = () => {
    if (!startDate) return;

    let currentDate = startDate;
    const updatedLines = lines.map(line => {
      if (line.line_type !== 'phase' && !line.phase_code) return line;

      const percentage = line.percentage_fee || 0;
      const durationWeeks = Math.round((percentage / 100) * totalDurationWeeks);
      const phaseStartDate = currentDate;
      const phaseEndDate = addWeeks(currentDate, durationWeeks);
      
      currentDate = phaseEndDate;

      return {
        ...line,
        start_date: format(phaseStartDate, 'yyyy-MM-dd'),
        end_date: format(phaseEndDate, 'yyyy-MM-dd')
      };
    });

    onLinesChange(updatedLines);
  };

  const handlePhaseStartChange = (lineId: string, date: Date | undefined) => {
    if (!date) return;
    
    onLinesChange(lines.map(l => {
      if (l.id !== lineId) return l;
      
      // Keep the same duration
      const currentStart = l.start_date ? parseISO(l.start_date) : null;
      const currentEnd = l.end_date ? parseISO(l.end_date) : null;
      let duration = 4; // default 4 weeks
      
      if (currentStart && currentEnd && isValid(currentStart) && isValid(currentEnd)) {
        duration = differenceInWeeks(currentEnd, currentStart);
      }
      
      return {
        ...l,
        start_date: format(date, 'yyyy-MM-dd'),
        end_date: format(addWeeks(date, duration), 'yyyy-MM-dd')
      };
    }));
  };

  const handlePhaseEndChange = (lineId: string, date: Date | undefined) => {
    if (!date) return;
    
    onLinesChange(lines.map(l => 
      l.id === lineId ? { ...l, end_date: format(date, 'yyyy-MM-dd') } : l
    ));
  };

  const formatDuration = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) return '-';
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (!isValid(startDate) || !isValid(endDate)) return '-';
    
    const weeks = differenceInWeeks(endDate, startDate);
    if (weeks >= 4) {
      return `${Math.round(weeks / 4)} mois`;
    }
    return `${weeks} sem.`;
  };

  // Calculate project timeline
  const projectDates = useMemo(() => {
    const allDates = phaseLines
      .flatMap(l => [l.start_date, l.end_date])
      .filter(Boolean)
      .map(d => parseISO(d!))
      .filter(isValid);
    
    if (allDates.length === 0) return null;
    
    const start = new Date(Math.min(...allDates.map(d => d.getTime())));
    const end = new Date(Math.max(...allDates.map(d => d.getTime())));
    const totalDays = differenceInDays(end, start);
    
    return { start, end, totalDays };
  }, [phaseLines]);

  return (
    <div className="space-y-6">
      {/* Project Timeline Setup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Configuration du planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date de démarrage</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: fr }) : 'Sélectionner...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Durée totale (semaines)</Label>
              <Input
                type="number"
                value={totalDurationWeeks}
                onChange={(e) => setTotalDurationWeeks(parseInt(e.target.value) || 24)}
                min={4}
                step={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="opacity-0">Action</Label>
              <Button 
                onClick={calculatePhaseDates}
                disabled={!startDate}
                className="w-full"
              >
                Calculer les dates
              </Button>
            </div>
          </div>

          {projectDates && (
            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">Période du projet</span>
                  <div className="flex items-center gap-2 font-medium">
                    <span>{format(projectDates.start, 'dd MMM yyyy', { locale: fr })}</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>{format(projectDates.end, 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                </div>
                <Badge variant="outline">
                  {Math.ceil(projectDates.totalDays / 30)} mois
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Planning des phases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phaseLines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune phase définie</p>
              <p className="text-sm">Configurez d'abord les phases dans l'onglet Honoraires</p>
            </div>
          ) : (
            <div className="space-y-2">
              {phaseLines.map((line, index) => {
                const startDateValue = line.start_date ? parseISO(line.start_date) : undefined;
                const endDateValue = line.end_date ? parseISO(line.end_date) : undefined;
                const hasValidDates = startDateValue && endDateValue && isValid(startDateValue) && isValid(endDateValue);
                
                return (
                  <div 
                    key={line.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 w-8 text-muted-foreground">
                      <GripVertical className="h-4 w-4 cursor-grab" />
                    </div>
                    
                    <Badge variant="outline" className="w-16 justify-center font-mono">
                      {line.phase_code}
                    </Badge>
                    
                    <div className="flex-1 font-medium">
                      {line.phase_name}
                    </div>

                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-32",
                              !startDateValue && "text-muted-foreground"
                            )}
                          >
                            {startDateValue && isValid(startDateValue)
                              ? format(startDateValue, 'dd/MM/yy')
                              : 'Début'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDateValue}
                            onSelect={(d) => handlePhaseStartChange(line.id, d)}
                            locale={fr}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <ArrowRight className="h-4 w-4 text-muted-foreground" />

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-32",
                              !endDateValue && "text-muted-foreground"
                            )}
                          >
                            {endDateValue && isValid(endDateValue)
                              ? format(endDateValue, 'dd/MM/yy')
                              : 'Fin'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDateValue}
                            onSelect={(d) => handlePhaseEndChange(line.id, d)}
                            locale={fr}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Badge variant="secondary" className="w-20 justify-center">
                        {formatDuration(line.start_date, line.end_date)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Timeline (Gantt-like) */}
      {projectDates && phaseLines.some(l => l.start_date && l.end_date) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vue chronologique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {phaseLines.map((line) => {
                if (!line.start_date || !line.end_date || !projectDates) return null;
                
                const lineStart = parseISO(line.start_date);
                const lineEnd = parseISO(line.end_date);
                
                if (!isValid(lineStart) || !isValid(lineEnd)) return null;
                
                const startOffset = differenceInDays(lineStart, projectDates.start);
                const duration = differenceInDays(lineEnd, lineStart);
                const leftPercent = (startOffset / projectDates.totalDays) * 100;
                const widthPercent = (duration / projectDates.totalDays) * 100;

                return (
                  <div key={line.id} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-muted-foreground truncate">
                      {line.phase_code}
                    </div>
                    <div className="flex-1 h-6 bg-muted rounded relative">
                      <div
                        className="absolute h-full bg-primary/80 rounded flex items-center justify-center"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 2)}%`
                        }}
                      >
                        {widthPercent > 15 && (
                          <span className="text-xs text-primary-foreground font-medium truncate px-1">
                            {line.phase_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}