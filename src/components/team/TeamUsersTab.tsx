import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, MoreHorizontal, Mail, Shield, Trash2, Search, GraduationCap, Calendar } from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";
import { ApprenticeScheduleDialog } from "./ApprenticeScheduleDialog";

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function TeamUsersTab() {
  const { data: members, isLoading } = useTeamMembers();
  const { activeWorkspace, user } = useAuth();
  const { can, isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [apprenticeDialogUser, setApprenticeDialogUser] = useState<{ id: string; name: string } | null>(null);

  // Fetch all apprentice schedules to show badges
  const { data: apprenticeSchedules } = useQuery({
    queryKey: ["apprentice-schedules", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      const { data, error } = await supabase
        .from("apprentice_schedules")
        .select("user_id, schedule_name, custom_pattern")
        .eq("workspace_id", activeWorkspace.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace,
  });

  const apprenticeUserIds = new Set(apprenticeSchedules?.map((s) => s.user_id) || []);

  const canInvite = can("team.invite");
  const canManageRoles = can("team.manage_roles");
  const canRemove = can("team.remove");

  const filteredMembers = members?.filter((m) =>
    m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const buildInviteUrl = (inviteToken: string) =>
    `${window.location.origin}/invite?token=${encodeURIComponent(inviteToken)}`;

  const copyInviteLink = async (inviteToken: string) => {
    const url = buildInviteUrl(inviteToken);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Lien d'invitation copié" });
    } catch {
      toast({ title: "Lien d'invitation", description: url });
    }
  };

  const handleInvite = async () => {
    if (!activeWorkspace || !inviteEmail) return;

    setInviting(true);
    try {
      const { data: invite, error } = await (supabase.from("workspace_invites") as any)
        .insert({
          workspace_id: activeWorkspace.id,
          email: inviteEmail.toLowerCase(),
          role: inviteRole,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke("send-invite", {
        body: {
          email: inviteEmail,
          workspaceId: activeWorkspace.id,
          workspaceName: activeWorkspace.name,
          role: inviteRole,
          inviteToken: invite.token,
          inviterName: user?.email || "A team member",
        },
      });

      if (emailError) {
        await copyInviteLink(invite.token);
        toast({
          title: "Invitation créée",
          description: "Email non envoyé — lien d'invitation copié.",
        });
      } else {
        toast({ title: "Invitation envoyée" });
      }

      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: "admin" | "member" | "viewer") => {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Rôle mis à jour" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({ title: "Membre retiré" });
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers?.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isApprentice={apprenticeUserIds.has(member.user_id)}
            canManage={canManageRoles && member.user_id !== user?.id && member.role !== "owner"}
            onUpdateRole={(role) => handleUpdateRole(member.id, role)}
            onRemove={() => handleRemoveMember(member.id)}
            onManageApprentice={() => setApprenticeDialogUser({ id: member.user_id, name: member.profile?.full_name || "Sans nom" })}
          />
        ))}
      </div>

      {filteredMembers?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun membre trouvé
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="viewer">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviting}>
              {inviting ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apprentice Schedule Dialog */}
      {apprenticeDialogUser && (
        <ApprenticeScheduleDialog
          open={!!apprenticeDialogUser}
          onOpenChange={(open) => !open && setApprenticeDialogUser(null)}
          userId={apprenticeDialogUser.id}
          userName={apprenticeDialogUser.name}
        />
      )}
    </div>
  );
}

function MemberCard({
  member,
  isApprentice,
  canManage,
  onUpdateRole,
  onRemove,
  onManageApprentice,
}: {
  member: TeamMember;
  isApprentice: boolean;
  canManage: boolean;
  onUpdateRole: (role: "admin" | "member" | "viewer") => void;
  onRemove: () => void;
  onManageApprentice: () => void;
}) {
  const initials = member.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{member.profile?.full_name || "Sans nom"}</h3>
                {isApprentice && (
                  <Badge variant="secondary" className="text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Alternant
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{member.profile?.job_title || "—"}</p>
            </div>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onManageApprentice}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {isApprentice ? "Modifier planning alternance" : "Configurer alternance"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateRole("admin")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Passer admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateRole("member")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Passer membre
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateRole("viewer")}>
                  <Shield className="h-4 w-4 mr-2" />
                  Passer lecteur
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onRemove}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Retirer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge className={roleColors[member.role]}>
            {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
          </Badge>
          {member.profile?.email && (
            <a
              href={`mailto:${member.profile.email}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
