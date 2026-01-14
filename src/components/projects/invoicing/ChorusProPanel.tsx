import { useState } from "react";
import { useChorusProConfig, useChorusSubmissions, useSaveChorusConfig, useSubmitToChorus } from "@/hooks/useChorusPro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Settings,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChorusProPanelProps {
  invoiceId?: string;
  onSubmit?: () => void;
}

const CHORUS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  not_submitted: { label: "Non soumise", color: "bg-muted text-muted-foreground", icon: Clock },
  pending: { label: "En cours", color: "bg-amber-100 text-amber-700", icon: Loader2 },
  submitted: { label: "Soumise", color: "bg-blue-100 text-blue-700", icon: Send },
  accepted: { label: "Acceptée", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  rejected: { label: "Rejetée", color: "bg-destructive/10 text-destructive", icon: XCircle },
  paid: { label: "Payée", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
};

export function ChorusProPanel({ invoiceId, onSubmit }: ChorusProPanelProps) {
  const { data: config, isLoading: configLoading } = useChorusProConfig();
  const { data: submissions = [] } = useChorusSubmissions(invoiceId);
  const saveConfig = useSaveChorusConfig();
  const submitToChorus = useSubmitToChorus();

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    siret: "",
    chorus_login: "",
    technical_id: "",
    service_code_default: "",
    is_sandbox: true,
  });

  const latestSubmission = submissions[0];
  const statusConfig = latestSubmission 
    ? CHORUS_STATUS_CONFIG[latestSubmission.status] || CHORUS_STATUS_CONFIG.not_submitted
    : CHORUS_STATUS_CONFIG.not_submitted;
  const StatusIcon = statusConfig.icon;

  const handleOpenConfig = () => {
    if (config) {
      setFormData({
        siret: config.siret || "",
        chorus_login: config.chorus_login || "",
        technical_id: config.technical_id || "",
        service_code_default: config.service_code_default || "",
        is_sandbox: config.is_sandbox,
      });
    }
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    await saveConfig.mutateAsync({
      siret: formData.siret,
      chorus_login: formData.chorus_login || null,
      technical_id: formData.technical_id || null,
      service_code_default: formData.service_code_default || null,
      is_sandbox: formData.is_sandbox,
    });
    setConfigDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!invoiceId) return;
    await submitToChorus.mutateAsync(invoiceId);
    onSubmit?.();
  };

  if (configLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Chorus Pro</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleOpenConfig}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Dépôt de factures pour le secteur public
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config?.is_active ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Chorus Pro n'est pas configuré pour ce workspace.
              </p>
              <Button variant="outline" onClick={handleOpenConfig}>
                <Settings className="h-4 w-4 mr-2" />
                Configurer
              </Button>
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge className={cn("text-xs", statusConfig.color)}>
                  <StatusIcon className={cn("h-3 w-3 mr-1", latestSubmission?.status === 'pending' && "animate-spin")} />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Last submission info */}
              {latestSubmission && (
                <div className="space-y-2 text-sm">
                  {latestSubmission.submitted_at && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Soumise le</span>
                      <span>{format(new Date(latestSubmission.submitted_at), "d MMM yyyy HH:mm", { locale: fr })}</span>
                    </div>
                  )}
                  {latestSubmission.submission_id && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>ID Chorus</span>
                      <span className="font-mono text-xs">{latestSubmission.submission_id}</span>
                    </div>
                  )}
                  {latestSubmission.error_message && (
                    <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
                      {latestSubmission.error_message}
                    </div>
                  )}
                </div>
              )}

              {/* Submit button */}
              {invoiceId && (!latestSubmission || latestSubmission.status === 'rejected') && (
                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={submitToChorus.isPending}
                >
                  {submitToChorus.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Déposer sur Chorus Pro
                </Button>
              )}

              {/* Link to Chorus Pro */}
              <Button variant="outline" className="w-full" asChild>
                <a href="https://chorus-pro.gouv.fr" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Accéder à Chorus Pro
                </a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuration Chorus Pro</DialogTitle>
            <DialogDescription>
              Configurez vos identifiants pour le dépôt automatique des factures.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>SIRET *</Label>
              <Input
                placeholder="12345678901234"
                value={formData.siret}
                onChange={(e) => setFormData(prev => ({ ...prev, siret: e.target.value }))}
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label>Login Chorus Pro</Label>
              <Input
                placeholder="votre.email@entreprise.fr"
                value={formData.chorus_login}
                onChange={(e) => setFormData(prev => ({ ...prev, chorus_login: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>ID Technique (API PISTE)</Label>
              <Input
                placeholder="ID technique pour l'API"
                value={formData.technical_id}
                onChange={(e) => setFormData(prev => ({ ...prev, technical_id: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Code service par défaut</Label>
              <Input
                placeholder="SERVICE_CODE"
                value={formData.service_code_default}
                onChange={(e) => setFormData(prev => ({ ...prev, service_code_default: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode sandbox</Label>
                <p className="text-xs text-muted-foreground">
                  Utiliser l'environnement de test Chorus Pro
                </p>
              </div>
              <Switch
                checked={formData.is_sandbox}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sandbox: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={!formData.siret || saveConfig.isPending}
            >
              {saveConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
