import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { FolderKanban } from "lucide-react";

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
          primaryAction={{
            label: "Nouveau",
            onClick: () => setCreateOpen(true),
          }}
          actions={
            <ViewSwitcher
              options={[
                { value: "timeline", label: "Timeline" },
                { value: "board", label: "Board" },
                { value: "list", label: "Liste" },
              ]}
              value={view}
              onChange={(v) => setView(v as ViewType)}
            />
          }
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "timeline" && <ProjectTimeline />}
          {view === "board" && <ProjectBoard />}
          {view === "list" && (
            <div className="flex items-center justify-center h-96 p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Vue liste à venir...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </MainLayout>
  );
}
