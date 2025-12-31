import { useState, useEffect, useRef } from "react";
import { useTaskTimeEntries } from "@/hooks/useTaskTimeEntries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskTimeTrackerProps {
  taskId: string;
}

export function TaskTimeTracker({ taskId }: TaskTimeTrackerProps) {
  const { timeEntries, totalHours, createTimeEntry } = useTaskTimeEntries(taskId);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState("");
  const [description, setDescription] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setIsRunning(true);
    startTimeRef.current = new Date();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);

    if (elapsedSeconds >= 60) {
      const minutes = Math.round(elapsedSeconds / 60);
      await createTimeEntry.mutateAsync({
        duration_minutes: minutes,
        date: new Date().toISOString().split("T")[0],
        description: description || undefined,
        started_at: startTimeRef.current?.toISOString(),
        ended_at: new Date().toISOString(),
      });
      setDescription("");
    }

    setElapsedSeconds(0);
    startTimeRef.current = null;
  };

  const handleManualEntry = async () => {
    const minutes = parseInt(manualMinutes);
    if (isNaN(minutes) || minutes <= 0) return;

    await createTimeEntry.mutateAsync({
      duration_minutes: minutes,
      date: new Date().toISOString().split("T")[0],
      description: description || undefined,
    });

    setManualMinutes("");
    setDescription("");
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Total Time Display */}
      <div className="p-4 rounded-lg bg-muted/50 text-center">
        <p className="text-3xl font-semibold tabular-nums">{totalHours}h</p>
        <p className="text-sm text-muted-foreground">Temps total enregistré</p>
      </div>

      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">
            <Play className="h-3 w-3 mr-1" />
            Chronomètre
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Plus className="h-3 w-3 mr-1" />
            Saisie manuelle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-4">
          {/* Timer Display */}
          <div className="text-center py-4">
            <p
              className={cn(
                "text-4xl font-mono tabular-nums",
                isRunning && "text-primary"
              )}
            >
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Que faites-vous ?"
              disabled={isRunning}
            />
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center">
            {!isRunning ? (
              <Button onClick={startTimer} size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Démarrer
              </Button>
            ) : (
              <Button onClick={stopTimer} size="lg" variant="destructive" className="gap-2">
                <Pause className="h-5 w-5" />
                Arrêter et enregistrer
              </Button>
            )}
          </div>

          {isRunning && (
            <p className="text-center text-sm text-muted-foreground">
              Le temps sera enregistré lorsque vous arrêterez le chronomètre
            </p>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Heures équivalentes</Label>
              <p className="text-2xl font-semibold pt-1">
                {manualMinutes ? (parseInt(manualMinutes) / 60).toFixed(1) : "0"}h
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Travail effectué..."
            />
          </div>

          <Button
            onClick={handleManualEntry}
            disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
            className="w-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </TabsContent>
      </Tabs>

      {/* Recent Time Entries */}
      {timeEntries && timeEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Entrées récentes</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {timeEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}min
                  </span>
                  {entry.description && (
                    <span className="text-muted-foreground ml-2">- {entry.description}</span>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">{entry.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
