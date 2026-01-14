import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Power,
  PowerOff,
  Save,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Unified portal link type
export interface PortalLink {
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
  can_view_contacts?: boolean; // Only for company portals
  created_at?: string;
}

export interface PortalPermissions {
  can_view_projects: boolean;
  can_view_tasks: boolean;
  can_add_tasks: boolean;
  can_view_invoices: boolean;
  can_view_quotes: boolean;
  can_view_time_entries: boolean;
  can_view_contacts?: boolean;
}

export type PortalType = 'contact' | 'company';

export interface PortalSettingsBaseProps {
  portalType: PortalType;
  entityId: string;
  entityName: string;
}

// Configuration par type de portail
const PORTAL_CONFIG = {
  contact: {
    portalPath: '/portal',
    title: 'Portail Client',
    createButtonText: 'Créer le portail client',
    description: (name: string) => `Gérez l'accès au portail de ${name}`,
    createDescription: (name: string) => `Créez un portail client pour permettre à ${name} d'accéder à ses projets, devis et factures.`,
    successCreate: 'Portail client créé avec succès',
    showContactsPermission: false,
  },
  company: {
    portalPath: '/company-portal',
    title: 'Portail Société',
    createButtonText: 'Créer le portail société',
    description: (name: string) => `Gérez l'accès au portail pour ${name}`,
    createDescription: (name: string) => `Créez un portail dédié pour ${name}`,
    successCreate: 'Portail société créé avec succès',
    showContactsPermission: true,
  },
};

const DEFAULT_PERMISSIONS: PortalPermissions = {
  can_view_projects: true,
  can_view_tasks: true,
  can_add_tasks: false,
  can_view_invoices: true,
  can_view_quotes: true,
  can_view_time_entries: false,
  can_view_contacts: true,
};

