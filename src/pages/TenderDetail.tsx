import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Euro,
  FileText,
  Users,
  CheckSquare,
  PenTool,
  ExternalLink,
  Edit2,
  Brain,
  FolderOpen,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTender, useTenders } from "@/hooks/useTenders";
import { 
  TENDER_STATUS_LABELS, 
  TENDER_STATUS_COLORS,
  PROCEDURE_TYPE_LABELS,
} from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { TenderAIAnalysisTab } from "@/components/tenders/TenderAIAnalysisTab";
import { TenderDocumentsTab } from "@/components/tenders/TenderDocumentsTab";
import { TenderTeamTab } from "@/components/tenders/TenderTeamTab";
import { TenderDeliverablesTab } from "@/components/tenders/TenderDeliverablesTab";
import { TenderMemoireTab } from "@/components/tenders/TenderMemoireTab";
import { TenderEditDialog } from "@/components/tenders/TenderEditDialog";

export default function TenderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tender, isLoading } = useTender(id);
  const { updateTender, updateStatus } = useTenders();
  const [activeTab, setActiveTab] = useState("analysis");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{ name: string; type: string; data: string }> | null>(null);

  // Check for auto-upload mode (from creation dialog)
  useEffect(() => {
    if (id && searchParams.get('autoUpload') === 'true') {
      const storedFiles = sessionStorage.getItem(`tender-files-${id}`);
      if (storedFiles) {
        try {
          const files = JSON.parse(storedFiles);
          setPendingFiles(files);
          sessionStorage.removeItem(`tender-files-${id}`);
        } catch (e) {
          console.error('Failed to parse stored files:', e);
        }
      }
      // Remove the query param
      setSearchParams({}, { replace: true });
    }
  }, [id, searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!tender) {
    return (
      <MainLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Concours non trouvé</p>
          <Button variant="outline" onClick={() => navigate("/tenders")} className="mt-4">
            Retour aux concours
          </Button>
        </div>
      </MainLayout>
    );
  }

  const deadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="px-6 py-4">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/tenders")}
                className="shrink-0 mt-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-mono text-muted-foreground">
                    {tender.reference}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", TENDER_STATUS_COLORS[tender.status])}
                  >
                    {TENDER_STATUS_LABELS[tender.status]}
                  </Badge>
                  {tender.procedure_type && (
                    <Badge variant="secondary" className="text-xs">
                      {PROCEDURE_TYPE_LABELS[tender.procedure_type]}
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-semibold line-clamp-2">{tender.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {tender.client_name && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {tender.client_name}
                    </span>
                  )}
                  {tender.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {tender.location}
                    </span>
                  )}
                  {tender.estimated_budget && (
                    <span className="flex items-center gap-1.5">
                      <Euro className="h-4 w-4" />
                      {(tender.estimated_budget / 1000000).toFixed(1)}M€
                    </span>
                  )}
                  {deadline && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Dépôt: {format(deadline, "dd MMM yyyy HH:mm", { locale: fr })}
                    </span>
                  )}
                  {tender.source_url && (
                    <a 
                      href={tender.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Source
                    </a>
                  )}
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 border-t">
              <TabsList className="h-12 bg-transparent w-full justify-start gap-1 -mb-px">
                <TabsTrigger 
                  value="analysis" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analyse IA
                </TabsTrigger>
                <TabsTrigger 
                  value="documents"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="deliverables"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Pièces à fournir
                </TabsTrigger>
                <TabsTrigger 
                  value="team"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Équipe
                </TabsTrigger>
                <TabsTrigger 
                  value="memoire"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Mémoire
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="analysis" className="m-0 p-6">
                <TenderAIAnalysisTab 
                  tender={tender} 
                  onNavigateToTab={setActiveTab}
                  pendingFiles={pendingFiles}
                  onFilesPending={(files) => setPendingFiles(files)}
                />
              </TabsContent>
              <TabsContent value="documents" className="m-0 p-6">
                <TenderDocumentsTab tenderId={tender.id} />
              </TabsContent>
              <TabsContent value="deliverables" className="m-0 p-6">
                <TenderDeliverablesTab tenderId={tender.id} />
              </TabsContent>
              <TabsContent value="team" className="m-0 p-6">
                <TenderTeamTab tenderId={tender.id} />
              </TabsContent>
              <TabsContent value="memoire" className="m-0 p-6">
                <TenderMemoireTab tenderId={tender.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <TenderEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        tender={tender}
        onSave={(updates) => updateTender.mutate({ id: tender.id, ...updates })}
      />
    </MainLayout>
  );
}
