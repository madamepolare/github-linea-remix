import { MessageSquarePlus, PenLine } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFeedbackMode } from "@/hooks/useFeedbackMode";
import { useFeedbackEntries } from "@/hooks/useFeedbackEntries";

export function FeedbackSettings() {
  const { isEnabled, setEnabled } = useFeedbackMode();
  const { entries } = useFeedbackEntries();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Mode Feedback
                <Badge variant="outline" className="text-xs">Beta</Badge>
              </CardTitle>
              <CardDescription>
                Activez le mode feedback pour collecter les retours d'amélioration de l'interface
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="feedback-mode" className="text-base font-medium">
                Activer le mode feedback
              </Label>
              <p className="text-sm text-muted-foreground">
                Un bouton flottant apparaîtra en bas à droite de l'écran
              </p>
            </div>
            <Switch
              id="feedback-mode"
              checked={isEnabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {isEnabled && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Mode actif</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cliquez sur le bouton flottant pour ouvrir le panneau de feedback. 
                Chaque feedback enregistrera automatiquement la route/page actuelle.
              </p>
              {entries && entries.length > 0 && (
                <p className="text-sm">
                  <span className="font-medium">{entries.length}</span> feedback(s) collecté(s)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
