import { useState } from "react";
import { CalendarDays, Check, ExternalLink, Link2, Loader2, RefreshCcw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CalendarProvider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  syncEnabled: boolean;
  lastSync?: string;
  calendarCount?: number;
}

const CALENDAR_PROVIDERS: CalendarProvider[] = [
  {
    id: "google",
    name: "Google Calendar",
    icon: "📅",
    connected: false,
    syncEnabled: false,
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    icon: "📆",
    connected: false,
    syncEnabled: false,
  },
  {
    id: "apple",
    name: "Apple Calendar",
    icon: "🍎",
    connected: false,
    syncEnabled: false,
  },
];

interface CalendarSyncPanelProps {
  trigger?: React.ReactNode;
}

export function CalendarSyncPanel({ trigger }: CalendarSyncPanelProps) {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<CalendarProvider[]>(CALENDAR_PROVIDERS);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: "15min",
    syncTasks: true,
    syncEvents: true,
    syncAbsences: true,
    bidirectional: false,
  });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = async (providerId: string) => {
    setIsConnecting(providerId);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId
            ? {
                ...p,
                connected: true,
                syncEnabled: true,
                lastSync: new Date().toISOString(),
                calendarCount: 2,
              }
            : p
        )
      );
      setIsConnecting(null);
      toast({
        title: "Calendrier connecté",
        description: `${providers.find((p) => p.id === providerId)?.name} a été connecté avec succès.`,
      });
    }, 2000);
  };

  const handleDisconnect = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, connected: false, syncEnabled: false, lastSync: undefined, calendarCount: undefined }
          : p
      )
    );
    toast({
      title: "Calendrier déconnecté",
      description: `La synchronisation a été désactivée.`,
    });
  };

  const handleSync = async (providerId: string) => {
    toast({
      title: "Synchronisation en cours",
      description: "Les événements sont en cours de synchronisation...",
    });
    
    setTimeout(() => {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId ? { ...p, lastSync: new Date().toISOString() } : p
        )
      );
      toast({
        title: "Synchronisation terminée",
        description: "Tous les événements ont été synchronisés.",
      });
    }, 1500);
  };

  const connectedCount = providers.filter((p) => p.connected).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Calendriers</span>
            {connectedCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {connectedCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Synchronisation calendriers
          </SheetTitle>
          <SheetDescription>
            Connectez vos calendriers externes pour synchroniser automatiquement vos événements.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Providers list */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Calendriers disponibles</h3>
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  provider.connected
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border"
                )}
              >
                <span className="text-2xl">{provider.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{provider.name}</span>
                    {provider.connected && (
                      <Badge variant="outline" className="text-[10px] px-1.5 h-4 bg-green-500/10 text-green-600 border-green-500/20">
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Connecté
                      </Badge>
                    )}
                  </div>
                  {provider.connected && provider.lastSync && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {provider.calendarCount} calendriers · Dernière sync:{" "}
                      {new Date(provider.lastSync).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
                {provider.connected ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSync(provider.id)}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDisconnect(provider.id)}
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleConnect(provider.id)}
                    disabled={isConnecting === provider.id}
                  >
                    {isConnecting === provider.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="h-3.5 w-3.5 mr-1.5" />
                        Connecter
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Sync settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Paramètres de synchronisation</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-sync" className="flex flex-col gap-0.5">
                  <span>Synchronisation automatique</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Synchroniser toutes les 15 minutes
                  </span>
                </Label>
                <Switch
                  id="auto-sync"
                  checked={syncSettings.autoSync}
                  onCheckedChange={(checked) =>
                    setSyncSettings((prev) => ({ ...prev, autoSync: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sync-tasks" className="flex flex-col gap-0.5">
                  <span>Synchroniser les tâches planifiées</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Ajouter les tâches comme événements
                  </span>
                </Label>
                <Switch
                  id="sync-tasks"
                  checked={syncSettings.syncTasks}
                  onCheckedChange={(checked) =>
                    setSyncSettings((prev) => ({ ...prev, syncTasks: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sync-events" className="flex flex-col gap-0.5">
                  <span>Synchroniser les événements</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Réunions, rendez-vous, milestones
                  </span>
                </Label>
                <Switch
                  id="sync-events"
                  checked={syncSettings.syncEvents}
                  onCheckedChange={(checked) =>
                    setSyncSettings((prev) => ({ ...prev, syncEvents: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sync-absences" className="flex flex-col gap-0.5">
                  <span>Synchroniser les absences</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Congés, maladie, télétravail
                  </span>
                </Label>
                <Switch
                  id="sync-absences"
                  checked={syncSettings.syncAbsences}
                  onCheckedChange={(checked) =>
                    setSyncSettings((prev) => ({ ...prev, syncAbsences: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="bidirectional" className="flex flex-col gap-0.5">
                  <span>Synchronisation bidirectionnelle</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Importer les événements externes (bientôt)
                  </span>
                </Label>
                <Switch
                  id="bidirectional"
                  checked={syncSettings.bidirectional}
                  onCheckedChange={(checked) =>
                    setSyncSettings((prev) => ({ ...prev, bidirectional: checked }))
                  }
                  disabled
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Help link */}
          <div className="text-center">
            <Button variant="link" size="sm" className="text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3 mr-1" />
              Documentation sur la synchronisation
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
