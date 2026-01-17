import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { ProjectCardsView } from "@/components/projects/ProjectCardsView";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

type ViewType = "list" | "cards" | "board" | "timeline";

function getProjectsViewFromPath(pathname: string): ViewType {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (segment === "board" || segment === "timeline" || segment === "list" || segment === "cards") return segment;
  return "list";
}

export default function Projects() {
  const { pathname } = useLocation();
  const view = useMemo(() => getProjectsViewFromPath(pathname), [pathname]);
  const [createOpen, setCreateOpen] = useState(false);

  // Listen for command palette event
  useEffect(() => {
    const handleOpen = () => setCreateOpen(true);
    window.addEventListener("open-create-project", handleOpen);
    return () => window.removeEventListener("open-create-project", handleOpen);
  }, []);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {view === "list" && <ProjectListView onCreateProject={() => setCreateOpen(true)} />}
        {view === "cards" && <ProjectCardsView onCreateProject={() => setCreateOpen(true)} />}
        {view === "board" && <ProjectBoard onCreateProject={() => setCreateOpen(true)} />}
        {view === "timeline" && <ProjectTimeline onCreateProject={() => setCreateOpen(true)} />}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

