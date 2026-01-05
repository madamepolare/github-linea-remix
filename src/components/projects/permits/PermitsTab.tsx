import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileCheck,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useProjectPermits,
  ProjectPermit,
  PERMIT_TYPE_LABELS,
  PERMIT_STATUS_LABELS,
  PERMIT_STATUS_COLORS,
  PermitStatus,
} from "@/hooks/useProjectPermits";
import { CreatePermitDialog } from "./CreatePermitDialog";
import { PermitDetailSheet } from "./PermitDetailSheet";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

interface PermitsTabProps {
  projectId: string;
}

export function PermitsTab({ projectId }: PermitsTabProps) {
  const { permits, isLoading, deletePermit } = useProjectPermits(projectId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<ProjectPermit | null>(null);

  const handleDelete = (permit: ProjectPermit) => {
    if (confirm(`Supprimer le permis "${PERMIT_TYPE_LABELS[permit.permit_type]}" ?`)) {
      deletePermit.mutate(permit.id);
    }
  };

  // Stats
  const stats = {
    total: permits.length,
    granted: permits.filter((p) => p.status === "granted").length,
    pending: permits.filter((p) => ["submitted", "pending", "preparing"].includes(p.status)).length,
    attention: permits.filter((p) => {
      if (p.status === "additional_info_requested") return true;
      if (p.expected_response_date && isPast(new Date(p.expected_response_date))) return true;
      return false;
    }).length,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Autorisations & Permis</h3>
          <p className="text-sm text-muted-foreground">Suivi des demandes administratives</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
          Nouveau permis
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={THIN_STROKE} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.granted}</p>
              <p className="text-xs text-muted-foreground">Accordés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" strokeWidth={THIN_STROKE} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={THIN_STROKE} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.attention}</p>
              <p className="text-xs text-muted-foreground">Attention</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permits List */}
      {permits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" strokeWidth={THIN_STROKE} />
            <h4 className="text-lg font-medium mb-2">Aucun permis</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Créez votre premier permis ou autorisation
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Ajouter un permis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {permits.map((permit, index) => (
            <motion.div
              key={permit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PermitCard
                permit={permit}
                onClick={() => setSelectedPermit(permit)}
                onDelete={() => handleDelete(permit)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <CreatePermitDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
      />

      <PermitDetailSheet
        permit={selectedPermit}
        onClose={() => setSelectedPermit(null)}
        projectId={projectId}
      />
    </div>
  );
}

interface PermitCardProps {
  permit: ProjectPermit;
  onClick: () => void;
  onDelete: () => void;
}

function PermitCard({ permit, onClick, onDelete }: PermitCardProps) {
  const daysUntilResponse = permit.expected_response_date
    ? differenceInDays(new Date(permit.expected_response_date), new Date())
    : null;

  const isOverdue = daysUntilResponse !== null && daysUntilResponse < 0 && 
    !["granted", "rejected", "expired", "withdrawn"].includes(permit.status);

  const getStatusIcon = (status: PermitStatus) => {
    switch (status) {
      case "granted":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={THIN_STROKE} />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" strokeWidth={THIN_STROKE} />;
      case "additional_info_requested":
        return <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={THIN_STROKE} />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" strokeWidth={THIN_STROKE} />;
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        isOverdue && "border-amber-500/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div className="shrink-0">
            {getStatusIcon(permit.status)}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">
                {PERMIT_TYPE_LABELS[permit.permit_type]}
                {permit.custom_type && ` - ${permit.custom_type}`}
              </h4>
              <Badge className={cn("text-xs", PERMIT_STATUS_COLORS[permit.status])}>
                {PERMIT_STATUS_LABELS[permit.status]}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {permit.reference_number && (
                <span>N° {permit.reference_number}</span>
              )}
              {permit.authority_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
                  {permit.authority_name}
                </span>
              )}
              {permit.submission_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
                  Déposé le {format(new Date(permit.submission_date), "d MMM yyyy", { locale: fr })}
                </span>
              )}
            </div>
          </div>

          {/* Expected Response */}
          {permit.expected_response_date && !["granted", "rejected"].includes(permit.status) && (
            <div className={cn(
              "text-right shrink-0",
              isOverdue && "text-amber-600"
            )}>
              <div className="text-sm font-medium">
                {isOverdue ? (
                  <>Retard de {Math.abs(daysUntilResponse!)} jours</>
                ) : (
                  <>Dans {daysUntilResponse} jours</>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(permit.expected_response_date), "d MMM yyyy", { locale: fr })}
              </div>
            </div>
          )}

          {/* Granted Date */}
          {permit.status === "granted" && permit.granted_date && (
            <div className="text-right shrink-0">
              <div className="text-sm font-medium text-emerald-600">Accordé</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(permit.granted_date), "d MMM yyyy", { locale: fr })}
              </div>
            </div>
          )}

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" strokeWidth={THIN_STROKE} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <Pencil className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRight className="h-5 w-5 text-muted-foreground" strokeWidth={THIN_STROKE} />
        </div>
      </CardContent>
    </Card>
  );
}
