import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubProjectsWithStats } from "@/hooks/useSubProjects";
import { SubProjectCard } from "./SubProjectCard";
import { CreateSubProjectDialog } from "./CreateSubProjectDialog";
import { Plus, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeSubProjects = subProjects?.filter(
    p => p.status !== "completed" && p.status !== "done" && p.status !== "archived"
  ) || [];
  
  const completedSubProjects = subProjects?.filter(
    p => p.status === "completed" || p.status === "done"
  ) || [];

  const hasSubProjects = (subProjects?.length || 0) > 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Demandes
              </CardTitle>
              {hasSubProjects && (
                <Badge variant="secondary" className="text-xs">
                  {activeSubProjects.length} en cours
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
          {!hasSubProjects ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Aucune demande</p>
              <p className="text-xs mt-1">
                Créez une première demande pour ce projet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active sub-projects */}
              {activeSubProjects.map(subProject => (
                <SubProjectCard 
                  key={subProject.id} 
                  subProject={subProject}
                  color={parentColor}
                />
              ))}

              {/* Completed sub-projects toggle */}
              {completedSubProjects.length > 0 && (
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
                        {completedSubProjects.length}
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
                      {completedSubProjects.map(subProject => (
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

      <CreateSubProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        parentId={parentId}
        parentName={parentName}
      />
    </>
  );
}
