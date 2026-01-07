import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UnscheduledTasksList } from "./UnscheduledTasksList";
import { AIPlanningPanel } from "./AIPlanningPanel";
import { ListTodo, Sparkles, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelect?: (task: any) => void;
}

export function WorkflowSidebar({ isOpen, onClose, onTaskSelect }: WorkflowSidebarProps) {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <div
      className={cn(
        "h-full border-l bg-background flex flex-col transition-all duration-300",
        isOpen ? "w-80" : "w-0 overflow-hidden border-l-0"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Planification</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-3 mt-2" style={{ width: "calc(100% - 24px)" }}>
          <TabsTrigger value="tasks" className="text-xs">
            <ListTodo className="h-3.5 w-3.5 mr-1" />
            Tâches
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="flex-1 mt-0 data-[state=active]:flex flex-col">
          <UnscheduledTasksList onTaskSelect={onTaskSelect} />
        </TabsContent>

        <TabsContent value="ai" className="flex-1 mt-0 data-[state=active]:flex flex-col">
          <AIPlanningPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
