import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  usePayrollPeriods,
  usePayrollVariables,
  useCreatePayrollPeriod,
  useUpdatePayrollPeriod,
  useGeneratePayrollVariables,
  PayrollPeriod,
} from "@/hooks/useLeaveManagement";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarCheck,
  Plus,
  Download,
  CheckCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const STATUS_CONFIG: Record<PayrollPeriod["status"], { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  validated: { label: "Validé", color: "bg-green-100 text-green-700", icon: CheckCircle },
  exported: { label: "Exporté", color: "bg-blue-100 text-blue-700", icon: Download },
  closed: { label: "Clôturé", color: "bg-purple-100 text-purple-700", icon: CheckCircle },
};

export function PayrollExportTab() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState(new Date().getMonth() + 1);

  const { user } = useAuth();
  const { data: members } = useTeamMembers();
  const { data: periods, isLoading: periodsLoading } = usePayrollPeriods(selectedYear);
  const { data: variables, isLoading: variablesLoading } = usePayrollVariables(selectedPeriodId || "");
  const createPeriod = useCreatePayrollPeriod();
  const updatePeriod = useUpdatePayrollPeriod();
  const generateVariables = useGeneratePayrollVariables();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, (typeof members)[0]>) || {};

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId);

  const handleCreatePeriod = async () => {
    await createPeriod.mutateAsync({ year: selectedYear, month: newPeriodMonth });
    setCreateOpen(false);
  };

  const handleExportCSV = () => {
    if (!variables || !selectedPeriod) return;

    const headers = [
      "Matricule",
      "Nom",
      "CP Pris",
      "CP Restant",
      "RTT Pris",
      "RTT Restant",
      "Jours Maladie",
      "Sans Solde",
      "Formation",
      "Heures Travaillées",
      "Heures Sup",
    ];

    const rows = variables.map((v) => {
      const member = memberMap[v.user_id];
      return [
        v.user_id.slice(0, 8),
        member?.profile?.full_name || "-",
        v.cp_taken,
        v.cp_remaining,
        v.rtt_taken,
        v.rtt_remaining,
        v.sick_days,
        v.unpaid_leave_days,
        v.training_days,
        v.total_worked_hours,
        v.overtime_hours,
      ].join(";");
    });

    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `paie_${selectedPeriod.period_year}_${String(selectedPeriod.period_month).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    // Mark as exported
    updatePeriod.mutate({ id: selectedPeriod.id, status: "exported" });
  };

  if (periodsLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg min-w-[80px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(selectedYear + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle période
          </Button>
        )}
      </div>

      {/* Periods Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {MONTHS.map((monthName, idx) => {
          const month = idx + 1;
          const period = periods?.find((p) => p.period_month === month);
          const status = period ? STATUS_CONFIG[period.status] : null;
          const StatusIcon = status?.icon || FileText;

          return (
            <Card
              key={month}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedPeriodId === period?.id && "ring-2 ring-primary",
                !period && "opacity-50"
              )}
              onClick={() => period && setSelectedPeriodId(period.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{monthName}</span>
                  {status && (
                    <StatusIcon className={cn("h-4 w-4", status.color.replace("bg-", "text-").split(" ")[1])} />
                  )}
                </div>
                {period ? (
                  <Badge className={cn("text-[10px]", status?.color)}>
                    {status?.label}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Non créé</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Period Details */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {MONTHS[selectedPeriod.period_month - 1]} {selectedPeriod.period_year}
                </CardTitle>
                <CardDescription>
                  Du {format(new Date(selectedPeriod.start_date), "d MMMM", { locale: fr })} au{" "}
                  {format(new Date(selectedPeriod.end_date), "d MMMM yyyy", { locale: fr })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateVariables.mutate(selectedPeriod.id)}
                  disabled={generateVariables.isPending}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", generateVariables.isPending && "animate-spin")} />
                  Calculer
                </Button>
                {selectedPeriod.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePeriod.mutate({ id: selectedPeriod.id, status: "validated" })}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider
                  </Button>
                )}
                {(selectedPeriod.status === "validated" || selectedPeriod.status === "exported") && (
                  <Button size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {variablesLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : variables && variables.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collaborateur</TableHead>
                      <TableHead className="text-center">CP Pris</TableHead>
                      <TableHead className="text-center">CP Restant</TableHead>
                      <TableHead className="text-center">RTT Pris</TableHead>
                      <TableHead className="text-center">RTT Restant</TableHead>
                      <TableHead className="text-center">Maladie</TableHead>
                      <TableHead className="text-center">Sans Solde</TableHead>
                      <TableHead className="text-center">Formation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variables.map((variable) => {
                      const member = memberMap[variable.user_id];

                      return (
                        <TableRow key={variable.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member?.profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {member?.profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{member?.profile?.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {variable.cp_taken > 0 ? (
                              <Badge variant="secondary">{variable.cp_taken}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {variable.cp_remaining}
                          </TableCell>
                          <TableCell className="text-center">
                            {variable.rtt_taken > 0 ? (
                              <Badge variant="secondary">{variable.rtt_taken}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {variable.rtt_remaining}
                          </TableCell>
                          <TableCell className="text-center">
                            {variable.sick_days > 0 ? (
                              <Badge variant="destructive">{variable.sick_days}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {variable.unpaid_leave_days > 0 ? (
                              <Badge variant="outline">{variable.unpaid_leave_days}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {variable.training_days > 0 ? (
                              <Badge className="bg-emerald-100 text-emerald-700">{variable.training_days}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title="Aucune donnée"
                description="Cliquez sur 'Calculer' pour générer les variables de paie de cette période."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Period Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une période de paie</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mois</label>
              <Select
                value={String(newPeriodMonth)}
                onValueChange={(v) => setNewPeriodMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((name, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>
                      {name} {selectedYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePeriod} disabled={createPeriod.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
