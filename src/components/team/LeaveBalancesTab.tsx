import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useLeaveBalances,
  useAllTeamBalances,
  useLeaveTypeConfig,
  useInitializeLeaveTypeConfig,
  useCreateOrUpdateLeaveBalance,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_COLORS,
  FrenchLeaveType,
  LeaveBalanceWithRemaining,
} from "@/hooks/useLeaveManagement";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Pencil,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function LeaveBalancesTab() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editBalanceOpen, setEditBalanceOpen] = useState(false);
  const [editingBalance, setEditingBalance] = useState<{
    userId: string;
    leaveType: FrenchLeaveType;
    initial: number;
    acquired: number;
    adjustment: number;
  } | null>(null);

  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { data: leaveConfig, isLoading: configLoading } = useLeaveTypeConfig();
  const { data: allBalances, isLoading: balancesLoading } = useAllTeamBalances(selectedYear);
  const initializeConfig = useInitializeLeaveTypeConfig();
  const createOrUpdateBalance = useCreateOrUpdateLeaveBalance();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, (typeof members)[0]>) || {};

  // Group balances by user
  const balancesByUser = allBalances?.reduce((acc, balance) => {
    if (!acc[balance.user_id]) {
      acc[balance.user_id] = [];
    }
    acc[balance.user_id].push(balance);
    return acc;
  }, {} as Record<string, LeaveBalanceWithRemaining[]>) || {};

  const handleEditBalance = (userId: string, leaveType: FrenchLeaveType) => {
    const existing = allBalances?.find(
      (b) => b.user_id === userId && b.leave_type === leaveType
    );
    setEditingBalance({
      userId,
      leaveType,
      initial: existing?.initial_balance || 0,
      acquired: existing?.acquired || 0,
      adjustment: existing?.adjustment || 0,
    });
    setEditBalanceOpen(true);
  };

  const handleSaveBalance = async () => {
    if (!editingBalance) return;

    await createOrUpdateBalance.mutateAsync({
      user_id: editingBalance.userId,
      leave_type: editingBalance.leaveType,
      period_year: selectedYear,
      initial_balance: editingBalance.initial,
      acquired: editingBalance.acquired,
      adjustment: editingBalance.adjustment,
    });

    setEditBalanceOpen(false);
    setEditingBalance(null);
  };

  if (membersLoading || configLoading || balancesLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // If no config, show initialization button
  if (!leaveConfig || leaveConfig.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Configuration des congés"
        description="Initialisez la configuration des types de congés pour votre équipe selon les lois françaises."
        action={{
          label: "Initialiser la configuration",
          onClick: () => initializeConfig.mutate(),
        }}
      />
    );
  }

  const activeLeaveTypes = leaveConfig.filter((c) => c.is_active && c.is_countable);

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
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        )}
      </div>

      {/* My Balances Card (for non-admins or as summary) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mes soldes de congés</CardTitle>
          <CardDescription>
            Année {selectedYear} • Période du 1er juin {selectedYear} au 31 mai {selectedYear + 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeLeaveTypes.map((config) => {
              const balance = allBalances?.find(
                (b) => b.user_id === user?.id && b.leave_type === config.leave_type
              );
              const total = (balance?.initial_balance || 0) + (balance?.acquired || 0) + (balance?.adjustment || 0);
              const taken = balance?.taken || 0;
              const remaining = total - taken;
              const percentage = total > 0 ? (remaining / total) * 100 : 0;

              return (
                <Card key={config.leave_type} className="border-l-4" style={{ borderLeftColor: config.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{config.label}</span>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${config.color}20`, 
                          color: config.color 
                        }}
                      >
                        {remaining.toFixed(1)}j
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pris: {taken.toFixed(1)}j</span>
                      <span>Total: {total.toFixed(1)}j</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Overview (admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Soldes de l'équipe</CardTitle>
            <CardDescription>
              Vue d'ensemble des congés de tous les collaborateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Collaborateur</TableHead>
                    {activeLeaveTypes.map((config) => (
                      <TableHead key={config.leave_type} className="text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-xs">{config.label}</span>
                        </div>
                      </TableHead>
                    ))}
                    {isAdmin && <TableHead className="w-[80px]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member) => {
                    const userBalances = balancesByUser[member.user_id] || [];

                    return (
                      <TableRow key={member.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {member.profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{member.profile?.full_name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        {activeLeaveTypes.map((config) => {
                          const balance = userBalances.find((b) => b.leave_type === config.leave_type);
                          const remaining = balance?.remaining || 0;
                          const total = (balance?.initial_balance || 0) + (balance?.acquired || 0) + (balance?.adjustment || 0);

                          return (
                            <TableCell key={config.leave_type} className="text-center">
                              <button
                                onClick={() => handleEditBalance(member.user_id, config.leave_type as FrenchLeaveType)}
                                className="inline-flex flex-col items-center gap-0.5 hover:bg-muted rounded-lg px-3 py-1.5 transition-colors"
                              >
                                <span className={cn(
                                  "font-semibold text-sm",
                                  remaining < 0 && "text-destructive",
                                  remaining > 0 && remaining <= 2 && "text-warning"
                                )}>
                                  {remaining.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  / {total.toFixed(1)}
                                </span>
                              </button>
                            </TableCell>
                          );
                        })}
                        {isAdmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedUserId(member.user_id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Balance Dialog */}
      <Dialog open={editBalanceOpen} onOpenChange={setEditBalanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Modifier le solde - {editingBalance && LEAVE_TYPE_LABELS[editingBalance.leaveType]}
            </DialogTitle>
          </DialogHeader>

          {editingBalance && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {memberMap[editingBalance.userId]?.profile?.full_name} • Année {selectedYear}
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    Report N-1
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editingBalance.initial}
                    onChange={(e) =>
                      setEditingBalance({
                        ...editingBalance,
                        initial: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Plus className="h-3 w-3 text-blue-500" />
                    Acquis
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editingBalance.acquired}
                    onChange={(e) =>
                      setEditingBalance({
                        ...editingBalance,
                        acquired: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Minus className="h-3 w-3 text-orange-500" />
                    Ajustement
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editingBalance.adjustment}
                    onChange={(e) =>
                      setEditingBalance({
                        ...editingBalance,
                        adjustment: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>Total disponible</span>
                  <span className="font-semibold">
                    {(editingBalance.initial + editingBalance.acquired + editingBalance.adjustment).toFixed(1)} jours
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBalanceOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveBalance} disabled={createOrUpdateBalance.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
