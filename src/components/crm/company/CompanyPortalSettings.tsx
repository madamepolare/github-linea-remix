import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, Link2, Trash2, Save, Power, PowerOff } from 'lucide-react';
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

interface PortalLink {
  id: string;
  token: string;
  custom_slug: string | null;
  is_active: boolean;
  expires_at: string | null;
  can_view_projects: boolean;
  can_view_tasks: boolean;
  can_add_tasks: boolean;
  can_view_quotes: boolean;
  can_view_invoices: boolean;
  can_view_time_entries: boolean;
  can_view_contacts: boolean;
  last_accessed_at: string | null;
}

interface CompanyPortalSettingsProps {
  companyId: string;
  companyName: string;
}

export function CompanyPortalSettings({ companyId, companyName }: CompanyPortalSettingsProps) {
  const { activeWorkspace: currentWorkspace } = useAuth();
  const [portalLink, setPortalLink] = useState<PortalLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Local state for edits
  const [customSlug, setCustomSlug] = useState('');
  const [permissions, setPermissions] = useState({
    can_view_projects: true,
    can_view_tasks: true,
    can_add_tasks: false,
    can_view_quotes: true,
    can_view_invoices: true,
    can_view_time_entries: false,
    can_view_contacts: true,
  });

  useEffect(() => {
    if (companyId && currentWorkspace?.id) {
      fetchPortalLink();
    }
  }, [companyId, currentWorkspace?.id]);

  const fetchPortalLink = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_portal_links')
        .select('*')
        .eq('company_id', companyId)
        .eq('workspace_id', currentWorkspace?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPortalLink(data as PortalLink);
        setCustomSlug(data.custom_slug || '');
        setPermissions({
          can_view_projects: data.can_view_projects ?? true,
          can_view_tasks: data.can_view_tasks ?? true,
          can_add_tasks: data.can_add_tasks ?? false,
          can_view_quotes: data.can_view_quotes ?? true,
          can_view_invoices: data.can_view_invoices ?? true,
          can_view_time_entries: data.can_view_time_entries ?? false,
          can_view_contacts: data.can_view_contacts ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching company portal link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = () => {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  };

  const createPortalLink = async () => {
    if (!currentWorkspace?.id) return;

    setIsSaving(true);
    try {
      const token = generateToken();

      const { data, error } = await supabase
        .from('company_portal_links')
        .insert({
          workspace_id: currentWorkspace.id,
          company_id: companyId,
          token,
          is_active: true,
          ...permissions,
        })
        .select()
        .single();

      if (error) throw error;

      setPortalLink(data as PortalLink);
      toast.success('Portail société créé avec succès');
    } catch (error) {
      console.error('Error creating company portal link:', error);
      toast.error('Erreur lors de la création du portail');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePortalLink = async () => {
    if (!portalLink) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('company_portal_links')
        .update({
          custom_slug: customSlug || null,
          ...permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portalLink.id);

      if (error) throw error;

      setPortalLink({
        ...portalLink,
        custom_slug: customSlug || null,
        ...permissions,
      });
      toast.success('Paramètres du portail mis à jour');
    } catch (error) {
      console.error('Error updating company portal link:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!portalLink) return;

    try {
      const { error } = await supabase
        .from('company_portal_links')
        .update({
          is_active: !portalLink.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', portalLink.id);

      if (error) throw error;

      setPortalLink({ ...portalLink, is_active: !portalLink.is_active });
      toast.success(portalLink.is_active ? 'Portail désactivé' : 'Portail activé');
    } catch (error) {
      console.error('Error toggling company portal status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const deletePortalLink = async () => {
    if (!portalLink) return;

    try {
      const { error } = await supabase
        .from('company_portal_links')
        .delete()
        .eq('id', portalLink.id);

      if (error) throw error;

      setPortalLink(null);
      setCustomSlug('');
      toast.success('Portail supprimé');
    } catch (error) {
      console.error('Error deleting company portal link:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPortalUrl = () => {
    const baseUrl = window.location.origin;
    const identifier = customSlug || portalLink?.token;
    return `${baseUrl}/company-portal/${identifier}`;
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getPortalUrl());
      setCopied(true);
      toast.success('URL copiée');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!portalLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Portail Société
          </CardTitle>
          <CardDescription>
            Créez un portail dédié pour {companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createPortalLink} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le portail société
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Portail Société
            </CardTitle>
            <CardDescription>
              Gérez l'accès au portail pour {companyName}
            </CardDescription>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            portalLink.is_active 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {portalLink.is_active ? 'Actif' : 'Inactif'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portal URL */}
        <div className="space-y-2">
          <Label>URL du portail</Label>
          <div className="flex gap-2">
            <Input value={getPortalUrl()} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyUrl}>
              <Copy className={`h-4 w-4 ${copied ? 'text-green-500' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={getPortalUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Custom slug */}
        <div className="space-y-2">
          <Label htmlFor="customSlug">URL personnalisée (optionnel)</Label>
          <Input
            id="customSlug"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="mon-entreprise"
          />
          <p className="text-xs text-muted-foreground">
            Lettres minuscules, chiffres et tirets uniquement
          </p>
        </div>

        {/* Permissions */}
        <div className="space-y-4">
          <Label>Permissions</Label>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Voir les projets</span>
              <Switch
                checked={permissions.can_view_projects}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_view_projects: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voir les tâches</span>
              <Switch
                checked={permissions.can_view_tasks}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_view_tasks: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Créer des demandes</span>
              <Switch
                checked={permissions.can_add_tasks}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_add_tasks: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voir les devis</span>
              <Switch
                checked={permissions.can_view_quotes}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_view_quotes: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voir les factures</span>
              <Switch
                checked={permissions.can_view_invoices}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_view_invoices: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voir les temps passés</span>
              <Switch
                checked={permissions.can_view_time_entries}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_view_time_entries: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Voir les contacts</span>
              <Switch
                checked={permissions.can_view_contacts}
                onCheckedChange={(checked) => setPermissions({ ...permissions, can_view_contacts: checked })}
              />
            </div>
          </div>
        </div>

        {/* Last accessed */}
        {portalLink.last_accessed_at && (
          <p className="text-xs text-muted-foreground">
            Dernier accès : {new Date(portalLink.last_accessed_at).toLocaleString('fr-FR')}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            variant={portalLink.is_active ? 'outline' : 'default'}
            size="sm"
            onClick={toggleActive}
          >
            {portalLink.is_active ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Désactiver
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Activer
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le portail ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le lien du portail ne fonctionnera plus.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={deletePortalLink}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" onClick={updatePortalLink} disabled={isSaving} className="ml-auto">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
