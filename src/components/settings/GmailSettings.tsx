import { useState, useEffect } from 'react';
import { Mail, ExternalLink, Check, X, Loader2, RefreshCw, Clock, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useGmailConnection } from '@/hooks/useGmailConnection';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const SYNC_INTERVALS = [
  { value: "1", label: "Toutes les minutes" },
  { value: "5", label: "Toutes les 5 minutes" },
  { value: "10", label: "Toutes les 10 minutes" },
  { value: "15", label: "Toutes les 15 minutes" },
  { value: "30", label: "Toutes les 30 minutes" },
  { value: "60", label: "Toutes les heures" },
];

export function GmailSettings() {
  const {
    connected,
    email,
    lastSync,
    isLoading,
    isConnecting,
    connect,
    disconnect,
    refresh,
  } = useGmailConnection();

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState("5");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load sync configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('gmail-sync-config', {
          body: { action: 'get' }
        });
        
        if (!error && data?.config) {
          setAutoSyncEnabled(data.config.enabled !== false);
          setSyncInterval(String(data.config.interval_minutes || 5));
        }
        setConfigLoaded(true);
      } catch (err) {
        console.error('Error loading sync config:', err);
        setConfigLoaded(true);
      }
    };

    if (connected) {
      loadConfig();
    }
  }, [connected]);

  const handleUpdateConfig = async (newEnabled?: boolean, newInterval?: string) => {
    const enabled = newEnabled !== undefined ? newEnabled : autoSyncEnabled;
    const interval = newInterval !== undefined ? newInterval : syncInterval;
    
    setIsSavingConfig(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail-sync-config', {
        body: { 
          action: 'update',
          enabled,
          interval_minutes: parseInt(interval),
        }
      });

      if (error) throw error;

      if (newEnabled !== undefined) setAutoSyncEnabled(newEnabled);
      if (newInterval !== undefined) setSyncInterval(newInterval);
      
      toast.success('Configuration de synchronisation mise à jour');
    } catch (err) {
      console.error('Error updating sync config:', err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSavingConfig(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Intégration Gmail
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Intégration Gmail
            </CardTitle>
            <CardDescription className="mt-1">
              Connectez votre compte Gmail pour envoyer et recevoir des emails directement depuis l'application
            </CardDescription>
          </div>
          {connected && (
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              Connecté
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{email}</p>
                  {lastSync && (
                    <p className="text-sm text-muted-foreground">
                      Dernière synchronisation : {formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: fr })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={disconnect}>
                  <X className="h-4 w-4 mr-1" />
                  Déconnecter
                </Button>
              </div>
            </div>

            {/* Sync Configuration */}
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Synchronisation automatique</h4>
              </div>
              
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync" className="font-medium">
                      Activer la synchronisation automatique
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Les emails seront récupérés automatiquement depuis Gmail
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSyncEnabled}
                    onCheckedChange={(checked) => handleUpdateConfig(checked, undefined)}
                    disabled={isSavingConfig || !configLoaded}
                  />
                </div>

                {autoSyncEnabled && (
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="sync-interval" className="text-sm whitespace-nowrap">
                        Fréquence de synchronisation
                      </Label>
                    </div>
                    <Select
                      value={syncInterval}
                      onValueChange={(value) => handleUpdateConfig(undefined, value)}
                      disabled={isSavingConfig || !configLoaded}
                    >
                      <SelectTrigger className="w-[200px]" id="sync-interval">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SYNC_INTERVALS.map((interval) => (
                          <SelectItem key={interval.value} value={interval.value}>
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSavingConfig && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Fonctionnalités activées</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Envoi d'emails via Gmail
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Suivi des emails dans le CRM
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Historique des conversations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Détection des réponses clients
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">Aucun compte Gmail connecté</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Connectez votre compte Gmail pour envoyer des emails depuis l'application et suivre les conversations avec vos contacts.
              </p>
              <Button onClick={connect} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connecter Gmail
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Ce que vous pourrez faire</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Envoyer des emails directement depuis l'application</li>
                <li>• Voir l'historique des emails envoyés à chaque contact</li>
                <li>• Recevoir des notifications pour les emails importants</li>
                <li>• Synchroniser automatiquement les conversations</li>
                <li>• Voir les réponses clients directement dans le pipeline</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
