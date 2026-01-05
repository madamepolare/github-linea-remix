import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { ProjectListView } from "@/components/projects/ProjectListView";
import { ProjectGridView } from "@/components/projects/ProjectGridView";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";

type ViewType = "timeline" | "board" | "list" | "grid";

export default function Projects() {
  const { view: urlView } = useParams();
  const navigate = useNavigate();
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
      <PageLayout
        title="Projets"
        description="Gérez vos projets et suivez leur progression"
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
