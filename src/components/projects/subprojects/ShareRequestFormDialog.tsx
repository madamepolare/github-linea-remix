import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, Loader2, ExternalLink, Link2, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareRequestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function ShareRequestFormDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: ShareRequestFormDialogProps) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  // Fetch existing portal link for this framework project
  const { data: portalLink, isLoading: isLoadingLink } = useQuery({
    queryKey: ["framework-portal-link", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portal_links")
        .select("*, contact:contacts(id, name, email)")
        .eq("framework_project_id", projectId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open && !!projectId,
  });

  // Fetch contacts for this project's company
  const { data: contacts } = useQuery({
    queryKey: ["project-contacts", projectId],
    queryFn: async () => {
      // First get the project's company
      const { data: project } = await supabase
        .from("projects")
        .select("crm_company_id")
        .eq("id", projectId)
        .single();

      if (!project?.crm_company_id) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("crm_company_id", project.crm_company_id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!projectId,
  });

  const formUrl = portalLink
    ? `${window.location.origin}/request/${portalLink.token}`
    : null;

  const handleCopy = async () => {
    if (!formUrl) return;
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateLink = async () => {
    if (!activeWorkspace?.id || !selectedContactId) {
      toast.error("Veuillez sélectionner un contact");
      return;
    }

    setIsCreating(true);
    try {
      // Generate a unique token
      const token = crypto.randomUUID();

      const { error } = await supabase.from("client_portal_links").insert({
        workspace_id: activeWorkspace.id,
        contact_id: selectedContactId,
        framework_project_id: projectId,
        token,
        is_active: true,
        can_add_tasks: true,
        can_view_projects: true,
        can_view_tasks: true,
        project_ids: [projectId],
        created_by: user?.id,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["framework-portal-link", projectId] });
      toast.success("Lien de partage créé !");
    } catch (error) {
      console.error("Error creating portal link:", error);
      toast.error("Erreur lors de la création du lien");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivateLink = async () => {
    if (!portalLink) return;

    try {
      const { error } = await supabase
        .from("client_portal_links")
        .update({ is_active: false })
        .eq("id", portalLink.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["framework-portal-link", projectId] });
      toast.success("Lien désactivé");
    } catch (error) {
      console.error("Error deactivating link:", error);
      toast.error("Erreur lors de la désactivation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Formulaire de demande client
          </DialogTitle>
          <DialogDescription>
            Partagez ce lien avec votre client pour lui permettre de soumettre des demandes sur "{projectName}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoadingLink ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : portalLink ? (
            <>
              {/* Existing link */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Lien du formulaire</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formUrl || ""}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(formUrl!, "_blank")}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Contact :</span>
                    <span className="font-medium">{portalLink.contact?.name}</span>
                    {portalLink.contact?.email && (
                      <span className="text-muted-foreground">({portalLink.contact.email})</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <span className="text-sm font-medium text-green-600">Actif</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDeactivateLink}
                  >
                    Désactiver le lien
                  </Button>
                  <Button className="flex-1" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Create new link */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Créez un lien de formulaire pour permettre à votre client de soumettre des demandes directement sur ce projet accord-cadre.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact client *</Label>
                  <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex flex-col">
                            <span>{contact.name}</span>
                            {contact.email && (
                              <span className="text-xs text-muted-foreground">{contact.email}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Ce contact sera associé aux demandes soumises via ce formulaire.
                  </p>
                </div>

                <Button
                  onClick={handleCreateLink}
                  disabled={isCreating || !selectedContactId}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Créer le lien de partage
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
