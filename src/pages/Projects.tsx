import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

type ViewType = "timeline" | "board" | "list";

export default function Projects() {
  const [view, setView] = useState<ViewType>("timeline");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          icon={FolderKanban}
          title="Projets"
          description="Gérez vos projets et suivez leur progression"
          actions={
            <>
              <ViewSwitcher
                options={[
                  { value: "timeline", label: "Timeline" },
                  { value: "board", label: "Board" },
                  { value: "list", label: "List" },
                ]}
                value={view}
                onChange={(v) => setView(v as ViewType)}
              />

              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Nouveau Projet
              </Button>
            </>
          }
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "timeline" && <ProjectTimeline />}
          {view === "board" && <ProjectBoard />}
          {view === "list" && (
            <div className="p-6 text-center text-muted-foreground">
              Vue liste à venir...
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </MainLayout>
  );
}
