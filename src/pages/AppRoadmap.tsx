import { useState } from "react";
import { CheckCircle2, Clock, Target, Lightbulb, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoadmap, DELIVERED_MODULES } from "@/hooks/useRoadmap";
import { RoadmapHeader } from "@/components/roadmap/RoadmapHeader";
import { RoadmapSection } from "@/components/roadmap/RoadmapSection";
import { RoadmapItemCard } from "@/components/roadmap/RoadmapItemCard";
import { IdeaCard } from "@/components/roadmap/IdeaCard";
import { SubmitIdeaDialog } from "@/components/roadmap/SubmitIdeaDialog";
import { ExportIdeasButton } from "@/components/roadmap/ExportIdeasButton";
import { usePermissions } from "@/hooks/usePermissions";

export default function AppRoadmap() {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
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
    deleteIdea,
  } = useRoadmap();

  // Use static delivered modules if none in DB
  const displayedDelivered = deliveredItems.length > 0 
    ? deliveredItems 
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
        deliveredCount={displayedDelivered.length}
        inProgressCount={inProgressItems.length}
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
            <ExportIdeasButton ideas={ideas} roadmapItems={[...displayedDelivered, ...inProgressItems, ...plannedItems, ...visionItems] as any} />
          )}
        </div>

        <TabsContent value="roadmap" className="space-y-6">
          {/* Delivered */}
          <RoadmapSection
            title="Livré"
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            count={displayedDelivered.length}
            colorClass="bg-green-500/10"
            defaultOpen={false}
          >
            {displayedDelivered.map((item) => (
              <RoadmapItemCard
                key={item.id}
                item={item as any}
                showVotes={false}
              />
            ))}
          </RoadmapSection>

          {/* In Progress */}
          {inProgressItems.length > 0 && (
            <RoadmapSection
              title="En cours"
              icon={<Clock className="h-5 w-5 text-primary" />}
              count={inProgressItems.length}
              colorClass="bg-primary/10"
            >
              {inProgressItems.map((item) => (
                <RoadmapItemCard
                  key={item.id}
                  item={item}
                  onVote={(id, remove) => voteRoadmapItem.mutate({ itemId: id, remove })}
                />
              ))}
            </RoadmapSection>
          )}

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
    </div>
  );
}
