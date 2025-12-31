import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { FolderKanban } from "lucide-react";

type ViewType = "timeline" | "board" | "list";

export default function Projects() {
  const [view, setView] = useState<ViewType>("timeline");
  const [createOpen, setCreateOpen] = useState(false);

  // Listen for command palette event
  useEffect(() => {
    const handleOpen = () => setCreateOpen(true);
    window.addEventListener("open-create-project", handleOpen);
    return () => window.removeEventListener("open-create-project", handleOpen);
  }, []);

  return (
    <>
      <PageLayout
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
        contentPadding={false}
        contentOverflow="hidden"
      >
        {view === "timeline" && <ProjectTimeline onCreateProject={() => setCreateOpen(true)} />}
        {view === "board" && <ProjectBoard onCreateProject={() => setCreateOpen(true)} />}
        {view === "list" && (
          <div className="flex items-center justify-center h-96 p-6">
            <p className="text-sm text-muted-foreground">Vue liste à venir...</p>
          </div>
        )}
      </PageLayout>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