export function PortalSettingsBase({ portalType, entityId, entityName }: PortalSettingsBaseProps) {
  const { activeWorkspace } = useAuth();
  const config = PORTAL_CONFIG[portalType];
  
  const [portalLink, setPortalLink] = useState<PortalLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [permissions, setPermissions] = useState<PortalPermissions>(DEFAULT_PERMISSIONS);
  const [customSlug, setCustomSlug] = useState('');

  useEffect(() => {
    if (entityId && activeWorkspace?.id) {
      fetchPortalLink();
    }
  }, [entityId, activeWorkspace?.id]);

  const fetchPortalLink = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setIsLoading(true);
      
      // Use specific table based on portal type to avoid TypeScript issues
      let data: PortalLink | null = null;
      let error: Error | null = null;

      if (portalType === 'contact') {
        const result = await supabase
          .from('client_portal_links')
          .select('*')
          .eq('contact_id', entityId)
          .eq('workspace_id', activeWorkspace.id)
          .maybeSingle();
        data = result.data as PortalLink | null;
        error = result.error;
      } else {
        const result = await supabase
          .from('company_portal_links')
          .select('*')
          .eq('company_id', entityId)
          .eq('workspace_id', activeWorkspace.id)
          .maybeSingle();
        data = result.data as PortalLink | null;
        error = result.error;
      }

      if (error) throw error;

      if (data) {
        setPortalLink(data);
        setPermissions({
          can_view_projects: data.can_view_projects ?? true,
          can_view_tasks: data.can_view_tasks ?? true,
          can_add_tasks: data.can_add_tasks ?? false,
          can_view_invoices: data.can_view_invoices ?? true,
          can_view_quotes: data.can_view_quotes ?? true,
          can_view_time_entries: data.can_view_time_entries ?? false,
          can_view_contacts: data.can_view_contacts ?? true,
        });
        setCustomSlug(data.custom_slug || '');
      }
    } catch (err) {
      console.error(`Error fetching ${portalType} portal link:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = () => {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  };

  const createPortalLink = async () => {
    if (!activeWorkspace?.id) return;

    try {
      setIsSaving(true);
      const token = generateToken();

      let data: PortalLink | null = null;
      let error: Error | null = null;

      if (portalType === 'contact') {
        const result = await supabase
          .from('client_portal_links')
          .insert({
            workspace_id: activeWorkspace.id,
            contact_id: entityId,
            token,
            is_active: true,
            can_view_projects: permissions.can_view_projects,
            can_view_tasks: permissions.can_view_tasks,
            can_add_tasks: permissions.can_add_tasks,
            can_view_invoices: permissions.can_view_invoices,
            can_view_quotes: permissions.can_view_quotes,
            can_view_time_entries: permissions.can_view_time_entries,
          })
          .select()
          .single();
        data = result.data as PortalLink | null;
        error = result.error;
      } else {
        const result = await supabase
          .from('company_portal_links')
          .insert({
            workspace_id: activeWorkspace.id,
            company_id: entityId,
            token,
            is_active: true,
            can_view_projects: permissions.can_view_projects,
            can_view_tasks: permissions.can_view_tasks,
            can_add_tasks: permissions.can_add_tasks,
            can_view_invoices: permissions.can_view_invoices,
            can_view_quotes: permissions.can_view_quotes,
            can_view_time_entries: permissions.can_view_time_entries,
            can_view_contacts: permissions.can_view_contacts,
          })
          .select()
          .single();
        data = result.data as PortalLink | null;
        error = result.error;
      }

      if (error) throw error;

      setPortalLink(data);
      toast.success(config.successCreate);
    } catch (err) {
      console.error(`Error creating ${portalType} portal link:`, err);
      toast.error('Erreur lors de la création du portail');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePortalLink = async () => {
    if (!portalLink) return;

    try {
      setIsSaving(true);

      let error: Error | null = null;

      if (portalType === 'contact') {
        const result = await supabase
          .from('client_portal_links')
          .update({
            custom_slug: customSlug.trim() || null,
            can_view_projects: permissions.can_view_projects,
            can_view_tasks: permissions.can_view_tasks,
            can_add_tasks: permissions.can_add_tasks,
            can_view_invoices: permissions.can_view_invoices,
            can_view_quotes: permissions.can_view_quotes,
            can_view_time_entries: permissions.can_view_time_entries,
          })
          .eq('id', portalLink.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('company_portal_links')
          .update({
            custom_slug: customSlug.trim() || null,
            can_view_projects: permissions.can_view_projects,
            can_view_tasks: permissions.can_view_tasks,
            can_add_tasks: permissions.can_add_tasks,
            can_view_invoices: permissions.can_view_invoices,
            can_view_quotes: permissions.can_view_quotes,
            can_view_time_entries: permissions.can_view_time_entries,
            can_view_contacts: permissions.can_view_contacts,
          })
          .eq('id', portalLink.id);
        error = result.error;
      }

      if (error) throw error;

      setPortalLink({
        ...portalLink,
        custom_slug: customSlug.trim() || null,
        ...permissions,
      });
      toast.success('Paramètres mis à jour');
    } catch (error: unknown) {
      console.error(`Error updating ${portalType} portal link:`, error);
      if ((error as { code?: string })?.code === '23505') {
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
      let error: Error | null = null;
      
      if (portalType === 'contact') {
        const result = await supabase
          .from('client_portal_links')
          .update({ is_active: !portalLink.is_active })
          .eq('id', portalLink.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('company_portal_links')
          .update({ is_active: !portalLink.is_active })
          .eq('id', portalLink.id);
        error = result.error;
      }

      if (error) throw error;

      setPortalLink({ ...portalLink, is_active: !portalLink.is_active });
      toast.success(portalLink.is_active ? 'Portail désactivé' : 'Portail activé');
    } catch (err) {
      console.error(`Error toggling ${portalType} portal:`, err);
      toast.error('Erreur lors de la modification');
    }
  };

  const deletePortalLink = async () => {
    if (!portalLink) return;

    try {
      let error: Error | null = null;
      
      if (portalType === 'contact') {
        const result = await supabase
          .from('client_portal_links')
          .delete()
          .eq('id', portalLink.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('company_portal_links')
          .delete()
          .eq('id', portalLink.id);
        error = result.error;
      }

      if (error) throw error;

      setPortalLink(null);
      setCustomSlug('');
      toast.success('Portail supprimé');
    } catch (err) {
      console.error(`Error deleting ${portalType} portal:`, err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPortalUrl = () => {
    const baseUrl = window.location.origin;
    const slug = customSlug.trim() || portalLink?.token;
    return `${baseUrl}${config.portalPath}/${slug}`;
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

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // No portal link - show creation UI
  if (!portalLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {config.title}
          </CardTitle>
          <CardDescription>
            {config.createDescription(entityName)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createPortalLink} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {config.createButtonText}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Portal exists - show management UI
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {config.title}
            </CardTitle>
            <CardDescription>
              {config.description(entityName)}
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
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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
          <Label>URL personnalisée (optionnel)</Label>
          <Input 
            placeholder="ex: mon-entreprise" 
            value={customSlug}
            onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          />
          <p className="text-xs text-muted-foreground">
            Lettres minuscules, chiffres et tirets uniquement
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

            {/* Contacts permission - only for company portals */}
            {config.showContactsPermission && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Voir les contacts</span>
                </div>
                <Switch 
                  checked={permissions.can_view_contacts ?? true}
                  onCheckedChange={v => setPermissions(p => ({ ...p, can_view_contacts: v }))}
                />
              </div>
            )}
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
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={toggleActive}>
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