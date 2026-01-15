import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Trash2,
  Target,
  ArrowUpDown,
  ArrowRight,
  User,
} from "lucide-react";
import { useContactPipeline, PipelineEntry } from "@/hooks/useContactPipeline";
import { Pipeline, PipelineStage } from "@/hooks/useCRMPipelines";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { UnifiedEmailDialog } from "@/components/emails/UnifiedEmailDialog";

interface ProspectionListViewProps {
  pipeline: Pipeline;
  search?: string;
}

export function ProspectionListView({ pipeline, search = "" }: ProspectionListViewProps) {
  const { entries, isLoading, removeEntry, moveEntry } = useContactPipeline(pipeline.id);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("entered_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEmailEntry, setSelectedEmailEntry] = useState<PipelineEntry | null>(null);

  const stages = pipeline.stages || [];

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((entry) => {
        const contactName = entry.contact?.name?.toLowerCase() || "";
        const companyName = entry.company?.name?.toLowerCase() || "";
        const email = entry.contact?.email?.toLowerCase() || entry.company?.email?.toLowerCase() || "";
        return contactName.includes(searchLower) || companyName.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortBy === "name") {
        aVal = a.contact?.name || a.company?.name || "";
        bVal = b.contact?.name || b.company?.name || "";
      } else if (sortBy === "stage") {
        const aStage = stages.find((s) => s.id === a.stage_id);
        const bStage = stages.find((s) => s.id === b.stage_id);
        aVal = aStage?.sort_order || 0;
        bVal = bStage?.sort_order || 0;
      } else if (sortBy === "entered_at") {
        aVal = a.entered_at || a.created_at || "";
        bVal = b.entered_at || b.created_at || "";
      } else if (sortBy === "last_email") {
        aVal = a.last_email_sent_at || "";
        bVal = b.last_email_sent_at || "";
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [entries, search, sortBy, sortDir, stages]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredEntries]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      removeEntry.mutate(id);
    });
    setSelectedIds(new Set());
  };

  const getStageById = (stageId: string): PipelineStage | undefined => {
    return stages.find((s) => s.id === stageId);
  };

  const isAllSelected = filteredEntries.length > 0 && selectedIds.size === filteredEntries.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredEntries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={Target}
            title="Aucune entrée dans le pipeline"
            description="Ajoutez des contacts ou entreprises au pipeline pour commencer"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
        >
          <span className="text-sm font-medium">
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        </motion.div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 gap-1"
                    onClick={() => handleSort("name")}
                  >
                    Contact / Entreprise
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 gap-1"
                    onClick={() => handleSort("stage")}
                  >
                    Étape
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 gap-1"
                    onClick={() => handleSort("entered_at")}
                  >
                    Date d'entrée
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 gap-1"
                    onClick={() => handleSort("last_email")}
                  >
                    Dernier email
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry, index) => {
                const stage = getStageById(entry.stage_id);
                const isContact = !!entry.contact;
                const name = entry.contact?.name || entry.company?.name || "Sans nom";
                const email = entry.contact?.email || entry.company?.email;
                const avatar = entry.contact?.avatar_url || entry.company?.logo_url;
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "group hover:bg-muted/50 transition-colors",
                      selectedIds.has(entry.id) && "bg-muted/30"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(entry.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={avatar || undefined} />
                          <AvatarFallback className={isContact ? "bg-primary/10 text-primary" : "bg-secondary"}>
                            {isContact ? initials : <Building2 className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{name}</span>
                            {isContact ? (
                              <User className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {email && (
                            <p className="text-xs text-muted-foreground truncate">{email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {stage && (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: stage.color || undefined,
                            color: stage.color || undefined,
                          }}
                          className="text-xs"
                        >
                          {stage.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.entered_at
                        ? format(new Date(entry.entered_at), "d MMM yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.last_email_sent_at
                        ? format(new Date(entry.last_email_sent_at), "d MMM yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          {stages.length > 0 && (
                            <>
                              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                Déplacer vers
                              </DropdownMenuItem>
                              {stages
                                .filter((s) => s.id !== entry.stage_id)
                                .map((s) => (
                                  <DropdownMenuItem
                                    key={s.id}
                                    onClick={() =>
                                      moveEntry.mutate({ entryId: entry.id, newStageId: s.id })
                                    }
                                    className="gap-2"
                                  >
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: s.color || "#6B7280" }}
                                    />
                                    {s.name}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {email && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmailEntry(entry);
                                setEmailDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              Envoyer un email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => removeEntry.mutate(entry.id)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Retirer du pipeline
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <UnifiedEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        entityType={selectedEmailEntry?.contact_id ? "contact" : "company"}
        entityId={selectedEmailEntry?.contact_id || selectedEmailEntry?.company_id || ""}
        defaultTo={selectedEmailEntry?.contact?.email || selectedEmailEntry?.company?.email}
        recipientName={selectedEmailEntry?.contact?.name || selectedEmailEntry?.company?.name}
        companyName={selectedEmailEntry?.company?.name}
        context={`Pipeline de prospection: ${pipeline.name}`}
        onSuccess={() => setEmailDialogOpen(false)}
      />
    </div>
  );
}
