import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

type ViewType = "list" | "timeline";

function getProjectsViewFromPath(pathname: string): ViewType {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (segment === "timeline" || segment === "list") return segment;
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
        {view === "timeline" && <ProjectTimeline onCreateProject={() => setCreateOpen(true)} />}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

