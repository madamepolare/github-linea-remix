import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

type ViewType = "board" | "list";

export default function Projects() {
  const { view: urlView } = useParams();
  const view = (urlView as ViewType) || "list";
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
        {view === "board" && <ProjectBoard onCreateProject={() => setCreateOpen(true)} />}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
