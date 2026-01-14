import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InvoiceScheduleItem } from "@/hooks/useInvoiceSchedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  FileText,
  Send,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceScheduleInlineRowProps {
  item: InvoiceScheduleItem;
  index: number;
  totalCA: number;
  isLast: boolean;
  onUpdate: (data: { 
    id: string; 
    percentage?: number; 
    amount_ht?: number; 
    planned_date?: string;
    vat_rate?: number;
  }) => Promise<void>;
  onDelete: (id: string) => void;
  onCreateInvoice?: (item: InvoiceScheduleItem) => void;
  onViewInvoice?: (invoiceId: string) => void;
  isUpdating?: boolean;
}

export function InvoiceScheduleInlineRow({
  item,
  index,
  totalCA,
  isLast,
  onUpdate,
  onDelete,
  onCreateInvoice,
  onViewInvoice,
  isUpdating,
}: InvoiceScheduleInlineRowProps) {
  const [isEditingPercentage, setIsEditingPercentage] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [localPercentage, setLocalPercentage] = useState(item.percentage || 0);
  const [localAmount, setLocalAmount] = useState(item.amount_ht);
  const [localDate, setLocalDate] = useState(item.planned_date);
  
  const percentageInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingPercentage && percentageInputRef.current) {
      percentageInputRef.current.focus();
      percentageInputRef.current.select();
    }
  }, [isEditingPercentage]);

  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus();
      amountInputRef.current.select();
    }
  }, [isEditingAmount]);

  useEffect(() => {
    if (isEditingDate && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [isEditingDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusConfig = () => {
    if (item.status === 'paid') {
      return { label: "Payé", variant: "default" as const, icon: CheckCircle, color: "bg-emerald-500" };
    }
    if (item.status === 'invoiced') {
      return { label: "Facturé", variant: "secondary" as const, icon: Receipt, color: "bg-blue-500" };
    }
    if (item.status === 'cancelled') {
      return { label: "Annulé", variant: "outline" as const, icon: AlertTriangle, color: "bg-muted" };
    }
    
    const isOverdue = new Date(item.planned_date) < new Date() && new Date(item.planned_date).toDateString() !== new Date().toDateString();
    if (isOverdue) {
      return { label: "En retard", variant: "destructive" as const, icon: AlertTriangle, color: "bg-destructive" };
    }
    
    return { label: "À venir", variant: "outline" as const, icon: Clock, color: "bg-muted" };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const handlePercentageChange = async () => {
    setIsEditingPercentage(false);
    if (localPercentage !== item.percentage) {
      // Calculate new amount from percentage
      const newAmount = totalCA > 0 ? (localPercentage / 100) * totalCA : localAmount;
      await onUpdate({
        id: item.id,
        percentage: localPercentage,
        amount_ht: newAmount,
        vat_rate: item.vat_rate,
      });
      setLocalAmount(newAmount);
    }
  };

  const handleAmountChange = async () => {
    setIsEditingAmount(false);
    if (localAmount !== item.amount_ht) {
      // Calculate new percentage from amount
      const newPercentage = totalCA > 0 ? (localAmount / totalCA) * 100 : item.percentage || 0;
      await onUpdate({
        id: item.id,
        amount_ht: localAmount,
        percentage: Math.round(newPercentage * 10) / 10,
        vat_rate: item.vat_rate,
      });
      setLocalPercentage(Math.round(newPercentage * 10) / 10);
    }
  };

  const handleDateChange = async () => {
    setIsEditingDate(false);
    if (localDate !== item.planned_date) {
      await onUpdate({
        id: item.id,
        planned_date: localDate,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, onSave: () => void, onCancel: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={cn(
      "group flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
      isUpdating && "opacity-50 pointer-events-none"
    )}>
      {/* Timeline indicator */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center border-2 font-semibold text-sm",
          item.status === 'paid' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700" :
          item.status === 'invoiced' ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700" :
          "border-muted-foreground/30 bg-muted text-muted-foreground"
        )}>
          {index + 1}
        </div>
        {!isLast && (
          <div className="w-0.5 h-6 bg-muted mt-1" />
        )}
      </div>

      {/* Title and details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">
            Facture n°{index + 1}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground truncate">
            {item.title}
          </span>
          <Badge variant={statusConfig.variant} className="text-xs shrink-0">
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
        
        {item.invoice && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Facture {item.invoice.invoice_number}</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {item.invoice.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Percentage - Inline editable */}
      <div className="w-20 shrink-0">
        {isEditingPercentage ? (
          <div className="flex items-center">
            <Input
              ref={percentageInputRef}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={localPercentage}
              onChange={(e) => setLocalPercentage(parseFloat(e.target.value) || 0)}
              onBlur={handlePercentageChange}
              onKeyDown={(e) => handleKeyDown(e, handlePercentageChange, () => {
                setLocalPercentage(item.percentage || 0);
                setIsEditingPercentage(false);
              })}
              className="h-8 w-16 text-right pr-1"
            />
            <span className="ml-1 text-sm text-muted-foreground">%</span>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingPercentage(true)}
            className="w-full text-right px-2 py-1 rounded hover:bg-muted transition-colors group/edit"
            title="Cliquer pour modifier"
          >
            <span className="font-medium">{item.percentage || 0}%</span>
            <Edit className="h-3 w-3 ml-1 inline opacity-0 group-hover/edit:opacity-50" />
          </button>
        )}
      </div>

      {/* Amount - Inline editable */}
      <div className="w-32 shrink-0">
        {isEditingAmount ? (
          <Input
            ref={amountInputRef}
            type="number"
            min={0}
            step={100}
            value={localAmount}
            onChange={(e) => setLocalAmount(parseFloat(e.target.value) || 0)}
            onBlur={handleAmountChange}
            onKeyDown={(e) => handleKeyDown(e, handleAmountChange, () => {
              setLocalAmount(item.amount_ht);
              setIsEditingAmount(false);
            })}
            className="h-8 text-right"
          />
        ) : (
          <button
            onClick={() => setIsEditingAmount(true)}
            className="w-full text-right px-2 py-1 rounded hover:bg-muted transition-colors group/edit"
            title="Cliquer pour modifier"
          >
            <span className="font-semibold">{formatCurrency(item.amount_ht)}</span>
            <Edit className="h-3 w-3 ml-1 inline opacity-0 group-hover/edit:opacity-50" />
          </button>
        )}
      </div>

      {/* Date - Inline editable */}
      <div className="w-36 shrink-0">
        {isEditingDate ? (
          <Input
            ref={dateInputRef}
            type="date"
            value={localDate}
            onChange={(e) => setLocalDate(e.target.value)}
            onBlur={handleDateChange}
            onKeyDown={(e) => handleKeyDown(e, handleDateChange, () => {
              setLocalDate(item.planned_date);
              setIsEditingDate(false);
            })}
            className="h-8"
          />
        ) : (
          <button
            onClick={() => setIsEditingDate(true)}
            className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted transition-colors text-sm group/edit"
            title="Cliquer pour modifier"
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{format(new Date(item.planned_date), "d MMM yyyy", { locale: fr })}</span>
            <Edit className="h-3 w-3 ml-auto opacity-0 group-hover/edit:opacity-50" />
          </button>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {item.status === 'pending' && onCreateInvoice && (
            <DropdownMenuItem onClick={() => onCreateInvoice(item)}>
              <Receipt className="h-4 w-4 mr-2" />
              Créer la facture
            </DropdownMenuItem>
          )}
          {item.invoice && onViewInvoice && (
            <>
              <DropdownMenuItem onClick={() => onViewInvoice(item.invoice!.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir la facture
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Send className="h-4 w-4 mr-2" />
                Envoyer par email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <RefreshCw className="h-4 w-4 mr-2" />
                Créer un avoir
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
