import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, AtSign, CheckSquare, FolderKanban, UserPlus, Moon, Mail, Bell, Heart, Reply, Smartphone } from "lucide-react";
import { PushNotificationToggle } from "./PushNotificationToggle";

interface NotificationToggleProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({ id, icon, label, description, checked, onCheckedChange, disabled }: NotificationToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
          {icon}
        </div>
        <div className="space-y-0.5">
          <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export function NotificationSettings() {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences.mutate({ [key]: value });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Messages & Mentions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages & Mentions
          </CardTitle>
          <CardDescription>
            Gérez les notifications liées aux messages et mentions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <NotificationToggle
            id="notify_new_messages"
            icon={<MessageSquare className="h-4 w-4" />}
            label="Nouveaux messages"
            description="Recevoir une notification pour chaque nouveau message dans vos conversations"
            checked={preferences.notify_new_messages}
            onCheckedChange={(checked) => handleToggle('notify_new_messages', checked)}
            disabled={updatePreferences.isPending}
          />
          <Separator />
          <NotificationToggle
            id="notify_mentions"
            icon={<AtSign className="h-4 w-4" />}
            label="Mentions"
            description="Quand quelqu'un vous mentionne avec @votrenom"
            checked={preferences.notify_mentions}
            onCheckedChange={(checked) => handleToggle('notify_mentions', checked)}
            disabled={updatePreferences.isPending}
          />
          <Separator />
          <NotificationToggle
            id="notify_comment_replies"
            icon={<Reply className="h-4 w-4" />}
            label="Réponses"
            description="Quand quelqu'un répond à votre message ou commentaire"
            checked={preferences.notify_comment_replies}
            onCheckedChange={(checked) => handleToggle('notify_comment_replies', checked)}
            disabled={updatePreferences.isPending}
          />
          <Separator />
          <NotificationToggle
            id="notify_reactions"
            icon={<Heart className="h-4 w-4" />}
            label="Réactions"
            description="Quand quelqu'un réagit à votre message"
            checked={preferences.notify_reactions}
            onCheckedChange={(checked) => handleToggle('notify_reactions', checked)}
            disabled={updatePreferences.isPending}
          />
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tâches
          </CardTitle>
          <CardDescription>
            Notifications liées à vos tâches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <NotificationToggle
            id="notify_task_created"
            icon={<CheckSquare className="h-4 w-4" />}
            label="Nouvelles tâches"
            description="Tâches créées sur vos projets"
            checked={preferences.notify_task_created}
            onCheckedChange={(checked) => handleToggle('notify_task_created', checked)}
            disabled={updatePreferences.isPending}
          />
          <Separator />
          <NotificationToggle
            id="notify_task_assigned"
            icon={<UserPlus className="h-4 w-4" />}
            label="Tâches assignées"
            description="Quand une tâche vous est assignée"
            checked={preferences.notify_task_assigned}
            onCheckedChange={(checked) => handleToggle('notify_task_assigned', checked)}
            disabled={updatePreferences.isPending}
          />
          <Separator />
          <NotificationToggle
            id="notify_task_completed"
            icon={<CheckSquare className="h-4 w-4" />}
            label="Tâches complétées"
            description="Quand une tâche de vos projets est marquée terminée"
            checked={preferences.notify_task_completed}
            onCheckedChange={(checked) => handleToggle('notify_task_completed', checked)}
            disabled={updatePreferences.isPending}
          />
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projets
          </CardTitle>
          <CardDescription>
            Notifications liées aux projets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationToggle
            id="notify_project_updates"
            icon={<FolderKanban className="h-4 w-4" />}
            label="Mises à jour de projets"
            description="Changements de statut et mises à jour importantes"
            checked={preferences.notify_project_updates}
            onCheckedChange={(checked) => handleToggle('notify_project_updates', checked)}
            disabled={updatePreferences.isPending}
          />
          <Separator />
          <NotificationToggle
            id="notify_invites"
            icon={<UserPlus className="h-4 w-4" />}
            label="Invitations"
            description="Invitations à rejoindre des projets ou espaces de travail"
            checked={preferences.notify_invites}
            onCheckedChange={(checked) => handleToggle('notify_invites', checked)}
            disabled={updatePreferences.isPending}
          />
        </CardContent>
      </Card>

      {/* Do Not Disturb */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Mode Ne pas déranger
          </CardTitle>
          <CardDescription>
            Suspendez les notifications pendant certaines heures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            id="do_not_disturb"
            icon={<Moon className="h-4 w-4" />}
            label="Activer Ne pas déranger"
            description="Désactiver les notifications pendant les heures définies"
            checked={preferences.do_not_disturb}
            onCheckedChange={(checked) => handleToggle('do_not_disturb', checked)}
            disabled={updatePreferences.isPending}
          />
          
          {preferences.do_not_disturb && (
            <div className="flex items-center gap-4 pl-12">
              <div className="space-y-1.5">
                <Label htmlFor="dnd_start" className="text-xs text-muted-foreground">
                  Début
                </Label>
                <Input
                  id="dnd_start"
                  type="time"
                  value={preferences.dnd_start?.slice(0, 5) || '22:00'}
                  onChange={(e) => handleToggle('dnd_start', e.target.value + ':00' as any)}
                  className="w-28"
                  disabled={updatePreferences.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dnd_end" className="text-xs text-muted-foreground">
                  Fin
                </Label>
                <Input
                  id="dnd_end"
                  type="time"
                  value={preferences.dnd_end?.slice(0, 5) || '08:00'}
                  onChange={(e) => handleToggle('dnd_end', e.target.value + ':00' as any)}
                  className="w-28"
                  disabled={updatePreferences.isPending}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canaux de notification
          </CardTitle>
          <CardDescription>
            Comment souhaitez-vous recevoir vos notifications ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <NotificationToggle
            id="push_enabled"
            icon={<Bell className="h-4 w-4" />}
            label="Notifications dans l'application"
            description="Afficher les notifications dans l'interface"
            checked={preferences.push_enabled}
            onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
            disabled={updatePreferences.isPending}
          />
          <Separator />
          <PushNotificationToggle />
          <Separator />
          <NotificationToggle
            id="email_enabled"
            icon={<Mail className="h-4 w-4" />}
            label="Notifications par email"
            description="Recevoir un résumé des notifications par email"
            checked={preferences.email_enabled}
            onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
            disabled={updatePreferences.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
