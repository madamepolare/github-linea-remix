import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ListTodo, Plus, Calendar, Loader2, CheckCircle2, Clock, AlertCircle, MessageSquarePlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  project: { id: string; name: string; color: string | null } | null;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  project: { id: string; name: string; color: string | null } | null;
}

interface Project {
  id: string;
  name: string;
}

interface PortalTasksProps {
  tasks: Task[];
  requests: Request[];
  projects: Project[];
  canAddTasks: boolean;
  onCreateRequest: (title: string, description: string, projectId?: string) => Promise<{ success: boolean; error?: string }>;
}

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  todo: { label: 'À faire', icon: Clock, className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours', icon: Loader2, className: 'bg-primary/10 text-primary' },
  done: { label: 'Terminée', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'En attente', icon: Clock, className: 'bg-amber-100 text-amber-700' },
  reviewed: { label: 'Examinée', icon: CheckCircle2, className: 'bg-blue-100 text-blue-700' },
  converted: { label: 'Convertie', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusée', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-amber-600',
  high: 'text-orange-600',
  urgent: 'text-destructive',
};

export function PortalTasks({ tasks, requests, projects, canAddTasks, onCreateRequest }: PortalTasksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    projectId: '',
  });

  const handleSubmit = async () => {
    if (!newRequest.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setIsSubmitting(true);
    const result = await onCreateRequest(
      newRequest.title,
      newRequest.description,
      newRequest.projectId || undefined
    );

    if (result.success) {
      toast.success('Demande envoyée avec succès');
      setNewRequest({ title: '', description: '', projectId: '' });
      setIsDialogOpen(false);
    } else {
      toast.error(result.error || 'Erreur lors de l\'envoi');
    }
    setIsSubmitting(false);
  };

  const isEmpty = tasks.length === 0 && requests.length === 0;

  return (
    <div className="space-y-6">
      {/* Header with action */}
      {canAddTasks && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle demande
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Soumettre une demande</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre *</label>
                  <Input
                    placeholder="Décrivez brièvement votre demande"
                    value={newRequest.title}
                    onChange={e => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Détaillez votre demande..."
                    value={newRequest.description}
                    onChange={e => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>
                {projects.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Projet concerné</label>
                    <Select
                      value={newRequest.projectId}
                      onValueChange={value => setNewRequest(prev => ({ ...prev, projectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isEmpty ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ListTodo className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune tâche ou demande pour le moment</p>
            {canAddTasks && (
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Soumettre votre première demande
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Client requests */}
          {requests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Vos demandes ({requests.length})
              </h3>
              <div className="grid gap-3">
                {requests.map(request => {
                  const config = statusConfig[request.status] || statusConfig.pending;
                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <config.icon className="h-4 w-4 shrink-0" />
                              <h4 className="font-medium truncate">{request.title}</h4>
                            </div>
                            {request.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {request.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={config.className}>
                                {config.label}
                              </Badge>
                              {request.project && (
                                <Badge variant="outline" className="text-xs">
                                  {request.project.name}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Tâches en cours ({tasks.length})
              </h3>
              <div className="grid gap-3">
                {tasks.map(task => {
                  const config = statusConfig[task.status] || statusConfig.todo;
                  return (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <config.icon className={`h-4 w-4 shrink-0 ${task.status === 'in_progress' ? 'animate-spin' : ''}`} />
                              <h4 className="font-medium truncate">{task.title}</h4>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={config.className}>
                                {config.label}
                              </Badge>
                              {task.project && (
                                <Badge variant="outline" className="text-xs">
                                  {task.project.name}
                                </Badge>
                              )}
                              {task.priority && (
                                <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                                  {task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟠' : task.priority === 'medium' ? '🟡' : '⚪'} {task.priority}
                                </span>
                              )}
                              {task.due_date && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(task.due_date), 'dd MMM', { locale: fr })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
