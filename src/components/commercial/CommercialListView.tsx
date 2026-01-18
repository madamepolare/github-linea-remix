import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreVertical, 
  Trash2, 
  Copy, 
  Send, 
  Eye, 
  MessageCircle, 
  X,
  Building2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  Mail,
  Download
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  DocumentType,
  STATUS_LABELS, 
  STATUS_COLORS,
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
  onUpdateNotes,
  onBulkDelete,
  onBulkSendEmail,
}: CommercialListViewProps) => {
  const navigate = useNavigate();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
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

  // Get profitability indicator based on fee percentage or margin
  const getProfitabilityIndicator = (doc: CommercialDocument) => {
    const feePercentage = doc.fee_percentage || 0;
    if (feePercentage >= 12) {
      return { icon: TrendingUp, color: 'text-success', label: 'Bonne marge' };
    } else if (feePercentage >= 8) {
      return { icon: Minus, color: 'text-warning', label: 'Marge moyenne' };
    } else if (feePercentage > 0) {
      return { icon: TrendingDown, color: 'text-destructive', label: 'Marge faible' };
    }
    return null;
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
  const totals = {
    count: documents.length,
    total: documents.reduce((sum, d) => sum + (d.total_amount || 0), 0),
    sent: documents.filter(d => d.status === 'sent').reduce((sum, d) => sum + (d.total_amount || 0), 0),
    accepted: documents.filter(d => d.status === 'accepted' || d.status === 'signed').reduce((sum, d) => sum + (d.total_amount || 0), 0),
  };

  const handleOpenNotes = (doc: CommercialDocument) => {
    setEditingNotes(doc.id);
    setNotesValue((doc as any).notes || '');
  };

  const handleSaveNotes = (docId: string) => {
    onUpdateNotes?.(docId, notesValue);
    setEditingNotes(null);
    setNotesValue('');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'signed':
        return 'bg-success/10 text-success border-success/20';
      case 'sent':
        return 'bg-info/10 text-info border-info/20';
      case 'draft':
        return 'bg-muted text-muted-foreground border-muted';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return '';
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(documents.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

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
    if (onBulkSendEmail) {
      onBulkSendEmail(Array.from(selectedIds));
    }
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

  return (
    <div className="space-y-3">
      {/* Sticky totals bar - CRM style */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="text-muted-foreground">{totals.count}</span>
            <span className="font-medium">documents</span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatCurrency(totals.total)}</span>
          </div>
          {totals.sent > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-info/10 text-info">
              <span className="text-xs">En attente</span>
              <span className="font-medium">{formatCurrency(totals.sent)}</span>
            </div>
          )}
          {totals.accepted > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-success/10 text-success">
              <span className="text-xs">Accepté</span>
              <span className="font-medium">{formatCurrency(totals.accepted)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Table view - CRM style */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10 pr-0">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Tout sélectionner"
                  className={someSelected ? "data-[state=checked]:bg-primary" : ""}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                />
              </TableHead>
              <TableHead 
                className="w-[130px] cursor-pointer hover:text-foreground"
                onClick={() => handleSort("document_number")}
              >
                <div className="flex items-center gap-1">
                  Référence
                  <ArrowUpDown className={cn(
                    "h-3 w-3",
                    sortBy === "document_number" ? "text-foreground" : "text-muted-foreground/50"
                  )} />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center gap-1">
                  Document
                  <ArrowUpDown className={cn(
                    "h-3 w-3",
                    sortBy === "title" ? "text-foreground" : "text-muted-foreground/50"
                  )} />
                </div>
              </TableHead>
              <TableHead 
                className="hidden md:table-cell cursor-pointer hover:text-foreground"
                onClick={() => handleSort("client")}
              >
                <div className="flex items-center gap-1">
                  Client
                  <ArrowUpDown className={cn(
                    "h-3 w-3",
                    sortBy === "client" ? "text-foreground" : "text-muted-foreground/50"
                  )} />
                </div>
              </TableHead>
              <TableHead 
                className="hidden lg:table-cell w-[100px] cursor-pointer hover:text-foreground"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className={cn(
                    "h-3 w-3",
                    sortBy === "created_at" ? "text-foreground" : "text-muted-foreground/50"
                  )} />
                </div>
              </TableHead>
              <TableHead 
                className="text-right w-[110px] cursor-pointer hover:text-foreground"
                onClick={() => handleSort("total_amount")}
              >
                <div className="flex items-center justify-end gap-1">
                  Montant
                  <ArrowUpDown className={cn(
                    "h-3 w-3",
                    sortBy === "total_amount" ? "text-foreground" : "text-muted-foreground/50"
                  )} />
                </div>
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDocuments.map((doc, index) => {
              const hasNotes = !!(doc as any).notes;
              const profitability = getProfitabilityIndicator(doc);
              const isSelected = selectedIds.has(doc.id);
              
              return (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    isSelected ? "bg-muted/30" : "hover:bg-muted/20"
                  )}
                  onClick={() => navigate(`/commercial/quote/${doc.id}`)}
                >
                  {/* Checkbox */}
                  <TableCell className="py-2.5 pr-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                      aria-label={`Sélectionner ${doc.document_number}`}
                    />
                  </TableCell>

                  {/* Reference number - Mono style */}
                  <TableCell className="py-2.5">
                    <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {doc.document_number}
                    </code>
                  </TableCell>

                  {/* Title + Status */}
                  <TableCell className="py-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate max-w-[200px]">
                          {doc.title}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5 py-0 shrink-0", getStatusBadgeVariant(doc.status))}
                        >
                          {STATUS_LABELS[doc.status]}
                        </Badge>
                        {profitability && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <profitability.icon className={cn("h-3.5 w-3.5 shrink-0", profitability.color)} />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {profitability.label} ({doc.fee_percentage}%)
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {/* Client on mobile */}
                      <div className="flex items-center gap-2 md:hidden">
                        {doc.client_company && (
                          <span className="text-xs text-muted-foreground truncate">
                            {doc.client_company.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="py-2.5 hidden md:table-cell">
                    {doc.client_company ? (
                      <div className="flex items-center gap-2">
                        {doc.client_company.logo_url ? (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={doc.client_company.logo_url} />
                            <AvatarFallback className="text-[9px] bg-muted">
                              {doc.client_company.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {doc.client_company.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="py-2.5 hidden lg:table-cell">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: fr })}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {format(new Date(doc.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="py-2.5 text-right">
                    <span className="font-semibold text-sm tabular-nums">
                      {formatCurrency(doc.total_amount || 0)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Notes */}
                      <TooltipProvider>
                        <Popover 
                          open={editingNotes === doc.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              handleSaveNotes(doc.id);
                            }
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={cn(
                                    "h-7 w-7",
                                    hasNotes ? "text-warning" : "opacity-0 group-hover:opacity-100 text-muted-foreground"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenNotes(doc);
                                  }}
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </Button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {hasNotes ? 'Voir les notes' : 'Ajouter une note'}
                            </TooltipContent>
                          </Tooltip>
                          <PopoverContent 
                            className="w-72 p-3" 
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Notes</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5"
                                  onClick={() => handleSaveNotes(doc.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <Textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="Ajouter des notes..."
                                className="min-h-[80px] text-sm resize-none"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TooltipProvider>

                      {/* Dropdown menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/commercial/quote/${doc.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir / Modifier
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
                            onClick={() => {
                              if (confirm('Supprimer ce document ?')) {
                                onDelete(doc.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions Bar - CRM style */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background shadow-2xl border border-foreground/10"
          >
            {/* Count & close */}
            <div className="flex items-center gap-3 pr-3 border-r border-background/20">
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedIds.size} document{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
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

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-background hover:bg-background/20 hover:text-background"
                onClick={handleBulkSendEmail}
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Envoyer</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-background hover:bg-background/20 hover:text-background"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-background hover:bg-background/20 hover:text-background"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter en PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer ({selectedIds.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
