import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2, 
  Globe, 
  Eye, 
  ListTodo, 
  FileText, 
  Receipt, 
  Clock,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PortalLink {
  id: string;
  token: string;
  custom_slug: string | null;
  is_active: boolean;
  expires_at: string | null;
  last_accessed_at: string | null;
  can_view_projects: boolean;
  can_view_tasks: boolean;
  can_add_tasks: boolean;
  can_view_invoices: boolean;
  can_view_quotes: boolean;
  can_view_time_entries: boolean;
  created_at: string;
}

interface ContactPortalSettingsProps {
  contactId: string;
  contactName: string;
}

export function ContactPortalSettings({ contactId, contactName }: ContactPortalSettingsProps) {
  const { activeWorkspace } = useAuth();
  const [portalLink, setPortalLink] = useState<PortalLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [permissions, setPermissions] = useState({
    can_view_projects: true,
    can_view_tasks: true,
    can_add_tasks: false,
    can_view_invoices: true,
    can_view_quotes: true,
    can_view_time_entries: false,
  });

  const [customSlug, setCustomSlug] = useState('');

  useEffect(() => {
    if (contactId && activeWorkspace?.id) {
      fetchPortalLink();
    }
  }, [contactId, activeWorkspace?.id]);

  const fetchPortalLink = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('client_portal_links')
        .select('*')
        .eq('contact_id', contactId)
        .eq('workspace_id', activeWorkspace.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPortalLink(data as PortalLink);
        setPermissions({
          can_view_projects: data.can_view_projects ?? true,
          can_view_tasks: data.can_view_tasks ?? true,
          can_add_tasks: data.can_add_tasks ?? false,
          can_view_invoices: data.can_view_invoices ?? true,
          can_view_quotes: data.can_view_quotes ?? true,
          can_view_time_entries: data.can_view_time_entries ?? false,
        });
        setCustomSlug(data.custom_slug || '');
      }
    } catch (error) {
      console.error('Error fetching portal link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = () => {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  };

  const createPortalLink = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setIsSaving(true);
      const token = generateToken();

      const { data, error } = await supabase
        .from('client_portal_links')
        .insert({
          workspace_id: activeWorkspace.id,
          contact_id: contactId,
          token,
          ...permissions,
        })
        .select()
        .single();

      if (error) throw error;

      setPortalLink(data as PortalLink);
      toast.success('Portail client créé avec succès');
    } catch (error: any) {
      console.error('Error creating portal link:', error);
      toast.error('Erreur lors de la création du portail');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePortalLink = async () => {
    if (!portalLink) return;

    try {
      setIsSaving(true);

      const updateData: any = {
        ...permissions,
        custom_slug: customSlug.trim() || null,
      };

      const { error } = await supabase
        .from('client_portal_links')
        .update(updateData)
        .eq('id', portalLink.id);

      if (error) throw error;

      await fetchPortalLink();
      toast.success('Paramètres mis à jour');
    } catch (error: any) {
      console.error('Error updating portal link:', error);
      if (error.code === '23505') {
        toast.error('Ce slug est déjà utilisé');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!portalLink) return;

    try {
      const { error } = await supabase
        .from('client_portal_links')
        .update({ is_active: !portalLink.is_active })
        .eq('id', portalLink.id);

      if (error) throw error;

      setPortalLink({ ...portalLink, is_active: !portalLink.is_active });
      toast.success(portalLink.is_active ? 'Portail désactivé' : 'Portail activé');
    } catch (error) {
      console.error('Error toggling portal:', error);
      toast.error('Erreur lors de la modification');
    }
  };

  const deletePortalLink = async () => {
    if (!portalLink) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce portail client ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('client_portal_links')
        .delete()
        .eq('id', portalLink.id);

      if (error) throw error;

      setPortalLink(null);
      toast.success('Portail supprimé');
    } catch (error) {
      console.error('Error deleting portal:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPortalUrl = () => {
    const baseUrl = window.location.origin;
    const slug = portalLink?.custom_slug || portalLink?.token;
    return `${baseUrl}/portal/${slug}`;
  };

  const copyUrl = async () => {
    const url = getPortalUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL copiée');
    setTimeout(() => setCopied(false), 2000);
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
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Portail Client
          </CardTitle>
          <CardDescription>
            Créez un portail client pour permettre à {contactName} d'accéder à ses projets, devis et factures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createPortalLink} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer le portail client
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
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Portail Client
            </CardTitle>
            <CardDescription>
              Gérez l'accès au portail de {contactName}
            </CardDescription>
          </div>
          <Badge variant={portalLink.is_active ? 'default' : 'secondary'}>
            {portalLink.is_active ? 'Actif' : 'Désactivé'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Section */}
        <div className="space-y-2">
          <Label>URL du portail</Label>
          <div className="flex gap-2">
            <Input value={getPortalUrl()} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyUrl}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
          <Label>Slug personnalisé (optionnel)</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="ex: dupont-architectes" 
              value={customSlug}
              onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Laissez vide pour utiliser le token par défaut
          </p>
        </div>

        <Separator />

        {/* Permissions */}
        <div className="space-y-4">
          <Label className="text-base">Permissions</Label>
          
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Voir les projets</span>
              </div>
              <Switch 
                checked={permissions.can_view_projects}
                onCheckedChange={v => setPermissions(p => ({ ...p, can_view_projects: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Voir les tâches</span>
              </div>
              <Switch 
                checked={permissions.can_view_tasks}
                onCheckedChange={v => setPermissions(p => ({ ...p, can_view_tasks: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Créer des demandes</span>
              </div>
              <Switch 
                checked={permissions.can_add_tasks}
                onCheckedChange={v => setPermissions(p => ({ ...p, can_add_tasks: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Voir les devis</span>
              </div>
              <Switch 
                checked={permissions.can_view_quotes}
                onCheckedChange={v => setPermissions(p => ({ ...p, can_view_quotes: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Voir les factures</span>
              </div>
              <Switch 
                checked={permissions.can_view_invoices}
                onCheckedChange={v => setPermissions(p => ({ ...p, can_view_invoices: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Voir les temps passés</span>
              </div>
              <Switch 
                checked={permissions.can_view_time_entries}
                onCheckedChange={v => setPermissions(p => ({ ...p, can_view_time_entries: v }))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Metadata */}
        {portalLink.last_accessed_at && (
          <p className="text-xs text-muted-foreground">
            Dernier accès : {format(new Date(portalLink.last_accessed_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleActive}>
              {portalLink.is_active ? 'Désactiver' : 'Activer'}
            </Button>
            <Button variant="destructive" size="sm" onClick={deletePortalLink}>
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          </div>
          <Button onClick={updatePortalLink} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
