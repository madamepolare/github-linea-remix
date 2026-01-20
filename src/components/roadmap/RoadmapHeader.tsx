import { Map, Lightbulb, Rocket, CheckCircle2, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RoadmapHeaderProps {
  deliveredCount: number;
  inProgressCount: number;
  plannedCount: number;
  ideasCount: number;
  onSubmitIdea: () => void;
}

export function RoadmapHeader({
  deliveredCount,
  inProgressCount,
  plannedCount,
  ideasCount,
  onSubmitIdea,
}: RoadmapHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Roadmap</h1>
              <p className="text-sm text-muted-foreground">
                Suivez l'évolution de Linea et proposez vos idées
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onSubmitIdea} className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Proposer une idée
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{deliveredCount}</p>
            <p className="text-xs text-muted-foreground">Livrés</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <Target className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{plannedCount}</p>
            <p className="text-xs text-muted-foreground">Planifiés</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Lightbulb className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{ideasCount}</p>
            <p className="text-xs text-muted-foreground">Idées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
