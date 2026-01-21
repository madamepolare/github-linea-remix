import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, parseISO, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameMonth, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Upload, GraduationCap, Building, Calendar, Loader2, Trash2, Check, X, Sparkles, FileText } from "lucide-react";

interface ApprenticeSchedule {
  id: string;
  user_id: string;
  workspace_id: string;
  schedule_name: string;
  start_date: string;
  end_date: string;
  pattern_type: string;
  custom_pattern: { school_dates?: string[] } | null;
  pdf_url: string | null;
  pdf_filename: string | null;
}

interface ParsedPeriod {
  start_date: string;
  end_date: string;
  type: "school" | "company";
  label?: string;
}

interface ApprenticeCalendarTabProps {
  userId: string;
  userName: string;
}

export function ApprenticeCalendarTab({ userId, userName }: ApprenticeCalendarTabProps) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedDates, setParsedDates] = useState<string[]>([]);
  const [parsedPeriods, setParsedPeriods] = useState<ParsedPeriod[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [scheduleName, setScheduleName] = useState("Planning alternance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch existing schedule
  const { data: existingSchedule, isLoading } = useQuery({
    queryKey: ["apprentice-schedule", activeWorkspace?.id, userId],
    queryFn: async (): Promise<ApprenticeSchedule | null> => {
      if (!activeWorkspace) return null;

      const { data, error } = await supabase
        .from("apprentice_schedules")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ApprenticeSchedule | null;
    },
    enabled: !!activeWorkspace,
  });

  // Get existing school dates
  const existingSchoolDates = useMemo(() => {
    if (!existingSchedule?.custom_pattern) return [];
    return (existingSchedule.custom_pattern as { school_dates?: string[] }).school_dates || [];
  }, [existingSchedule]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;

    if (!file.type.includes("pdf")) {
      toast.error("Veuillez sélectionner un fichier PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10 Mo");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("apprentice-calendars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      toast.success("Calendrier téléchargé, analyse en cours...");
      
      // Now parse the calendar
      await parseCalendar(fileName, file.name);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
    }
  };

  // Parse calendar with AI
  const parseCalendar = async (filePath: string, fileName: string) => {
    if (!activeWorkspace) return;
    
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-school-calendar", {
        body: {
          file_path: filePath,
          workspace_id: activeWorkspace.id,
          user_id: userId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Store parsed results for validation
      setParsedDates(data.school_dates || []);
      setParsedPeriods(data.school_periods || []);
      setShowValidation(true);

      // Set date range from parsed data
      if (data.school_dates?.length > 0) {
        const dates = data.school_dates.sort();
        setStartDate(dates[0]);
        setEndDate(dates[dates.length - 1]);
      }

      toast.success(`${data.total_school_days} jours d'école détectés`);

    } catch (error: any) {
      console.error("Parse error:", error);
      toast.error("Erreur lors de l'analyse du calendrier");
    } finally {
      setParsing(false);
    }
  };

  // Toggle a date in parsed dates
  const toggleDate = (date: string) => {
    setParsedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  };

  // Save validated schedule
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const scheduleData = {
        workspace_id: activeWorkspace.id,
        user_id: userId,
        created_by: user.id,
        schedule_name: scheduleName,
        start_date: startDate,
        end_date: endDate,
        pattern_type: "custom",
        school_days_per_week: null,
        company_days_per_week: null,
        custom_pattern: { school_dates: parsedDates },
      };

      if (existingSchedule) {
        const { error } = await supabase
          .from("apprentice_schedules")
          .update(scheduleData)
          .eq("id", existingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("apprentice_schedules")
          .insert(scheduleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["team-absences"] });
      setShowValidation(false);
      toast.success("Planning alternance enregistré");
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  // Delete schedule
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingSchedule) return;
      const { error } = await supabase
        .from("apprentice_schedules")
        .delete()
        .eq("id", existingSchedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["team-absences"] });
      toast.success("Planning supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  // Generate calendar view for validation
  const calendarMonths = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    try {
      return eachMonthOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      });
    } catch {
      return [];
    }
  }, [startDate, endDate]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Planning Alternance</h3>
        </div>
        {existingSchedule && !showValidation && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        )}
      </div>

      {/* Existing schedule display */}
      {existingSchedule && !showValidation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {existingSchedule.schedule_name}
            </CardTitle>
            <CardDescription>
              Du {format(parseISO(existingSchedule.start_date), "d MMMM yyyy", { locale: fr })} au{" "}
              {format(parseISO(existingSchedule.end_date), "d MMMM yyyy", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <GraduationCap className="h-3 w-3" />
                {existingSchoolDates.length} jours école
              </Badge>
              {existingSchedule.pdf_filename && (
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {existingSchedule.pdf_filename}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload section */}
      {!showValidation && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h4 className="font-medium mb-1">
                  {existingSchedule ? "Mettre à jour le calendrier" : "Importer le calendrier école"}
                </h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Téléchargez le PDF du calendrier de l'école. L'IA analysera automatiquement les périodes école/entreprise.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading || parsing}
                  className="hidden"
                  id="calendar-upload"
                />
                <Button
                  asChild
                  disabled={uploading || parsing}
                >
                  <label htmlFor="calendar-upload" className="cursor-pointer">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Téléchargement...
                      </>
                    ) : parsing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse IA...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Sélectionner un PDF
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation section */}
      {showValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Valider les dates détectées
            </CardTitle>
            <CardDescription>
              Vérifiez et corrigez les jours d'école détectés par l'IA. Cliquez sur un jour pour le modifier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Schedule name and dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nom du planning</Label>
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Planning alternance"
                />
              </div>
              <div className="space-y-2">
                <Label>Début</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{parsedDates.length} jours école</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Cliquez sur les jours pour ajouter/retirer
              </div>
            </div>

            {/* Calendar grid */}
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {calendarMonths.map((month) => {
                  const monthStart = startOfMonth(month);
                  const monthEnd = endOfMonth(month);
                  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

                  return (
                    <div key={month.toISOString()} className="border rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-2 capitalize">
                        {format(month, "MMMM yyyy", { locale: fr })}
                      </h5>
                      <div className="grid grid-cols-7 gap-0.5 text-xs">
                        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                          <div key={i} className="text-center text-muted-foreground font-medium py-1">
                            {d}
                          </div>
                        ))}
                        {/* Empty cells for offset */}
                        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {days.map((day) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const isSchool = parsedDates.includes(dateStr);
                          const isWeekendDay = isWeekend(day);

                          return (
                            <button
                              key={dateStr}
                              onClick={() => !isWeekendDay && toggleDate(dateStr)}
                              disabled={isWeekendDay}
                              className={`
                                aspect-square flex items-center justify-center rounded text-xs
                                transition-colors
                                ${isWeekendDay 
                                  ? "text-muted-foreground/30 cursor-not-allowed" 
                                  : isSchool
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "hover:bg-muted"
                                }
                              `}
                            >
                              {format(day, "d")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowValidation(false);
                  setParsedDates([]);
                  setParsedPeriods([]);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <div className="flex-1" />
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={parsedDates.length === 0 || !startDate || !endDate || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Valider et enregistrer
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
