import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubProjectsWithStats, SubProjectWithStats } from "@/hooks/useSubProjects";
import { SubProjectCard } from "./SubProjectCard";
import { SupplementaryWorkSection } from "./SupplementaryWorkSection";
import { CreateSubProjectDialog } from "./CreateSubProjectDialog";
import { RequestQualificationDialog } from "./RequestQualificationDialog";
import { Plus, FolderOpen, ChevronDown, ChevronUp, AlertCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubProjectsListProps {
  parentId: string;
  parentName: string;
  parentColor?: string;
}

export function SubProjectsList({ parentId, parentName, parentColor }: SubProjectsListProps) {
  const { data: subProjects, isLoading } = useSubProjectsWithStats(parentId);
  const [createOpen, setCreateOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [qualifyProject, setQualifyProject] = useState<SubProjectWithStats | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate by billing type
  const includedProjects = subProjects?.filter(p => p.billing_type !== "supplementary") || [];
  const supplementaryProjects = subProjects?.filter(p => p.billing_type === "supplementary") || [];
  
  // Further separate included by status
  const pendingReviewProjects = includedProjects.filter(p => p.status === "pending_review");
  const activeIncludedProjects = includedProjects.filter(
    p => p.status !== "completed" && p.status !== "done" && p.status !== "archived" && p.status !== "pending_review"
  );
  const completedIncludedProjects = includedProjects.filter(
    p => p.status === "completed" || p.status === "done"
  );

  const hasSubProjects = (subProjects?.length || 0) > 0;

  return (
    <>
      <div className="space-y-4">
        {/* Pending review section */}
        {pendingReviewProjects.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-800/50 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Demandes à qualifier
                </CardTitle>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                  {pendingReviewProjects.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingReviewProjects.map(subProject => (
                <div key={subProject.id} className="relative">
                  <SubProjectCard 
                    subProject={subProject}
                    color={parentColor}
                    showClientBadge
                  />
                  <div className="absolute top-2 right-2">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQualifyProject(subProject);
                      }}
                    >
                      Qualifier
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Included in contract section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Demandes forfait
                </CardTitle>
                {activeIncludedProjects.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeIncludedProjects.length} en cours
                  </Badge>
                )}
              </div>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle demande
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {activeIncludedProjects.length === 0 && completedIncludedProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Aucune demande forfait</p>
                <p className="text-xs mt-1">
                  Créez une première demande pour ce projet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active included projects */}
                {activeIncludedProjects.map(subProject => (
                  <SubProjectCard 
                    key={subProject.id} 
                    subProject={subProject}
                    color={parentColor}
                    showClientBadge
                  />
                ))}

                {/* Completed included toggle */}
                {completedIncludedProjects.length > 0 && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCompleted(!showCompleted)}
                    >
                      <span className="flex items-center gap-2">
                        Demandes terminées
                        <Badge variant="secondary" className="text-2xs">
                          {completedIncludedProjects.length}
                        </Badge>
                      </span>
                      {showCompleted ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {showCompleted && (
                      <div className="mt-3 space-y-3">
                        {completedIncludedProjects.map(subProject => (
                          <SubProjectCard 
                            key={subProject.id} 
                            subProject={subProject}
                            color={parentColor}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplementary work section */}
        <SupplementaryWorkSection
          subProjects={supplementaryProjects}
          parentColor={parentColor}
        />
      </div>

      <CreateSubProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        parentId={parentId}
        parentName={parentName}
      />

      {qualifyProject && (
        <RequestQualificationDialog
          open={!!qualifyProject}
          onOpenChange={(open) => !open && setQualifyProject(null)}
          projectId={qualifyProject.id}
          projectName={qualifyProject.name}
          parentId={parentId}
        />
      )}
    </>
  );
}
