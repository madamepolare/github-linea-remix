import { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  Euro,
  User,
  FileText,
  CheckCircle,
  Filter,
  Calendar,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBillableTime, useInvoicedTime, BillableTimeEntry } from "@/hooks/useBillableTime";
import { cn } from "@/lib/utils";

interface BillableTimeTabProps {
  projectId: string;
  projectName: string;
  onCreateInvoice?: (entries: BillableTimeEntry[]) => void;
}

export function BillableTimeTab({ 
  projectId, 
  projectName,
  onCreateInvoice 
}: BillableTimeTabProps) {
  const { entries, isLoading, summary } = useBillableTime(projectId);
  const { data: invoicedEntries = [], isLoading: invoicedLoading } = useInvoicedTime(projectId);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'none' | 'user' | 'month'>('none');
  const [activeTab, setActiveTab] = useState<'pending' | 'invoiced'>('pending');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Grouped data
  const groupedEntries = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups = new Map<string, { entries: BillableTimeEntry[]; totalMinutes: number; totalAmount: number }>();

    entries.forEach(entry => {
      const key = groupBy === 'user' 
        ? entry.user_id 
        : entry.date.substring(0, 7); // YYYY-MM

      const group = groups.get(key) || { entries: [], totalMinutes: 0, totalAmount: 0 };
      group.entries.push(entry);
      group.totalMinutes += entry.duration_minutes;
      group.totalAmount += entry.amount;
      groups.set(key, group);
    });

    return groups;
  }, [entries, groupBy]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const selectedEntries = entries.filter(e => selectedIds.has(e.id));
  const selectedTotal = selectedEntries.reduce((sum, e) => sum + e.amount, 0);
  const selectedHours = selectedEntries.reduce((sum, e) => sum + e.duration_minutes, 0) / 60;

  const handleCreateInvoice = () => {
    if (onCreateInvoice && selectedEntries.length > 0) {
      onCreateInvoice(selectedEntries);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temps non facturé</p>
                <p className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100">
                <Euro className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant à facturer</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entrées</p>
                <p className="text-2xl font-bold">{summary.entriesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          selectedIds.size > 0 && "ring-2 ring-primary"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <CheckCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sélection</p>
                <p className="text-2xl font-bold">
                  {selectedIds.size > 0 ? formatCurrency(selectedTotal) : "—"}
                </p>
                {selectedIds.size > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedHours.toFixed(1)}h · {selectedIds.size} entrée{selectedIds.size > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for pending/invoiced */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              À facturer
              {entries.length > 0 && (
                <Badge variant="secondary" className="ml-1">{entries.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoiced" className="gap-2">
              <Receipt className="h-4 w-4" />
              Facturé
            </TabsTrigger>
          </TabsList>

          {activeTab === 'pending' && (
            <div className="flex items-center gap-2">
              <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Regrouper par..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sans regroupement</SelectItem>
                  <SelectItem value="user">Par membre</SelectItem>
                  <SelectItem value="month">Par mois</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleCreateInvoice}
                disabled={selectedIds.size === 0}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Facturer la sélection
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="pending" className="mt-4">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                <h3 className="text-lg font-medium">Tout est facturé</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  Aucun temps en attente de facturation pour ce projet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === entries.length && entries.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Membre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow 
                      key={entry.id}
                      className={cn(selectedIds.has(entry.id) && "bg-primary/5")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleSelection(entry.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(entry.date), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={entry.user?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(entry.user?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{entry.user?.full_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {entry.description || entry.task?.title || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatDuration(entry.duration_minutes)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(entry.hourly_rate)}/h
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoiced" className="mt-4">
          {invoicedLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : invoicedEntries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucun temps facturé</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  Les entrées de temps facturées apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Membre</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead className="text-right">Facturé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicedEntries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.date), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{entry.user_id}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {entry.description || entry.task?.title || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatDuration(entry.duration_minutes)}
                      </TableCell>
                      <TableCell>
                        {entry.invoice && (
                          <Badge variant="outline">
                            {entry.invoice.invoice_number}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {entry.invoiced_at && format(new Date(entry.invoiced_at), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
