import { useInvoices } from "@/hooks/useInvoices";
import { useInvoiceSchedule } from "@/hooks/useInvoiceSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { format, isPast, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  ArrowRight,
  FileText,
  CreditCard,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoicingOverviewTabProps {
  projectId: string;
  projectBudget?: number;
  onNavigateToTab: (tab: string) => void;
}

export function InvoicingOverviewTab({ projectId, projectBudget = 0, onNavigateToTab }: InvoicingOverviewTabProps) {
  const { data: allInvoices = [], isLoading: invoicesLoading } = useInvoices();
  const { scheduleItems, summary: scheduleSummary, nextDue, overdueItems, isLoading: scheduleLoading } = useInvoiceSchedule(projectId);

  // Filter invoices for this project
  const projectInvoices = allInvoices.filter(inv => inv.project_id === projectId);
  const projectCreditNotes = projectInvoices.filter(inv => (inv as any).document_type === 'credit_note');
  const projectRegularInvoices = projectInvoices.filter(inv => (inv as any).document_type !== 'credit_note');

  // Calculate totals
  const totalInvoiced = projectRegularInvoices.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
  const totalCreditNotes = projectCreditNotes.reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
  const netInvoiced = totalInvoiced - totalCreditNotes;
  
  const totalPaid = projectRegularInvoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total_ttc || 0), 0);
  
  const totalPending = projectRegularInvoices
    .filter(inv => inv.status === "sent" || inv.status === "pending")
    .reduce((sum, inv) => sum + (inv.amount_due || 0), 0);

  const overdueInvoices = projectRegularInvoices.filter(
    inv => (inv.status === "sent" || inv.status === "pending") && 
    inv.due_date && isPast(new Date(inv.due_date))
  );
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0);

  // Remaining to invoice (based on schedule or project budget)
  const remainingToInvoice = projectBudget > 0 
    ? Math.max(0, projectBudget - netInvoiced)
    : scheduleSummary.pendingAmountHt;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const invoicedPercentage = projectBudget > 0 
    ? Math.min((netInvoiced / projectBudget) * 100, 100)
    : (scheduleSummary.totalAmountHt > 0 
        ? (scheduleSummary.invoicedAmountHt / scheduleSummary.totalAmountHt) * 100 
        : 0);

  const paidPercentage = netInvoiced > 0 
    ? (totalPaid / netInvoiced) * 100 
    : 0;

  const isLoading = invoicesLoading || scheduleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Receipt className="h-4 w-4" />
              <span>Facturé net</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(netInvoiced)}</p>
            {projectBudget > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {invoicedPercentage.toFixed(0)}% du budget
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              <span>Encaissé</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPercentage.toFixed(0)}% encaissé
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              <span>En attente</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {projectRegularInvoices.filter(i => i.status === "sent" || i.status === "pending").length} facture(s)
            </p>
          </CardContent>
        </Card>
        
        <Card className={cn(totalOverdue > 0 && "border-destructive/50")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>En retard</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              totalOverdue > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {formatCurrency(totalOverdue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {overdueInvoices.length} facture(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invoicing Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progression de la facturation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Facturé</span>
                <span className="font-medium">{invoicedPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={invoicedPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(netInvoiced)}</span>
                <span>{formatCurrency(projectBudget || scheduleSummary.totalAmountHt)}</span>
              </div>
            </div>
            
            {remainingToInvoice > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Reste à facturer</span>
                <span className="font-semibold text-primary">{formatCurrency(remainingToInvoice)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Collection Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Progression des encaissements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Encaissé</span>
                <span className="font-medium">{paidPercentage.toFixed(0)}%</span>
              </div>
              <Progress 
                value={paidPercentage} 
                className="h-3 [&>div]:bg-emerald-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(totalPaid)}</span>
                <span>{formatCurrency(netInvoiced)}</span>
              </div>
            </div>
            
            {totalPending > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">À encaisser</span>
                <span className="font-semibold text-amber-600">{formatCurrency(totalPending)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Next Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Invoices */}
        {overdueInvoices.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Factures en retard
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => onNavigateToTab("factures")}
                >
                  Voir tout
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueInvoices.slice(0, 3).map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                  <div>
                    <p className="font-medium text-sm">{invoice.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{invoice.client_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-destructive">
                      {formatCurrency(invoice.amount_due || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Échue le {format(new Date(invoice.due_date!), "d MMM", { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Next Due Schedule Items */}
        {(nextDue || overdueItems.length > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Prochaines échéances
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onNavigateToTab("echeancier")}
                >
                  Voir l'échéancier
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueItems.slice(0, 2).map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-destructive/10"
                >
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-destructive">
                      En retard depuis le {format(new Date(item.planned_date), "d MMM", { locale: fr })}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(item.amount_ht)}</p>
                </div>
              ))}
              {nextDue && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <div>
                    <p className="font-medium text-sm">{nextDue.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Prévu le {format(new Date(nextDue.planned_date), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(nextDue.amount_ht)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigateToTab("factures")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projectRegularInvoices.length}</p>
              <p className="text-xs text-muted-foreground">Factures</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigateToTab("avoirs")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projectCreditNotes.length}</p>
              <p className="text-xs text-muted-foreground">Avoirs</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigateToTab("echeancier")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduleItems.length}</p>
              <p className="text-xs text-muted-foreground">Échéances</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(projectInvoices.map(i => i.client_company_id).filter(Boolean)).size}
              </p>
              <p className="text-xs text-muted-foreground">Client(s)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
