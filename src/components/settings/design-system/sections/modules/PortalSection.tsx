import { Badge } from "@/components/ui/badge";

export function PortalSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">11+ composants</Badge>
        <Badge variant="secondary">src/components/portal/</Badge>
      </div>
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Portail:</p>
        <ul className="text-xs space-y-1">
          <li>• PortalHeader</li>
          <li>• PortalProjects</li>
          <li>• PortalInvoices</li>
          <li>• PortalTasks</li>
        </ul>
      </div>
    </div>
  );
}
