import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  Calendar,
  MapPin,
  Euro,
  ExternalLink,
  Edit2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTender, useTenders } from "@/hooks/useTenders";
import { useTopBar } from "@/contexts/TopBarContext";
import { TENDER_TABS } from "@/lib/entityTabsConfig";
import { THIN_STROKE } from "@/components/ui/icon";
import { 
  TENDER_STATUS_LABELS, 
  TENDER_STATUS_COLORS,
  PROCEDURE_TYPE_LABELS,
} from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

// Tab components
import { TenderSyntheseTab } from "@/components/tenders/tabs/TenderSyntheseTab";
import { TenderCalendarTab } from "@/components/tenders/tabs/TenderCalendarTab";
import { TenderAnalyseTab } from "@/components/tenders/tabs/TenderAnalyseTab";
import { TenderDocumentsTab } from "@/components/tenders/tabs/TenderDocumentsTab";
import { TenderLivrablesTab } from "@/components/tenders/tabs/TenderLivrablesTab";
import { TenderEquipeTab } from "@/components/tenders/tabs/TenderEquipeTab";
import { TenderMemoireTab } from "@/components/tenders/tabs/TenderMemoireTab";
import { TenderEditDialog } from "@/components/tenders/TenderEditDialog";
import { EntityEmailsTab } from "@/components/shared/EntityEmailsTab";

export default function TenderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tender, isLoading } = useTender(id);
  const { updateTender, updateStatus } = useTenders();
  const { setEntityConfig } = useTopBar();
  const [activeTab, setActiveTab] = useState("synthese");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{ name: string; type: string; data: string }> | null>(null);

  // Configure TopBar for entity view
  useEffect(() => {
    if (tender) {
      const deadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;
      
      setEntityConfig({
        backTo: "/tenders",
        color: "#f59e0b", // Amber/trophy color
        title: tender.title,
        badges: [
          {
            label: TENDER_STATUS_LABELS[tender.status],
            variant: "outline" as const,
          },
          ...(tender.procedure_type ? [{
            label: PROCEDURE_TYPE_LABELS[tender.procedure_type],
            variant: "secondary" as const,
          }] : []),
        ],
        metadata: [
          ...(tender.client_name ? [{ icon: Building2, label: tender.client_name }] : []),
          ...(tender.location ? [{ icon: MapPin, label: tender.location }] : []),
          ...(tender.estimated_budget ? [{ icon: Euro, label: `${(tender.estimated_budget / 1000000).toFixed(1)}M€` }] : []),
          ...(deadline ? [{ icon: Calendar, label: `Dépôt: ${format(deadline, "dd MMM yyyy", { locale: fr })}` }] : []),
        ],
        tabs: TENDER_TABS,
        activeTab,
        onTabChange: setActiveTab,
        actions: (
          <div className="flex items-center gap-2">
            {tender.source_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={tender.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" strokeWidth={THIN_STROKE} />
                  Source
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
              <Edit2 className="h-4 w-4 mr-1.5" strokeWidth={THIN_STROKE} />
              Modifier
            </Button>
          </div>
        ),
      });
    }
    
    return () => setEntityConfig(null);
  }, [tender, activeTab, setEntityConfig]);

  // Check for auto-upload mode (from creation dialog)
  useEffect(() => {
    if (id && searchParams.get('autoUpload') === 'true') {
      const storedFiles = sessionStorage.getItem(`tender-files-${id}`);
      if (storedFiles) {
        try {
          const files = JSON.parse(storedFiles);
          setPendingFiles(files);
          sessionStorage.removeItem(`tender-files-${id}`);
          setActiveTab("analyse");
        } catch (e) {
          console.error('Failed to parse stored files:', e);
        }
      }
      setSearchParams({}, { replace: true });
    }
  }, [id, searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Appel d'offre non trouvé</p>
        <Button variant="outline" onClick={() => navigate("/tenders")} className="mt-4">
          Retour aux appels d'offre
        </Button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "synthese":
        return <TenderSyntheseTab tender={tender} onNavigateToTab={setActiveTab} />;
      case "calendrier":
        return <TenderCalendarTab tenderId={tender.id} tender={tender} />;
      case "analyse":
        return (
          <TenderAnalyseTab 
            tender={tender} 
            onNavigateToTab={setActiveTab}
            pendingFiles={pendingFiles}
            onFilesPending={(files) => setPendingFiles(files)}
          />
        );
      case "documents":
        return <TenderDocumentsTab tenderId={tender.id} />;
      case "emails":
        return <EntityEmailsTab entityType="tender" entityId={tender.id} />;
      case "livrables":
        return <TenderLivrablesTab tenderId={tender.id} />;
      case "equipe":
        const requiredSpecialties = Array.isArray(tender.required_team)
          ? (tender.required_team as any[])
              .map((t) => (typeof t === "string" ? t : t?.specialty))
              .filter(Boolean)
          : [];
        return <TenderEquipeTab tenderId={tender.id} requiredCompetencies={requiredSpecialties} />;
      case "memoire":
        return <TenderMemoireTab tenderId={tender.id} tender={tender} />;
      default:
        return <TenderSyntheseTab tender={tender} onNavigateToTab={setActiveTab} />;
    }
  };

  return (
    <>
      <div className="flex-1 overflow-auto p-6">
        {renderTabContent()}
      </div>

      <TenderEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        tender={tender}
        onSave={(updates) => updateTender.mutate({ id: tender.id, ...updates })}
      />
    </>
  );
}
