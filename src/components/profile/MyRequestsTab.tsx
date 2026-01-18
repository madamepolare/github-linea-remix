import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamRequests, useCreateTeamRequest, TeamRequest, requestTypeLabels, priorityLabels } from "@/hooks/useTeamRequests";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { MessagesSquare, Plus, Clock, GraduationCap, Laptop, HelpCircle } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  approved: "Approuvé",
  rejected: "Refusé",
  completed: "Terminé",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
};

const typeIcons: Record<string, typeof GraduationCap> = {
  training: GraduationCap,
  equipment: Laptop,
  resource: Clock,
  other: HelpCircle,
};

export function MyRequestsTab() {
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    request_type: "training" as TeamRequest["request_type"],
    title: "",
    description: "",
    priority: "medium" as TeamRequest["priority"],
  });

  const { data: requests, isLoading } = useTeamRequests({ userId: user?.id });
  const createRequest = useCreateTeamRequest();

  const pendingRequests = requests?.filter(r => r.status === "pending" || r.status === "in_progress") || [];
  const completedRequests = requests?.filter(r => r.status === "approved" || r.status === "rejected" || r.status === "completed") || [];

  const handleCreate = async () => {
    if (!newRequest.title) return;
    await createRequest.mutateAsync(newRequest);
    setCreateOpen(false);
    setNewRequest({
      request_type: "training",
      title: "",
      description: "",
      priority: "medium",
    });
  };

  const renderRequestList = (requestList: typeof requests) => {
    if (!requestList || requestList.length === 0) {
      return (
        <EmptyState
          icon={MessagesSquare}
          title="Aucune demande"
          description="Vos demandes apparaîtront ici."
          action={{
            label: "Nouvelle demande",
            onClick: () => setCreateOpen(true),
          }}
        />
      );
    }

    return (
      <div className="space-y-3">
        {requestList.map((request) => {
          const Icon = typeIcons[request.request_type] || HelpCircle;
          return (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium">{request.title}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={statusColors[request.status]}>
                          {statusLabels[request.status]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline">{requestTypeLabels[request.request_type]}</Badge>
                      <span>•</span>
                      <span>{format(new Date(request.created_at), "d MMM yyyy", { locale: fr })}</span>
                    </div>
                    {request.description && (
                      <p className="text-sm text-muted-foreground mt-2">{request.description}</p>
                    )}
                    {request.response && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Réponse: </span>
                        {request.response}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            En cours
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {renderRequestList(pendingRequests)}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderRequestList(completedRequests)}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
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
                placeholder="Ex: Formation React avancé"
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
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="Décrivez votre demande..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newRequest.title || createRequest.isPending}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
