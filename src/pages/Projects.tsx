import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { ProjectGridView } from "@/components/projects/ProjectGridView";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

type ViewType = "timeline" | "board" | "list" | "grid";

export default function Projects() {
  const { view: urlView } = useParams();
  const view = (urlView as ViewType) || "timeline";
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
        {view === "timeline" && <ProjectTimeline onCreateProject={() => setCreateOpen(true)} />}
        {view === "board" && <ProjectBoard onCreateProject={() => setCreateOpen(true)} />}
        {view === "list" && <ProjectListView onCreateProject={() => setCreateOpen(true)} />}
        {view === "grid" && <ProjectGridView onCreateProject={() => setCreateOpen(true)} />}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
