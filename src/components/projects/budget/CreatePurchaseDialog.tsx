import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarIcon,
  Upload,
  FileText,
  Receipt,
  X,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  PURCHASE_CATEGORIES,
  PURCHASE_TYPES,
  VAT_RATES,
  PurchaseCategory,
  PurchaseType,
  PurchaseStatus,
} from "@/lib/purchaseTypes";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjectBudgetEnvelopes } from "@/hooks/useProjectBudgetEnvelopes";
import type { ProjectPurchase, CreatePurchaseInput } from "@/hooks/useProjectPurchases";

const purchaseSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  purchase_type: z.enum(["provision", "supplier_invoice"]),
  purchase_category: z.enum([
    "subcontract",
    "printing",
    "rental",
    "transport",
    "material",
    "service",
    "other",
  ]),
  supplier_id: z.string().optional(),
  supplier_name: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_date: z.date().optional().nullable(),
  due_date: z.date().optional().nullable(),
  amount_ht: z.number().min(0, "Le montant doit être positif"),
  vat_rate: z.number().default(20),
  selling_price: z.number().optional().nullable(),
  notes: z.string().optional(),
  budget_envelope_id: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

interface CreatePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  purchase?: ProjectPurchase | null;
  defaultEnvelopeId?: string;
  onSubmit: (data: CreatePurchaseInput) => void;
  isLoading?: boolean;
}

