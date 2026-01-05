import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamTimeEntries, useValidateTimeEntry } from "@/hooks/useTeamTimeEntries";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle, XCircle, Clock, CheckCheck, X } from "lucide-react";

export function TimeValidationTab() {
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending_validation");
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: members } = useTeamMembers();
  const { data: entries, isLoading } = useTeamTimeEntries({
    userId: filterUser !== "all" ? filterUser : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const validateEntry = useValidateTimeEntry();
  const { activeWorkspace } = useAuth();

  const currentUserRole = members?.find((m) => m.user_id === activeWorkspace?.id)?.role;
  const canValidate = currentUserRole === "owner" || currentUserRole === "admin";

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, typeof members[0]>);

  const handleValidateSelected = async () => {
    for (const id of selected) {
      await validateEntry.mutateAsync({ id, action: "validate" });
    }
    setSelected([]);
  };

  const handleRejectSelected = () => {
    if (selected.length === 1) {
      setRejectingId(selected[0]);
    }
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    const ids = rejectingId ? [rejectingId] : selected;
    for (const id of ids) {
      await validateEntry.mutateAsync({ id, action: "reject", reason: rejectReason });
    }
    setRejectDialogOpen(false);
    setRejectReason("");
    setRejectingId(null);
    setSelected([]);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === entries?.length) {
      setSelected([]);
    } else {
      setSelected(entries?.map((e) => e.id) || []);
    }
  };

  if (!canValidate) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Accès restreint"
        description="Seuls les administrateurs peuvent valider les temps."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par membre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les membres</SelectItem>
            {members?.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.profile?.full_name || m.profile?.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending_validation">En attente</SelectItem>
            <SelectItem value="validated">Validés</SelectItem>
            <SelectItem value="rejected">Refusés</SelectItem>
          </SelectContent>
        </Select>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selected.length} sélectionné(s)</span>
            <Button size="sm" onClick={handleValidateSelected}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Valider
            </Button>
            <Button size="sm" variant="outline" onClick={handleRejectSelected}>
              <X className="h-4 w-4 mr-1" />
              Refuser
            </Button>
          </div>
        )}
      </div>

      {/* Entries Table */}
      {entries && entries.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={selected.length === entries.length && entries.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Membre</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Durée</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="p-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const member = memberMap?.[entry.user_id];
                  const initials = member?.profile?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?";

                  return (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selected.includes(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                          disabled={entry.status !== "pending_validation"}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member?.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member?.profile?.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {format(new Date(entry.date), "dd MMM yyyy", { locale: fr })}
                      </td>
                      <td className="p-3">
                        <div className="text-sm max-w-xs truncate">{entry.description}</div>
                        {entry.project?.name && (
                          <div className="text-xs text-muted-foreground">{entry.project.name}</div>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {Math.floor(entry.duration_minutes / 60)}h
                        {entry.duration_minutes % 60 > 0 ? ` ${entry.duration_minutes % 60}min` : ""}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={entry.status} />
                      </td>
                      <td className="p-3">
                        {entry.status === "pending_validation" && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => validateEntry.mutate({ id: entry.id, action: "validate" })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setRejectingId(entry.id);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Clock}
          title="Aucune entrée de temps"
          description="Les temps soumis par les membres apparaîtront ici."
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser les temps</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Motif du refus</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Indiquez la raison du refus..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Refuser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: "Brouillon", className: "bg-gray-100 text-gray-800" },
    pending_validation: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
    validated: { label: "Validé", className: "bg-green-100 text-green-800" },
    rejected: { label: "Refusé", className: "bg-red-100 text-red-800" },
  };

  const { label, className } = config[status] || config.draft;

  return <Badge className={className}>{label}</Badge>;
}
