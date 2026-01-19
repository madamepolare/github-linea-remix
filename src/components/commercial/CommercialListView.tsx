import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Trash2, 
  Copy, 
  Send, 
  Eye, 
  X,
  Building2,
  ArrowUpDown,
  Mail,
  Download,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CommercialDocument,
  STATUS_LABELS, 
} from '@/lib/commercialTypes';
import { cn } from '@/lib/utils';

interface CommercialListViewProps {
  documents: CommercialDocument[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkSendEmail?: (ids: string[]) => void;
}

export const CommercialListView = ({ 
  documents, 
  onDelete, 
  onDuplicate,
  onBulkDelete,
  onBulkSendEmail,
}: CommercialListViewProps) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Sorting
  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "document_number":
          comparison = a.document_number.localeCompare(b.document_number);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "client":
          comparison = (a.client_company?.name || "").localeCompare(b.client_company?.name || "");
          break;
        case "total_amount":
          comparison = (a.total_amount || 0) - (b.total_amount || 0);
          break;
        case "created_at":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [documents, sortBy, sortDir]);

  // Calculate totals
  const totals = useMemo(() => ({
    count: documents.length,
    total: documents.reduce((sum, d) => sum + (d.total_amount || 0), 0),
    sent: documents.filter(d => d.status === 'sent').reduce((sum, d) => sum + (d.total_amount || 0), 0),
    accepted: documents.filter(d => d.status === 'accepted' || d.status === 'signed').reduce((sum, d) => sum + (d.total_amount || 0), 0),
  }), [documents]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'signed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'sent':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(documents.map(d => d.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    checked ? newSet.add(id) : newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = () => {
    if (confirm(`Supprimer ${selectedIds.size} document(s) ?`)) {
      if (onBulkDelete) {
        onBulkDelete(Array.from(selectedIds));
      } else {
        selectedIds.forEach(id => onDelete(id));
      }
      setSelectedIds(new Set());
    }
  };

  const handleBulkSendEmail = () => {
    onBulkSendEmail?.(Array.from(selectedIds));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < documents.length;

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-2">Aucun document</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Créez votre premier devis pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Totals bar */}
      <div className="flex items-center gap-2 px-1 py-2 text-xs">
        <span className="text-muted-foreground">{totals.count} documents</span>
        <span className="text-muted-foreground">•</span>
        <span className="font-medium">{formatCurrency(totals.total)}</span>
        {totals.sent > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="text-blue-600">{formatCurrency(totals.sent)} en attente</span>
          </>
        )}
        {totals.accepted > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="text-emerald-600">{formatCurrency(totals.accepted)} accepté</span>
          </>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => el && ((el as any).indeterminate = someSelected)}
                />
              </TableHead>
              <TableHead 
                className="px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort("document_number")}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  Réf.
                  <ArrowUpDown className={cn("h-3 w-3", sortBy === "document_number" ? "text-foreground" : "text-muted-foreground/40")} />
                </div>
              </TableHead>
              <TableHead 
                className="px-3 cursor-pointer hover:text-foreground"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  Titre
                  <ArrowUpDown className={cn("h-3 w-3", sortBy === "title" ? "text-foreground" : "text-muted-foreground/40")} />
                </div>
              </TableHead>
              <TableHead 
                className="px-3 hidden md:table-cell cursor-pointer hover:text-foreground"
                onClick={() => handleSort("client")}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  Client
                  <ArrowUpDown className={cn("h-3 w-3", sortBy === "client" ? "text-foreground" : "text-muted-foreground/40")} />
                </div>
              </TableHead>
              <TableHead className="px-3 hidden lg:table-cell text-xs">Statut</TableHead>
              <TableHead 
                className="px-3 hidden lg:table-cell cursor-pointer hover:text-foreground"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  Date
                  <ArrowUpDown className={cn("h-3 w-3", sortBy === "created_at" ? "text-foreground" : "text-muted-foreground/40")} />
                </div>
              </TableHead>
              <TableHead 
                className="px-3 text-right cursor-pointer hover:text-foreground"
                onClick={() => handleSort("total_amount")}
              >
                <div className="flex items-center justify-end gap-1.5 text-xs">
                  Montant
                  <ArrowUpDown className={cn("h-3 w-3", sortBy === "total_amount" ? "text-foreground" : "text-muted-foreground/40")} />
                </div>
              </TableHead>
              <TableHead className="w-12 px-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDocuments.map((doc, index) => {
              const isSelected = selectedIds.has(doc.id);
              
              return (
                <TableRow
                  key={doc.id}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                  )}
                  onClick={() => navigate(`/commercial/quote/${doc.id}`)}
                >
                  <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                    />
                  </TableCell>

                  {/* Reference */}
                  <TableCell className="px-3 py-2">
                    <code className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      {doc.document_number}
                    </code>
                  </TableCell>

                  {/* Title */}
                  <TableCell className="px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">{doc.title}</span>
                      {/* Status badge on mobile */}
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] px-1.5 py-0 lg:hidden shrink-0", getStatusStyle(doc.status))}
                      >
                        {STATUS_LABELS[doc.status]}
                      </Badge>
                    </div>
                    {/* Client on mobile */}
                    {doc.client_company && (
                      <p className="text-[11px] text-muted-foreground truncate md:hidden mt-0.5">
                        {doc.client_company.name}
                      </p>
                    )}
                  </TableCell>

                  {/* Client */}
                  <TableCell className="px-3 py-2 hidden md:table-cell">
                    {doc.client_company ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-medium">
                            {doc.client_company.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {doc.client_company.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-3 py-2 hidden lg:table-cell">
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] px-1.5 py-0", getStatusStyle(doc.status))}
                    >
                      {STATUS_LABELS[doc.status]}
                    </Badge>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="px-3 py-2 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="px-3 py-2 text-right">
                    <span className="font-semibold text-sm tabular-nums">
                      {formatCurrency(doc.total_amount || 0)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => navigate(`/commercial/quote/${doc.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(doc.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => confirm('Supprimer ce document ?') && onDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background shadow-xl"
          >
            <div className="flex items-center gap-3 pr-3 border-r border-background/20">
              <span className="text-sm font-medium">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-background/20 text-background"
                onClick={handleClearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-background hover:bg-background/20"
                onClick={handleBulkSendEmail}
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Envoyer</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-background hover:bg-background/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-background hover:bg-background/20"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
