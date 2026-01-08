import { Mail, ExternalLink, Check, X, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGmailConnection } from '@/hooks/useGmailConnection';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
