import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { History, GitCompare, Clock, User, ChevronRight, Plus, Minus, Equal, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Version {
  id: string;
  version_number: number;
  notes: string | null;
  attendees: any[] | null;
  created_at: string;
  created_by: string | null;
}

interface VersionHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  currentNotes: string | null;
  currentAttendees: any[] | null;
  onRestore?: (notes: string | null, attendees: any[] | null) => void;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];
  
  // Simple line-by-line diff
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    
    if (oldLine === undefined && newLine !== undefined) {
      result.push({ type: "added", content: newLine });
    } else if (newLine === undefined && oldLine !== undefined) {
      result.push({ type: "removed", content: oldLine });
    } else if (oldLine !== newLine) {
      if (oldLine) result.push({ type: "removed", content: oldLine });
      if (newLine) result.push({ type: "added", content: newLine });
    } else {
      result.push({ type: "unchanged", content: oldLine || "" });
    }
  }
  
  return result;
}

function computeAttendeeDiff(oldAttendees: any[], newAttendees: any[]): { added: string[]; removed: string[]; unchanged: string[] } {
  const oldNames = new Set(oldAttendees.map(a => a.name));
  const newNames = new Set(newAttendees.map(a => a.name));
  
  const added = [...newNames].filter(n => !oldNames.has(n));
  const removed = [...oldNames].filter(n => !newNames.has(n));
  const unchanged = [...oldNames].filter(n => newNames.has(n));
  
  return { added, removed, unchanged };
}

export function VersionHistorySheet({
  open,
  onOpenChange,
  meetingId,
  currentNotes,
  currentAttendees,
  onRestore,
}: VersionHistorySheetProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareWithId, setCompareWithId] = useState<string | null>(null);

  const handleRestore = (version: Version) => {
    if (!onRestore) return;
    onRestore(version.notes, version.attendees);
    toast.success(`Version ${version.version_number} restaurée`);
    onOpenChange(false);
  };

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["meeting-versions", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_report_versions")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data as Version[];
    },
    enabled: open && !!meetingId,
  });

  const selectedVersion = useMemo(() => {
    if (!selectedVersionId) return null;
    return versions.find(v => v.id === selectedVersionId) || null;
  }, [selectedVersionId, versions]);

  const compareWithVersion = useMemo(() => {
    if (!compareWithId) return null;
    if (compareWithId === "current") {
      return {
        id: "current",
        version_number: (versions[0]?.version_number || 0) + 1,
        notes: currentNotes,
        attendees: currentAttendees,
        created_at: new Date().toISOString(),
        created_by: null,
      };
    }
    return versions.find(v => v.id === compareWithId) || null;
  }, [compareWithId, versions, currentNotes, currentAttendees]);

  const notesDiff = useMemo(() => {
    if (!selectedVersion || !compareWithVersion) return [];
    return computeDiff(
      selectedVersion.notes || "",
      compareWithVersion.notes || ""
    );
  }, [selectedVersion, compareWithVersion]);

  const attendeesDiff = useMemo(() => {
    if (!selectedVersion || !compareWithVersion) return { added: [], removed: [], unchanged: [] };
    return computeAttendeeDiff(
      selectedVersion.attendees || [],
      compareWithVersion.attendees || []
    );
  }, [selectedVersion, compareWithVersion]);

  const handleSelectVersion = (versionId: string) => {
    if (selectedVersionId === versionId) {
      setSelectedVersionId(null);
      setCompareWithId(null);
    } else if (!selectedVersionId) {
      setSelectedVersionId(versionId);
    } else if (!compareWithId) {
      setCompareWithId(versionId);
    } else {
      setSelectedVersionId(versionId);
      setCompareWithId(null);
    }
  };

  const hasChanges = notesDiff.some(d => d.type !== "unchanged") ||
    attendeesDiff.added.length > 0 ||
    attendeesDiff.removed.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des versions
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Version list */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Sélectionnez 2 versions pour comparer
            </div>
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-2 space-y-1">
                {/* Current version */}
                <button
                  onClick={() => handleSelectVersion("current")}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md text-left text-sm transition-colors",
                    (selectedVersionId === "current" || compareWithId === "current")
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">Actuel</Badge>
                    <span className="font-medium">Version actuelle</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </span>
                </button>

                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors",
                      (selectedVersionId === version.id || compareWithId === version.id)
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted"
                    )}
                  >
                    <button
                      onClick={() => handleSelectVersion(version.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <Badge variant="secondary" className="text-xs">
                        v{version.version_number}
                      </Badge>
                      <span>Version {version.version_number}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(version.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </span>
                    </button>
                    {onRestore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version);
                        }}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restaurer
                      </Button>
                    )}
                  </div>
                ))}

                {versions.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Aucune version sauvegardée
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Comparison view */}
          {selectedVersion && compareWithVersion && (
            <div className="space-y-4">
              <Separator />
              
              <div className="flex items-center justify-center gap-2 text-sm">
                <Badge variant="outline">v{selectedVersion.version_number}</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">
                  {compareWithVersion.id === "current" ? "Actuel" : `v${compareWithVersion.version_number}`}
                </Badge>
              </div>

              {!hasChanges ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <Equal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucune différence détectée
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {/* Notes diff */}
                    {notesDiff.some(d => d.type !== "unchanged") && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Notes</div>
                        <div className="border rounded-lg overflow-hidden font-mono text-xs">
                          {notesDiff.map((line, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "px-3 py-1 border-b last:border-b-0",
                                line.type === "added" && "bg-green-500/10 text-green-700 dark:text-green-400",
                                line.type === "removed" && "bg-red-500/10 text-red-700 dark:text-red-400 line-through",
                                line.type === "unchanged" && "text-muted-foreground"
                              )}
                            >
                              <span className="inline-block w-4 mr-2">
                                {line.type === "added" && <Plus className="h-3 w-3" />}
                                {line.type === "removed" && <Minus className="h-3 w-3" />}
                              </span>
                              {line.content || " "}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attendees diff */}
                    {(attendeesDiff.added.length > 0 || attendeesDiff.removed.length > 0) && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Participants</div>
                        <div className="border rounded-lg p-3 space-y-2">
                          {attendeesDiff.added.map((name, idx) => (
                            <div key={`add-${idx}`} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Plus className="h-3 w-3" />
                              {name}
                            </div>
                          ))}
                          {attendeesDiff.removed.map((name, idx) => (
                            <div key={`rem-${idx}`} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 line-through">
                              <Minus className="h-3 w-3" />
                              {name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Help text */}
          {!selectedVersionId && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <GitCompare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Cliquez sur une version pour commencer la comparaison
            </div>
          )}

          {selectedVersionId && !compareWithId && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Sélectionnez une deuxième version pour voir les différences
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
