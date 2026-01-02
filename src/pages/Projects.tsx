import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { ProjectGridView } from "@/components/projects/ProjectGridView";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { FolderKanban } from "lucide-react";

type ViewType = "timeline" | "board" | "list" | "grid";

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
              { value: "grid", label: "Grille" },
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
        {view === "list" && <ProjectListView onCreateProject={() => setCreateOpen(true)} />}
        {view === "grid" && <ProjectGridView onCreateProject={() => setCreateOpen(true)} />}
      </PageLayout>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
