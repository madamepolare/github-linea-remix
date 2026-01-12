import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Loader2, Building2, Users, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function CRMResetSection() {
  const { activeWorkspace } = useAuth();
  const { allContacts } = useContacts();
  const { allCompanies } = useCRMCompanies();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [stats, setStats] = useState<{
    contactsToDelete: number;
    companiesToDelete: number;
    contactsLinked: number;
    companiesLinked: number;
  } | null>(null);

  const fetchStats = async () => {
    if (!activeWorkspace?.id) return;

    try {
      // Get contacts linked to projects
      const { data: linkedContacts } = await supabase
        .from("contacts")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .not("crm_company_id", "is", null);

      // Get companies linked to projects via commercial documents or leads
      const { data: projectCompanies } = await supabase
        .from("commercial_documents")
        .select("client_company_id")
        .eq("workspace_id", activeWorkspace.id)
        .not("client_company_id", "is", null);

      const { data: projectCompaniesFromProjects } = await supabase
        .from("projects")
        .select("crm_company_id")
        .eq("workspace_id", activeWorkspace.id)
        .not("crm_company_id", "is", null);

      const linkedCompanyIds = new Set<string>();
      projectCompanies?.forEach(doc => {
        if (doc.client_company_id) linkedCompanyIds.add(doc.client_company_id);
      });
      projectCompaniesFromProjects?.forEach(proj => {
        if (proj.crm_company_id) linkedCompanyIds.add(proj.crm_company_id);
      });

      const companiesLinked = linkedCompanyIds.size;
      const companiesToDelete = allCompanies.length - companiesLinked;
      
      // Contacts to delete are those not linked to linked companies
      const contactsLinkedToLinkedCompanies = allContacts.filter(c => 
        c.crm_company_id && linkedCompanyIds.has(c.crm_company_id)
      ).length;
      const contactsToDelete = allContacts.length - contactsLinkedToLinkedCompanies;

      setStats({
        contactsToDelete,
        companiesToDelete,
        contactsLinked: contactsLinkedToLinkedCompanies,
        companiesLinked,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleOpenDialog = async () => {
    await fetchStats();
    setDialogOpen(true);
    setConfirmText("");
  };

  const handleReset = async () => {
    if (!activeWorkspace?.id || confirmText !== "SUPPRIMER") return;
    
    setIsResetting(true);

    try {
      // Get companies linked to projects
      const { data: projectCompanies } = await supabase
        .from("commercial_documents")
        .select("client_company_id")
        .eq("workspace_id", activeWorkspace.id)
        .not("client_company_id", "is", null);

      const { data: projectCompaniesFromProjects } = await supabase
        .from("projects")
        .select("crm_company_id")
        .eq("workspace_id", activeWorkspace.id)
        .not("crm_company_id", "is", null);

      const linkedCompanyIds = new Set<string>();
      projectCompanies?.forEach(doc => {
        if (doc.client_company_id) linkedCompanyIds.add(doc.client_company_id);
      });
      projectCompaniesFromProjects?.forEach(proj => {
        if (proj.crm_company_id) linkedCompanyIds.add(proj.crm_company_id);
      });

      // Delete contacts not linked to protected companies
      const contactsToDelete = allContacts.filter(c => 
        !c.crm_company_id || !linkedCompanyIds.has(c.crm_company_id)
      );

      for (const contact of contactsToDelete) {
        await supabase.from("contacts").delete().eq("id", contact.id);
      }

      // Delete companies not linked to projects
      const companiesToDelete = allCompanies.filter(c => !linkedCompanyIds.has(c.id));

      for (const company of companiesToDelete) {
        await supabase.from("crm_companies").delete().eq("id", company.id);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });

      toast({
        title: "CRM réinitialisé",
        description: `${contactsToDelete.length} contact(s) et ${companiesToDelete.length} entreprise(s) supprimé(s).`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error("Error resetting CRM:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la réinitialisation.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Database className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base">Réinitialiser le CRM</CardTitle>
              <CardDescription>
                Supprimer les contacts et entreprises non liés à des projets
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {allContacts.length} contacts
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                {allCompanies.length} entreprises
              </span>
            </div>
            <Button 
              variant="outline" 
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleOpenDialog}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Réinitialiser le CRM
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer toutes les données CRM non liées à des projets existants.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {stats && (
            <div className="my-4 space-y-3">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="font-medium text-destructive mb-2">Sera supprimé :</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Contacts non liés</span>
                    <Badge variant="destructive">{stats.contactsToDelete}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Entreprises non liées</span>
                    <Badge variant="destructive">{stats.companiesToDelete}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="font-medium text-green-700 mb-2">Sera conservé :</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Contacts liés à des projets</span>
                    <Badge className="bg-green-100 text-green-700">{stats.contactsLinked}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Entreprises liées à des projets</span>
                    <Badge className="bg-green-100 text-green-700">{stats.companiesLinked}</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="font-mono"
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={confirmText !== "SUPPRIMER" || isResetting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirmer la réinitialisation
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
