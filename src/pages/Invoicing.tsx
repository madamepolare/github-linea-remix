import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Search,
  Filter,
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
  TrendingUp,
  Euro,
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const TYPE_LABELS: Record<string, string> = {
  standard: 'Facture',
  credit_note: 'Avoir',
  proforma: 'Proforma',
  deposit: 'Acompte',
};

export default function Invoicing() {
  const navigate = useNavigate();
  const { filter } = useParams<{ filter?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | undefined>();

  const statusFilter = filter === 'pending' ? 'pending' 
    : filter === 'paid' ? 'paid' 
    : filter === 'overdue' ? 'overdue' 
    : undefined;

  const { data: invoices, isLoading } = useInvoices(statusFilter);
  const { data: stats } = useInvoiceStats();
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

    return matchesSearch && matchesType;
  });

  const handleNewInvoice = () => {
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

  return (
    <PageLayout
      title="Facturation"
      description="Gérez vos factures, avoirs et paiements"
      actions={
        <Button onClick={handleNewInvoice} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total facturé</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0)}</p>
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
                <p className="text-sm text-muted-foreground">En attente</p>
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
                <p className="text-sm text-muted-foreground">En retard</p>
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
                <p className="text-sm text-muted-foreground">Payées ce mois</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.paid || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">factures encaissées</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client, projet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="standard">Factures</SelectItem>
            <SelectItem value="credit_note">Avoirs</SelectItem>
            <SelectItem value="proforma">Proformas</SelectItem>
            <SelectItem value="deposit">Acomptes</SelectItem>
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
              <TableHead>Statut</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredInvoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucune facture trouvée</p>
                    <Button variant="outline" size="sm" onClick={handleNewInvoice}>
                      Créer une facture
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices?.map((invoice) => {
                const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusConfig.icon;
                
                return (
                  <TableRow 
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEditInvoice(invoice.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{TYPE_LABELS[invoice.invoice_type]}</p>
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
                        <span className={cn(
                          invoice.status === 'overdue' && 'text-destructive font-medium'
                        )}>
                          {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.total_ttc)}
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

      {/* Invoice Builder Sheet */}
      <InvoiceBuilderSheet
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        invoiceId={editingInvoiceId}
      />
    </PageLayout>
  );
}
