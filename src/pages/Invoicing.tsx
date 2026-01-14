import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Search,
  Receipt,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MoreHorizontal,
  Eye,
  Send,
  Download,
  Trash2,
  Copy,
  CreditCard,
  Building2,
  Euro,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
  Percent,
  RefreshCw,
  FileDown,
  Zap,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInvoices, useInvoiceStats, useDeleteInvoice } from '@/hooks/useInvoices';
import { InvoiceBuilderSheet } from '@/components/invoicing/InvoiceBuilderSheet';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground', icon: FileText },
  pending: { label: 'En attente', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  sent: { label: 'Envoyée', color: 'bg-blue-500/10 text-blue-600', icon: Send },
  paid: { label: 'Payée', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  overdue: { label: 'En retard', color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  cancelled: { label: 'Annulée', color: 'bg-muted text-muted-foreground line-through', icon: FileText },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  invoice: { label: 'Facture', color: 'bg-primary/10 text-primary', icon: Receipt },
  standard: { label: 'Facture', color: 'bg-primary/10 text-primary', icon: Receipt },
  credit_note: { label: 'Avoir', color: 'bg-orange-500/10 text-orange-600', icon: RefreshCw },
  proforma: { label: 'Proforma', color: 'bg-violet-500/10 text-violet-600', icon: FileText },
  deposit: { label: 'Acompte', color: 'bg-cyan-500/10 text-cyan-600', icon: CreditCard },
};

export default function Invoicing() {
  const navigate = useNavigate();
  const { filter } = useParams<{ filter?: string }>();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(filter || 'all');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | undefined>();

  const { data: invoices, isLoading } = useInvoices();
  const { data: stats, isLoading: statsLoading } = useInvoiceStats();
  const deleteInvoice = useDeleteInvoice();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = !searchQuery || 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || invoice.invoice_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Separate invoices and credit notes
  const regularInvoices = filteredInvoices?.filter(i => i.invoice_type !== 'credit_note') || [];
  const creditNotes = filteredInvoices?.filter(i => i.invoice_type === 'credit_note') || [];

  const handleNewInvoice = (type: string = 'standard') => {
    setEditingInvoiceId(undefined);
    setIsBuilderOpen(true);
  };

  const handleEditInvoice = (id: string) => {
    setEditingInvoiceId(id);
    setIsBuilderOpen(true);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Supprimer cette facture ?')) {
      deleteInvoice.mutate(id);
    }
  };

  // Calculate change indicator
  const renderChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
    return (
      <span className={cn(
        "flex items-center gap-1 text-xs",
        isPositive ? "text-emerald-600" : change < 0 ? "text-destructive" : "text-muted-foreground"
      )}>
        <Icon className="h-3 w-3" />
        {Math.abs(change).toFixed(0)}%
      </span>
    );
  };

  return (
    <PageLayout
      title="Facturation"
      description="Gérez vos factures, avoirs et paiements"
      actions={
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau document
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleNewInvoice('standard')}>
                <Receipt className="h-4 w-4 mr-2" />
                Facture
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNewInvoice('deposit')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Facture d'acompte
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNewInvoice('proforma')}>
                <FileText className="h-4 w-4 mr-2" />
                Proforma
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNewInvoice('credit_note')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Avoir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Factures
            {stats?.pending ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {stats.pending}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="credit-notes" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Avoirs
            {stats?.creditNotesCount ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {stats.creditNotesCount}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Main KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chiffre d'affaires facturé</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats?.total || 0} factures</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Euro className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente de paiement</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.pendingAmount || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats?.pending || 0} factures</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Factures en retard</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(stats?.overdueAmount || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats?.overdue || 0} factures</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Encaissé ce mois</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.thisMonthPaidAmount || 0)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{stats?.thisMonthPaidCount || 0} factures</p>
                      {stats && renderChangeIndicator(stats.thisMonthPaidAmount, stats.lastMonthPaidAmount)}
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Collection Rate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Taux de recouvrement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={stats?.collectionRate || 0} className="h-3" />
                  </div>
                  <span className="text-2xl font-bold">{stats?.collectionRate || 0}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ratio entre les montants encaissés et les montants facturés
                </p>
              </CardContent>
            </Card>

            {/* Average Payment Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Délai moyen de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats?.averagePaymentDays || 0}</span>
                  <span className="text-muted-foreground">jours</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Temps moyen entre l'émission et le paiement
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Répartition des factures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Brouillons</span>
                    <span className="font-medium">{stats?.draft || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">En attente</span>
                    <span className="font-medium">{stats?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payées</span>
                    <span className="font-medium text-emerald-600">{stats?.paid || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">En retard</span>
                    <span className="font-medium text-destructive">{stats?.overdue || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent / Overdue Invoices Quick Access */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Factures en retard
                </CardTitle>
                <CardDescription>
                  Factures dont l'échéance est dépassée
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices?.filter(i => {
                  if (!i.due_date || i.status === 'paid' || i.status === 'cancelled') return false;
                  return new Date(i.due_date) < new Date() && (i.amount_due || 0) > 0;
                }).slice(0, 5).map(invoice => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 -mx-4 px-4"
                    onClick={() => handleEditInvoice(invoice.id)}
                  >
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">{invoice.client_name || invoice.client_company?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-destructive">{formatCurrency(invoice.amount_due)}</p>
                      <p className="text-xs text-muted-foreground">
                        Échue le {format(new Date(invoice.due_date!), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!invoices || invoices.filter(i => {
                  if (!i.due_date || i.status === 'paid' || i.status === 'cancelled') return false;
                  return new Date(i.due_date) < new Date() && (i.amount_due || 0) > 0;
                }).length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p>Aucune facture en retard</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  À encaisser prochainement
                </CardTitle>
                <CardDescription>
                  Factures en attente triées par date d'échéance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices?.filter(i => 
                  (i.status === 'sent' || i.status === 'pending') && i.due_date
                ).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                .slice(0, 5).map(invoice => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 -mx-4 px-4"
                    onClick={() => handleEditInvoice(invoice.id)}
                  >
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">{invoice.client_name || invoice.client_company?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.amount_due)}</p>
                      <p className="text-xs text-muted-foreground">
                        Échéance {format(new Date(invoice.due_date!), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!invoices || invoices.filter(i => 
                  (i.status === 'sent' || i.status === 'pending') && i.due_date
                ).length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2" />
                    <p>Aucune facture en attente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, client, projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="sent">Envoyées</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payées</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="standard">Factures</SelectItem>
                <SelectItem value="deposit">Acomptes</SelectItem>
                <SelectItem value="proforma">Proformas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Restant dû</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : regularInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Aucune facture trouvée</p>
                        <Button variant="outline" size="sm" onClick={() => handleNewInvoice()}>
                          Créer une facture
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  regularInvoices.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                    const typeConfig = TYPE_CONFIG[invoice.invoice_type] || TYPE_CONFIG.standard;
                    const StatusIcon = statusConfig.icon;
                    const TypeIcon = typeConfig.icon;
                    
                    // Check if overdue
                    const isOverdue = invoice.due_date && 
                      new Date(invoice.due_date) < new Date() && 
                      invoice.status !== 'paid' && 
                      invoice.status !== 'cancelled' &&
                      (invoice.amount_due || 0) > 0;
                    
                    return (
                      <TableRow 
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEditInvoice(invoice.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded", typeConfig.color)}>
                              <TypeIcon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-medium">{invoice.invoice_number}</p>
                              <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{invoice.client_name || invoice.client_company?.name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.project_name || invoice.project?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.invoice_date), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? (
                            <span className={cn(isOverdue && 'text-destructive font-medium')}>
                              {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.total_ttc)}
                        </TableCell>
                        <TableCell>
                          {invoice.amount_due > 0 ? (
                            <span className={cn(isOverdue && 'text-destructive')}>
                              {formatCurrency(invoice.amount_due)}
                            </span>
                          ) : (
                            <span className="text-emerald-600">Soldée</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("gap-1", isOverdue ? STATUS_CONFIG.overdue.color : statusConfig.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {isOverdue ? 'En retard' : statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir / Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Envoyer par email
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Enregistrer un paiement
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Créer un avoir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Credit Notes Tab */}
        <TabsContent value="credit-notes" className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total des avoirs émis</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.creditNotesAmount || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.creditNotesCount || 0} avoirs</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un avoir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Credit Notes Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Facture liée</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Aucun avoir émis</p>
                        <Button variant="outline" size="sm" onClick={() => handleNewInvoice('credit_note')}>
                          Créer un avoir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  creditNotes.map((creditNote) => {
                    const statusConfig = STATUS_CONFIG[creditNote.status] || STATUS_CONFIG.draft;
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <TableRow 
                        key={creditNote.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEditInvoice(creditNote.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-orange-500/10">
                              <RefreshCw className="h-3.5 w-3.5 text-orange-600" />
                            </div>
                            <p className="font-medium">{creditNote.invoice_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {creditNote.client_name || creditNote.client_company?.name || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {/* Would need related_invoice_id lookup */}
                          -
                        </TableCell>
                        <TableCell>
                          {format(new Date(creditNote.invoice_date), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600">
                          -{formatCurrency(creditNote.total_ttc)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("gap-1", statusConfig.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditInvoice(creditNote.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir / Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteInvoice(creditNote.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Builder Sheet */}
      <InvoiceBuilderSheet
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        invoiceId={editingInvoiceId}
      />
    </PageLayout>
  );
}