export function CreatePurchaseDialog({
  open,
  onOpenChange,
  projectId,
  purchase,
  defaultEnvelopeId,
  onSubmit,
  isLoading = false,
}: CreatePurchaseDialogProps) {
  const isEditing = !!purchase;
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(
    purchase?.purchase_type || "provision"
  );

  const { companies } = useCRMCompanies();
  const { envelopes } = useProjectBudgetEnvelopes(projectId);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      title: "",
      description: "",
      purchase_type: "provision",
      purchase_category: "other",
      supplier_id: "",
      supplier_name: "",
      invoice_number: "",
      invoice_date: null,
      due_date: null,
      amount_ht: 0,
      vat_rate: 20,
      selling_price: null,
      notes: "",
      budget_envelope_id: defaultEnvelopeId || "",
    },
  });

  // Reset form when purchase changes
  useEffect(() => {
    if (purchase) {
      form.reset({
        title: purchase.title,
        description: purchase.description || "",
        purchase_type: purchase.purchase_type,
        purchase_category: purchase.purchase_category,
        supplier_id: purchase.supplier_id || "",
        supplier_name: purchase.supplier_name || "",
        invoice_number: purchase.invoice_number || "",
        invoice_date: purchase.invoice_date ? new Date(purchase.invoice_date) : null,
        due_date: purchase.due_date ? new Date(purchase.due_date) : null,
        amount_ht: purchase.amount_ht,
        vat_rate: purchase.vat_rate || 20,
        selling_price: purchase.selling_price,
        notes: purchase.notes || "",
        budget_envelope_id: purchase.budget_envelope_id || defaultEnvelopeId || "",
      });
      setPurchaseType(purchase.purchase_type);
    } else {
      form.reset({
        title: "",
        description: "",
        purchase_type: "provision",
        purchase_category: "other",
        supplier_id: "",
        supplier_name: "",
        invoice_number: "",
        invoice_date: null,
        due_date: null,
        amount_ht: 0,
        vat_rate: 20,
        selling_price: null,
        notes: "",
        budget_envelope_id: defaultEnvelopeId || "",
      });
      setPurchaseType("provision");
    }
  }, [purchase, form, defaultEnvelopeId]);

  const handleSubmit = (values: PurchaseFormValues) => {
    const data: CreatePurchaseInput = {
      project_id: projectId,
      title: values.title,
      description: values.description,
      purchase_type: values.purchase_type,
      purchase_category: values.purchase_category,
      supplier_id: values.supplier_id || undefined,
      supplier_name: values.supplier_name || undefined,
      invoice_number: values.invoice_number || undefined,
      invoice_date: values.invoice_date
        ? format(values.invoice_date, "yyyy-MM-dd")
        : undefined,
      due_date: values.due_date
        ? format(values.due_date, "yyyy-MM-dd")
        : undefined,
      amount_ht: values.amount_ht,
      vat_rate: values.vat_rate,
      selling_price: values.selling_price || undefined,
      notes: values.notes,
      budget_envelope_id: values.budget_envelope_id || undefined,
    };

    onSubmit(data);
  };

  const watchAmountHT = form.watch("amount_ht") || 0;
  const watchVatRate = form.watch("vat_rate") || 0;
  const watchSellingPrice = form.watch("selling_price");
  const amountTTC = watchAmountHT * (1 + watchVatRate / 100);
  const margin = watchSellingPrice ? watchSellingPrice - watchAmountHT : null;
  const marginPercent = watchSellingPrice && watchSellingPrice > 0
    ? ((margin || 0) / watchSellingPrice) * 100
    : null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'achat" : "Nouvel achat"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de l'achat"
              : "Créez une provision ou enregistrez une facture fournisseur"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Type Tabs */}
            <FormField
              control={form.control}
              name="purchase_type"
              render={({ field }) => (
                <FormItem>
                  <Tabs
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setPurchaseType(value as PurchaseType);
                    }}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="provision" className="flex-1 gap-2">
                        <FileText className="h-4 w-4" />
                        Provision
                      </TabsTrigger>
                      <TabsTrigger value="supplier_invoice" className="flex-1 gap-2">
                        <Receipt className="h-4 w-4" />
                        Facture fournisseur
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormItem>
              )}
            />

            {/* Title & Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Impression flyers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PURCHASE_CATEGORIES).map(([key, cat]) => {
                          const Icon = cat.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", cat.color)} />
                                {cat.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Détails de l'achat..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget Envelope */}
            {envelopes.length > 0 && (
              <FormField
                control={form.control}
                name="budget_envelope_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enveloppe budgétaire</FormLabel>
                    <Select value={field.value || "__none__"} onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune enveloppe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune enveloppe</SelectItem>
                        {envelopes.filter(e => e.status === 'active').map((envelope) => (
                          <SelectItem key={envelope.id} value={envelope.id}>
                            <div className="flex items-center justify-between gap-4">
                              <span>{envelope.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(envelope.remaining_amount)} restant
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Supplier */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fournisseur (CRM)</FormLabel>
                    <Select 
                      value={field.value || "__none__"} 
                      onValueChange={(value) => {
                        const actualValue = value === "__none__" ? "" : value;
                        field.onChange(actualValue);
                        if (actualValue) {
                          form.setValue("supplier_name", "");
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Aucun</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {company.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ou nom libre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nom du fournisseur"
                        {...field}
                        disabled={!!form.watch("supplier_id")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Invoice fields (for supplier_invoice type) */}
            {purchaseType === "supplier_invoice" && (
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° Facture</FormLabel>
                      <FormControl>
                        <Input placeholder="FAC-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date facture</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "dd/MM/yyyy", { locale: fr })
                                : "Sélectionner"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Échéance</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value
                                ? format(field.value, "dd/MM/yyyy", { locale: fr })
                                : "Sélectionner"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount_ht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant HT *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vat_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TVA</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(parseFloat(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VAT_RATES.map((rate) => (
                          <SelectItem key={rate.value} value={String(rate.value)}>
                            {rate.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-muted-foreground">Montant TTC</Label>
                <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                  {formatCurrency(amountTTC)}
                </div>
              </div>
            </div>

            {/* Selling price (optional) */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="selling_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de vente (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Pour calcul marge"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => 
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {margin !== null && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Marge</Label>
                    <div className={cn(
                      "h-10 flex items-center px-3 rounded-md text-sm font-medium",
                      margin >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
                    )}>
                      {formatCurrency(margin)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">% Marge</Label>
                    <div className={cn(
                      "h-10 flex items-center px-3 rounded-md text-sm font-medium",
                      (marginPercent || 0) >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
                    )}>
                      {marginPercent !== null ? `${marginPercent.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes internes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes, commentaires..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
