import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Mail,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  Send,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useOverdueInvoicesForReminders,
  DEFAULT_REMINDER_TEMPLATES,
  generateReminderEmail,
  getSuggestedReminder,
  useLogReminderSent,
} from '@/hooks/useInvoiceReminders';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { toast } from 'sonner';

interface InvoiceRemindersPanelProps {
  onViewInvoice?: (invoiceId: string) => void;
}

export function InvoiceRemindersPanel({ onViewInvoice }: InvoiceRemindersPanelProps) {
  const { data: invoices, isLoading } = useOverdueInvoicesForReminders();
  const { agencyInfo } = useAgencyInfo();
  const logReminder = useLogReminderSent();

  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices extends (infer T)[] ? T : never | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return { label: 'Critique', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
      case 'high':
        return { label: 'Urgent', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle };
      case 'medium':
        return { label: 'Modéré', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
      default:
        return { label: 'Faible', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Bell };
    }
  };

  const handlePrepareReminder = (invoice: NonNullable<typeof invoices>[number]) => {
    setSelectedInvoice(invoice);
    
    const suggestedTemplate = getSuggestedReminder(invoice, DEFAULT_REMINDER_TEMPLATES);
    if (suggestedTemplate) {
      const { subject, body } = generateReminderEmail(
        suggestedTemplate,
        {
          invoice_number: invoice.invoice_number,
          client_name: invoice.client_name || undefined,
          amount_due: invoice.amount_due || 0,
          due_date: invoice.due_date!,
          total_ttc: invoice.total_ttc || 0,
        },
        {
          name: agencyInfo?.name,
        }
      );
      setEmailSubject(subject);
      setEmailBody(body);
    }
    
    setEmailDialogOpen(true);
  };

  const handleCopyEmail = () => {
    const fullEmail = `Objet: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullEmail);
    toast.success('Email copié dans le presse-papiers');
  };

  const handleLogReminder = async () => {
    if (!selectedInvoice) return;

    await logReminder.mutateAsync({
      invoiceId: selectedInvoice.id,
      reminderType: selectedInvoice.isOverdue ? 'after_due' : 'before_due',
      emailSubject,
      emailBody,
    });

    setEmailDialogOpen(false);
    setSelectedInvoice(null);
  };

  const overdueInvoices = invoices?.filter(i => i.isOverdue) || [];
  const upcomingDueInvoices = invoices?.filter(i => !i.isOverdue) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Relances clients
          </CardTitle>
          <CardDescription>
            Gérez les relances pour les factures en retard ou arrivant à échéance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">En retard</span>
              </div>
              <p className="text-2xl font-bold">{overdueInvoices.length}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(overdueInvoices.reduce((s, i) => s + (i.amount_due || 0), 0))}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-600">Bientôt dues</span>
              </div>
              <p className="text-2xl font-bold">{upcomingDueInvoices.length}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(upcomingDueInvoices.reduce((s, i) => s + (i.amount_due || 0), 0))}
              </p>
            </div>
          </div>

          <Separator />

          {/* Invoice List */}
          <ScrollArea className="h-[400px] -mx-4 px-4">
            {overdueInvoices.length === 0 && upcomingDueInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="font-semibold mb-1">Aucune relance à effectuer</h3>
                <p className="text-sm text-muted-foreground">
                  Toutes les factures sont à jour
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overdue Section */}
                {overdueInvoices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Factures en retard
                    </h4>
                    {overdueInvoices.map(invoice => {
                      const urgencyConfig = getUrgencyConfig(invoice.urgency);
                      const UrgencyIcon = urgencyConfig.icon;
                      
                      return (
                        <div
                          key={invoice.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{invoice.invoice_number}</p>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", urgencyConfig.color)}
                                >
                                  <UrgencyIcon className="h-3 w-3 mr-1" />
                                  +{invoice.daysOverdue}j
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                {invoice.client_name && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {invoice.client_name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Échue le {format(new Date(invoice.due_date!), 'd MMM', { locale: fr })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-destructive">
                                {formatCurrency(invoice.amount_due || 0)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrepareReminder(invoice)}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Relancer
                            </Button>
                            {onViewInvoice && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewInvoice(invoice.id)}
                              >
                                Voir
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upcoming Section */}
                {upcomingDueInvoices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Échéances à venir
                    </h4>
                    {upcomingDueInvoices.map(invoice => (
                      <div
                        key={invoice.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{invoice.invoice_number}</p>
                              <Badge variant="outline" className="text-xs">
                                Dans {Math.abs(invoice.daysOverdue)}j
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              {invoice.client_name && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {invoice.client_name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Échéance le {format(new Date(invoice.due_date!), 'd MMM', { locale: fr })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold">
                              {formatCurrency(invoice.amount_due || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrepareReminder(invoice)}
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            Rappeler
                          </Button>
                          {onViewInvoice && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onViewInvoice(invoice.id)}
                            >
                              Voir
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Email Preparation Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Préparer la relance
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Facture {selectedInvoice.invoice_number} - {selectedInvoice.client_name}
                  {selectedInvoice.isOverdue && (
                    <Badge variant="destructive" className="ml-2">
                      +{selectedInvoice.daysOverdue} jours de retard
                    </Badge>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Objet de l'email</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Corps de l'email</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyEmail}>
              <Copy className="h-4 w-4 mr-2" />
              Copier l'email
            </Button>
            <Button
              onClick={handleLogReminder}
              disabled={logReminder.isPending}
            >
              {logReminder.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Marquer comme envoyé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
