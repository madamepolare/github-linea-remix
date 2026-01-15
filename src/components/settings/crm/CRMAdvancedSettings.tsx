import { CRMResetSection } from "../CRMResetSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function CRMAdvancedSettings() {
  return (
    <div className="space-y-6">
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Zone de danger</AlertTitle>
        <AlertDescription>
          Les actions ci-dessous peuvent affecter vos données CRM de manière irréversible. 
          Utilisez-les avec précaution.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Réinitialisation</CardTitle>
              <CardDescription>
                Restaurer les paramètres CRM par défaut
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CRMResetSection />
        </CardContent>
      </Card>
    </div>
  );
}
