import { Badge } from "@/components/ui/badge";

export function CommercialSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">21+ composants</Badge>
        <Badge variant="secondary">src/components/commercial/</Badge>
      </div>
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Commercial:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• QuoteGridEditor</li>
          <li>• CommercialPipeline</li>
          <li>• DocumentPreviewPanel</li>
          <li>• PDFPreviewDialog</li>
        </ul>
      </div>
    </div>
  );
}
