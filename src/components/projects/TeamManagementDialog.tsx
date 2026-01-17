import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, X, Plus, Loader2, Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface TeamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function TeamManagementDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: TeamManagementDialogProps) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      fetchMembers();
      fetchAvailableUsers();
    }
  }, [open, projectId]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          id,
          user_id,
          role
        `)
        .eq("project_id", projectId);

      if (error) throw error;

      // Fetch profiles separately
      const userIds = data?.map((m) => m.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const membersWithProfiles = data?.map((member) => ({
        ...member,
        profile: profiles?.find((p) => p.user_id === member.user_id),
      })) || [];

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Erreur lors du chargement de l'équipe");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!activeWorkspace?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(`
          user_id,
          profiles:user_id (
            user_id,
            full_name,
            avatar_url
          )
        `)
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !activeWorkspace?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: selectedUserId,
        role: selectedRole,
        workspace_id: activeWorkspace.id,
      });

      if (error) throw error;

      toast.success("Membre ajouté avec succès");
      setSelectedUserId("");
      fetchMembers();
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    } catch (error: any) {
      console.error("Error adding member:", error);
      if (error.code === "23505") {
        toast.error("Ce membre fait déjà partie de l'équipe");
      } else {
        toast.error("Erreur lors de l'ajout du membre");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Membre retiré de l'équipe");
      fetchMembers();
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("project_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Rôle mis à jour");
      fetchMembers();
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleLabels: Record<string, string> = {
    owner: "Responsable",
    lead: "Chef de projet",
    member: "Membre",
    viewer: "Observateur",
  };

  // Filter out users already in the team
  const filteredAvailableUsers = availableUsers.filter(
    (u) => !members.some((m) => m.user_id === u.user_id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Équipe - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add member section */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">Ajouter un membre</Label>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un membre..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvailableUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.profiles?.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(user.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {user.profiles?.full_name || "Utilisateur"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Chef de projet</SelectItem>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="viewer">Observateur</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                onClick={handleAddMember}
                disabled={!selectedUserId || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Membres actuels ({members.length})
            </Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun membre dans l'équipe
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-background"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(member.profile?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {member.profile?.full_name || "Utilisateur"}
                        </p>
                        {member.role === "lead" && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Crown className="h-3 w-3" />
                            Chef
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleUpdateRole(member.id, value)
                      }
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Responsable</SelectItem>
                        <SelectItem value="lead">Chef de projet</SelectItem>
                        <SelectItem value="member">Membre</SelectItem>
                        <SelectItem value="viewer">Observateur</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
