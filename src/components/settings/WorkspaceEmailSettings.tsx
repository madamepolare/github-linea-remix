import React, { useState } from 'react';
import { useWorkspaceEmail } from '@/hooks/useWorkspaceEmail';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Plus, Star, Trash2, Edit2, Building2, Loader2, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function WorkspaceEmailSettings() {
  const { accounts, defaultAccount, isLoading, isConnecting, connect, disconnect, setDefault, updateDisplayName } = useWorkspaceEmail();
  const { isAdmin } = usePermissions();
  
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState('');

  const handleEditDisplayName = (accountId: string, currentName: string | null) => {
    setEditingAccount(accountId);
    setDisplayNameInput(currentName || '');
  };

  const handleSaveDisplayName = async () => {
    if (editingAccount) {
      await updateDisplayName(editingAccount, displayNameInput);
      setEditingAccount(null);
      setDisplayNameInput('');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Email du Workspace</CardTitle>
          </div>
          <CardDescription>
            Configurez une adresse email partagée pour toute l'équipe. Les emails envoyés depuis cette adresse apparaîtront comme venant de l'organisation, pas d'un individu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Aucun email workspace configuré</p>
              <p className="text-sm mb-4">Ajoutez un compte Gmail partagé pour envoyer des emails professionnels au nom de l'organisation.</p>
              {isAdmin && (
                <Button onClick={connect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Connecter un compte Gmail
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {account.display_name || account.gmail_email}
                          </span>
                          {account.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Par défaut
                            </Badge>
                          )}
                        </div>
                        {account.display_name && (
                          <p className="text-sm text-muted-foreground">{account.gmail_email}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Connecté {formatDistanceToNow(new Date(account.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDisplayName(account.id, account.display_name)}
                          title="Modifier le nom d'affichage"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        {!account.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDefault(account.id)}
                            title="Définir par défaut"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Déconnecter cet email ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                L'email {account.gmail_email} ne pourra plus être utilisé pour envoyer des messages au nom du workspace. Cette action peut être annulée en reconnectant le compte.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => disconnect(account.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Déconnecter
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isAdmin && (
                <Button variant="outline" onClick={connect} disabled={isConnecting} className="w-full">
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un autre compte
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {!isAdmin && accounts.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Seuls les administrateurs peuvent gérer les emails du workspace.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Display Name Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le nom d'affichage</DialogTitle>
            <DialogDescription>
              Ce nom sera affiché comme expéditeur dans les emails envoyés depuis ce compte.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                placeholder="Ex: Agence Domini"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour utiliser l'adresse email comme nom d'expéditeur.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveDisplayName}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
