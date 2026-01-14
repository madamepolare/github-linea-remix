import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Receipt, Clock, RefreshCw, Building2 } from "lucide-react";
import { InvoicingOverviewTab } from "./invoicing/InvoicingOverviewTab";
import { InvoiceScheduleTab } from "./invoicing/InvoiceScheduleTab";
import { InvoiceBuilderSheet } from "@/components/invoicing/InvoiceBuilderSheet";
import { ChorusProPanel } from "./invoicing/ChorusProPanel";
import { BillableTimeTab } from "./invoicing/BillableTimeTab";
import { InvoicesListTab } from "./invoicing/InvoicesListTab";
import { CreditNotesTab } from "./invoicing/CreditNotesTab";
import { BillableTimeEntry } from "@/hooks/useBillableTime";

interface ProjectInvoicingTabProps {
  projectId: string;
  projectName: string;
}

export function ProjectInvoicingTab({ projectId, projectName }: ProjectInvoicingTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showChorusPanel, setShowChorusPanel] = useState(false);
  const [prefillTimeEntries, setPrefillTimeEntries] = useState<BillableTimeEntry[]>([]);

  const handleCreateInvoice = () => {
    setSelectedInvoiceId(null);
    setPrefillTimeEntries([]);
    setBuilderOpen(true);
  };

  const handleEditInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setPrefillTimeEntries([]);
    setBuilderOpen(true);
  };

  const handleCloseBuilder = () => {
    setBuilderOpen(false);
    setSelectedInvoiceId(null);
    setPrefillTimeEntries([]);
  };

  const handleNavigateToTab = (tab: string) => {
    const tabMap: Record<string, string> = {
      'factures': 'invoices',
      'invoices': 'invoices',
      'avoirs': 'credit-notes',
      'credit-notes': 'credit-notes',
      'echeancier': 'schedule',
      'schedule': 'schedule',
      'temps': 'time',
      'time': 'time',
    };
    setActiveTab(tabMap[tab] || tab);
  };

  const handleCreateInvoiceFromTime = (entries: BillableTimeEntry[]) => {
    setPrefillTimeEntries(entries);
    setSelectedInvoiceId(null);
    setBuilderOpen(true);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-2">
          <TabsList className="bg-transparent h-auto p-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Échéancier
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Factures
            </TabsTrigger>
            <TabsTrigger
              value="credit-notes"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Avoirs
            </TabsTrigger>
          </TabsList>

          <button
            onClick={() => setShowChorusPanel(!showChorusPanel)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Chorus Pro
          </button>
        </div>

        <div className="flex gap-4 mt-4">
          <div className={showChorusPanel ? "flex-1" : "w-full"}>
            <TabsContent value="overview" className="mt-0">
              <InvoicingOverviewTab 
                projectId={projectId} 
                onNavigateToTab={(tab) => {
                  // Map tab names to actual tab values
                  const tabMap: Record<string, string> = {
                    'factures': 'invoices',
                    'avoirs': 'credit-notes',
                    'echeancier': 'schedule',
                  };
                  setActiveTab(tabMap[tab] || tab);
                }}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <InvoiceScheduleTab 
                projectId={projectId}
                onCreateInvoice={(scheduleItem) => {
                  // Will create invoice from schedule item
                  handleCreateInvoice();
                }}
              />
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              <InvoicesListTab
                projectId={projectId}
                onCreateInvoice={handleCreateInvoice}
                onEditInvoice={handleEditInvoice}
              />
            </TabsContent>

            <TabsContent value="credit-notes" className="mt-0">
              <CreditNotesTab
                projectId={projectId}
                onEditInvoice={handleEditInvoice}
              />
            </TabsContent>
          </div>

          {showChorusPanel && (
            <div className="w-80 shrink-0">
              <ChorusProPanel 
                invoiceId={selectedInvoiceId}
              />
            </div>
          )}
        </div>
      </Tabs>

      {/* Invoice Builder Sheet */}
      <InvoiceBuilderSheet
        open={builderOpen}
        onOpenChange={handleCloseBuilder}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
}
