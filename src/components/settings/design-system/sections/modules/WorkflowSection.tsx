import { Badge } from "@/components/ui/badge";

export function WorkflowSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">18+ composants</Badge>
        <Badge variant="secondary">src/components/workflow/</Badge>
      </div>
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Workflow:</p>
        <ul className="text-xs space-y-1">
          <li>• WorkflowCalendar</li>
          <li>• TeamPlanningGrid</li>
          <li>• TimelinePlanningGrid</li>
          <li>• ScheduleDetailSheet</li>
        </ul>
      </div>
    </div>
  );
}
