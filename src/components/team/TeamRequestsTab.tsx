import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamRequests, useCreateTeamRequest, useUpdateTeamRequest, requestTypeLabels, priorityLabels, TeamRequest } from "@/hooks/useTeamRequests";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquarePlus, Plus, ArrowRight, Check } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  approved: "Approuvée",
  rejected: "Refusée",
  completed: "Terminée",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function TeamRequestsTab() {
  const [tab, setTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [newRequest, setNewRequest] = useState<Partial<TeamRequest>>({
    request_type: "other",
    title: "",
    description: "",
    priority: "medium",
  });

  const { data: requests, isLoading } = useTeamRequests();
  const { data: members } = useTeamMembers();
  const { user } = useAuth();
  const createRequest = useCreateTeamRequest();
  const updateRequest = useUpdateTeamRequest();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const myRequests = requests?.filter((r) => r.user_id === user?.id) || [];
  const pendingRequests = requests?.filter((r) => r.status === "pending" || r.status === "in_progress") || [];
  
  const filteredRequests = (tab === "my" ? myRequests : tab === "pending" ? pendingRequests : requests)
    ?.filter((r) => filterType === "all" || r.request_type === filterType);

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, typeof members[0]>);

  const handleCreate = async () => {
    if (!newRequest.title) return;
    await createRequest.mutateAsync(newRequest);
    setCreateOpen(false);
    setNewRequest({
      request_type: "other",
      title: "",
      description: "",
      priority: "medium",
    });
  };

  const handleUpdateStatus = async (id: string, status: TeamRequest["status"]) => {
    await updateRequest.mutateAsync({ id, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">
              En cours
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my">Mes demandes</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(requestTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </div>

        <TabsContent value={tab} className="mt-6">
          {filteredRequests && filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const member = memberMap?.[request.user_id];
                const initials = member?.profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?";

                return (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 mt-1">
                            <AvatarImage src={member?.profile?.avatar_url || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{request.title}</h3>
                              <Badge className={statusColors[request.status]}>
                                {statusLabels[request.status]}
                              </Badge>
                              <Badge className={priorityColors[request.priority]}>
                                {priorityLabels[request.priority]}
                              </Badge>
                              <Badge variant="outline">
                                {requestTypeLabels[request.request_type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {member?.profile?.full_name} • {format(new Date(request.created_at), "d MMM yyyy", { locale: fr })}
                            </p>
                            {request.description && (
                              <p className="text-sm mt-2">{request.description}</p>
                            )}
                            {request.response && (
                              <div className="mt-2 p-2 bg-muted rounded text-sm">
                                <strong>Réponse:</strong> {request.response}
                              </div>
                            )}
                          </div>
                        </div>
                        {canManage && request.status !== "completed" && request.status !== "rejected" && (
                          <div className="flex items-center gap-2">
                            {request.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(request.id, "in_progress")}
                              >
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Prendre en charge
                              </Button>
                            )}
                            {request.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(request.id, "completed")}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Terminer
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquarePlus}
              title="Aucune demande"
              description="Les demandes de l'équipe apparaîtront ici."
              action={{
                label: "Nouvelle demande",
                onClick: () => setCreateOpen(true),
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle demande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de demande</Label>
              <Select
                value={newRequest.request_type}
                onValueChange={(v) => setNewRequest({ ...newRequest, request_type: v as TeamRequest["request_type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(requestTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                placeholder="Titre de la demande"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRequest.description || ""}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="Décrivez votre demande..."
              />
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select
                value={newRequest.priority}
                onValueChange={(v) => setNewRequest({ ...newRequest, priority: v as TeamRequest["priority"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
            <Button onClick={handleCreate} disabled={!newRequest.title || createRequest.isPending}>
              Créer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
