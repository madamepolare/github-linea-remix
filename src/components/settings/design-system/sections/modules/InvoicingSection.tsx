import { Badge } from "@/components/ui/badge";

export function InvoicingSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">5+ composants</Badge>
        <Badge variant="secondary">src/components/invoicing/</Badge>
      </div>
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Facturation:</p>
        <ul className="text-xs space-y-1">
          <li>• InvoiceBuilderSheet</li>
          <li>• InvoiceLivePreview</li>
          <li>• RecordPaymentDialog</li>
          <li>• InvoiceRemindersPanel</li>
        </ul>
      </div>
    </div>
  );
}
