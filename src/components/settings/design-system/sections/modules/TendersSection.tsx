import { Badge } from "@/components/ui/badge";

export function TendersSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">30+ composants</Badge>
        <Badge variant="secondary">src/components/tenders/</Badge>
      </div>
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Appels d'offres:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• TenderCriticalInfo</li>
          <li>• PartnerSelectionPanel</li>
          <li>• TenderDeliverablesTab</li>
          <li>• TenderMemoireTab</li>
        </ul>
      </div>
    </div>
  );
}
