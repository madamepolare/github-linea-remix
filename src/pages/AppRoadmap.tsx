import { useState, useMemo } from "react";
import { Clock, Target, Lightbulb, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoadmap, DELIVERED_MODULES, RoadmapItem } from "@/hooks/useRoadmap";
import { useRoadmapFeedback } from "@/hooks/useRoadmapFeedback";
import { useFeedbackEntries } from "@/hooks/useFeedbackEntries";
import { RoadmapHeader } from "@/components/roadmap/RoadmapHeader";
import { RoadmapSection } from "@/components/roadmap/RoadmapSection";
import { RoadmapItemCard } from "@/components/roadmap/RoadmapItemCard";
import { RoadmapItemDetail } from "@/components/roadmap/RoadmapItemDetail";
import { IdeaCard } from "@/components/roadmap/IdeaCard";
import { SubmitIdeaDialog } from "@/components/roadmap/SubmitIdeaDialog";
import { ExportIdeasButton } from "@/components/roadmap/ExportIdeasButton";
import { usePermissions } from "@/hooks/usePermissions";

// Map module slugs to route patterns for counting
const MODULE_ROUTE_MAP: Record<string, string[]> = {
  dashboard: ['/dashboard'],
  crm: ['/crm', '/contacts', '/leads', '/companies'],
  projects: ['/projects'],
  tasks: ['/tasks'],
  commercial: ['/commercial', '/quote-builder'],
  tenders: ['/tenders'],
  invoicing: ['/invoicing', '/invoices'],
  messages: ['/messages'],
  notifications: ['/notifications'],
  team: ['/team'],
  reports: ['/reports'],
  chantier: ['/chantier'],
  documents: ['/documents'],
  portal: ['/client-portal', '/portal'],
  libraries: ['/materials', '/libraries'],
  ai: ['/ai'],
  permissions: ['/settings'],
};

export default function AppRoadmap() {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
  const { isAdmin, isOwner } = usePermissions();
  
  const {
    roadmapItems,
    deliveredItems,
    inProgressItems,
    plannedItems,
    visionItems,
    ideas,
    isLoading,
    createIdea,
    voteIdea,
    voteRoadmapItem,
    updateIdeaStatus,
    updateRoadmapItemStatus,
    deleteIdea,
  } = useRoadmap();

  const { allFeedbacks } = useRoadmapFeedback(null);
  const { entries: feedbackEntries } = useFeedbackEntries();

  // Calculate feedback counts per module
  const feedbackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count feedback_entries by route
    feedbackEntries?.forEach(entry => {
      Object.entries(MODULE_ROUTE_MAP).forEach(([slug, routes]) => {
        if (routes.some(route => entry.route_path.startsWith(route))) {
          counts[slug] = (counts[slug] || 0) + 1;
        }
      });
    });

    // Count roadmap feedbacks by item id
    allFeedbacks?.forEach(fb => {
      if (fb.roadmap_item_id && fb.source === 'roadmap') {
        counts[fb.roadmap_item_id] = (counts[fb.roadmap_item_id] || 0) + 1;
      }
    });

    return counts;
  }, [feedbackEntries, allFeedbacks]);

  // Get feedback count for an item
  const getFeedbackCount = (item: any) => {
    const byId = feedbackCounts[item.id] || 0;
    const bySlug = item.module_slug ? (feedbackCounts[item.module_slug] || 0) : 0;
    return byId + bySlug;
  };

  // Use static modules if none in DB - now in_progress
  const displayedInProgress = inProgressItems.length > 0 
    ? inProgressItems 
    : DELIVERED_MODULES.map((m, i) => ({ ...m, id: `static-${i}`, created_at: '', updated_at: '' }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <RoadmapHeader
        deliveredCount={deliveredItems.length}
        inProgressCount={displayedInProgress.length}
        plannedCount={plannedItems.length}
        ideasCount={ideas.length}
        onSubmitIdea={() => setShowSubmitDialog(true)}
      />

      <Tabs defaultValue="roadmap" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="ideas">
              Idées
              {ideas.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {ideas.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {(isAdmin || isOwner) && (
            <ExportIdeasButton 
              ideas={ideas} 
              roadmapItems={[...displayedInProgress, ...plannedItems, ...visionItems, ...deliveredItems] as any} 
              allFeedbacks={allFeedbacks}
            />
          )}
        </div>

        <TabsContent value="roadmap" className="space-y-6">
          {/* In Progress - Main section now */}
          <RoadmapSection
            title="En cours de développement"
            icon={<Clock className="h-5 w-5 text-primary" />}
            count={displayedInProgress.length}
            colorClass="bg-primary/10"
            defaultOpen={true}
          >
            {displayedInProgress.map((item) => (
              <RoadmapItemCard
                key={item.id}
                item={item as any}
                showVotes={!item.id.startsWith('static-')}
                onVote={(id, remove) => voteRoadmapItem.mutate({ itemId: id, remove })}
                onStatusChange={(id, status) => updateRoadmapItemStatus.mutate({ itemId: id, status })}
                onClick={() => setSelectedItem(item as any)}
                feedbackCount={getFeedbackCount(item)}
              />
            ))}
          </RoadmapSection>

          {/* Planned */}
          {plannedItems.length > 0 && (
            <RoadmapSection
              title="Planifié"
              icon={<Target className="h-5 w-5 text-orange-600" />}
              count={plannedItems.length}
              colorClass="bg-orange-500/10"
            >
          {plannedItems.map((item) => (
                <RoadmapItemCard
                  key={item.id}
                  item={item}
                  onVote={(id, remove) => voteRoadmapItem.mutate({ itemId: id, remove })}
                  onStatusChange={(id, status) => updateRoadmapItemStatus.mutate({ itemId: id, status })}
                  onClick={() => setSelectedItem(item)}
                  feedbackCount={getFeedbackCount(item)}
                />
              ))}
            </RoadmapSection>
          )}

          {/* Vision */}
          {visionItems.length > 0 && (
            <RoadmapSection
              title="Vision"
              icon={<Lightbulb className="h-5 w-5 text-purple-600" />}
              count={visionItems.length}
              colorClass="bg-purple-500/10"
            >
              {visionItems.map((item) => (
                <RoadmapItemCard
                  key={item.id}
                  item={item}
                  onVote={(id, remove) => voteRoadmapItem.mutate({ itemId: id, remove })}
                  onStatusChange={(id, status) => updateRoadmapItemStatus.mutate({ itemId: id, status })}
                  onClick={() => setSelectedItem(item)}
                  feedbackCount={getFeedbackCount(item)}
                />
              ))}
            </RoadmapSection>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="space-y-4">
          {ideas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune idée soumise pour le moment</p>
              <p className="text-sm">Soyez le premier à proposer une amélioration !</p>
            </div>
          ) : (
            ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onVote={(id, remove) => voteIdea.mutate({ ideaId: id, remove })}
                onUpdateStatus={(id, status) => updateIdeaStatus.mutate({ ideaId: id, status })}
                onDelete={(id) => deleteIdea.mutate(id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <SubmitIdeaDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onSubmit={(input) => createIdea.mutate(input)}
        isLoading={createIdea.isPending}
      />

      <RoadmapItemDetail
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      />
    </div>
  );
}
