import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { ProjectBoard } from "@/components/projects/ProjectBoard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";

type ViewType = "timeline" | "board" | "list";

export default function Projects() {
  const [view, setView] = useState<ViewType>("timeline");
  const [createOpen, setCreateOpen] = useState(false);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background">
          <div className="px-6 py-4">
            <BreadcrumbNav items={breadcrumbs} />
          </div>
          
          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Projects</h1>
                <p className="text-sm text-muted-foreground">Manage your projects and track progress</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ViewSwitcher
                views={[
                  { value: "timeline", label: "Timeline" },
                  { value: "board", label: "Board" },
                  { value: "list", label: "List" },
                ]}
                value={view}
                onChange={(v) => setView(v as ViewType)}
              />

              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Project
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "timeline" && <ProjectTimeline />}
          {view === "board" && <ProjectBoard />}
          {view === "list" && (
            <div className="p-6 text-center text-muted-foreground">
              List view coming soon
            </div>
          )}
        </div>
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </MainLayout>
  );
}
