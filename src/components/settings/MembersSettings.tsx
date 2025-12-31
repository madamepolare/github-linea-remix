import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  UserPlus,
  Mail,
  Loader2,
  MoreVertical,
  Trash2,
  Shield,
  Clock,
  Crown,
  User,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface Member {
  id: string;
  user_id: string;
  role: AppRole;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    job_title: string | null;
  } | null;
  email?: string;
}

interface Invite {
  id: string;
  email: string;
  role: AppRole;
  expires_at: string;
  created_at: string;
}

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["owner", "admin", "member", "viewer"] as const),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const roleColors: Record<AppRole, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  member: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const roleIcons: Record<AppRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: User,
};

export function MembersSettings() {
  const { activeWorkspace, profile, user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  const currentUserRole = members.find(m => m.user_id === user?.id)?.role;
  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

  useEffect(() => {
    if (activeWorkspace) {
      fetchMembers();
      fetchInvites();
    }
  }, [activeWorkspace]);

  const fetchMembers = async () => {
    if (!activeWorkspace) return;

    const { data, error } = await supabase
      .from("workspace_members")
      .select("id, user_id, role")
      .eq("workspace_id", activeWorkspace.id);

    if (error) {
      console.error("Error fetching members:", error);
      setIsLoading(false);
      return;
    }

    // Fetch profiles separately
    const userIds = (data || []).map(m => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, job_title")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const mappedMembers: Member[] = (data || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      profile: profileMap.get(m.user_id) || null,
    }));

    setMembers(mappedMembers);
    setIsLoading(false);
  };

  const fetchInvites = async () => {
    if (!activeWorkspace) return;

    const { data, error } = await supabase
      .from("workspace_invites")
      .select("*")
      .eq("workspace_id", activeWorkspace.id)
      .gt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching invites:", error);
      return;
    }

    setInvites(data || []);
  };

  const handleInvite = async (data: InviteFormData) => {
    if (!activeWorkspace || !user || !profile) return;
    setIsInviting(true);

    try {
      // Create invite in database
      const { data: invite, error: inviteError } = await supabase
        .from("workspace_invites")
        .insert({
          workspace_id: activeWorkspace.id,
          email: data.email,
          role: data.role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.message.includes("duplicate")) {
          toast({
            variant: "destructive",
            title: "Already invited",
            description: "This email has already been invited to the workspace.",
          });
        } else {
          throw inviteError;
        }
        return;
      }

      // Send invite email
      const { error: emailError } = await supabase.functions.invoke("send-invite", {
        body: {
          email: data.email,
          workspaceId: activeWorkspace.id,
          workspaceName: activeWorkspace.name,
          role: data.role,
          inviteToken: invite.token,
          inviterName: profile.full_name || "A team member",
        },
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        // Still show success since invite was created
        toast({
          title: "Invite created",
          description: "Invite created but email may not have been sent. Share the link manually.",
        });
      } else {
        toast({
          title: "Invitation sent",
          description: `An invitation has been sent to ${data.email}`,
        });
      }

      form.reset();
      setDialogOpen(false);
      fetchInvites();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending invite",
        description: error.message,
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error removing member",
        description: error.message,
      });
      return;
    }

    toast({ title: "Member removed" });
    fetchMembers();
  };

  const handleCancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("workspace_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error canceling invite",
        description: error.message,
      });
      return;
    }

    toast({ title: "Invite canceled" });
    fetchInvites();
  };

  const handleUpdateRole = async (memberId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating role",
        description: error.message,
      });
      return;
    }

    toast({ title: "Role updated" });
    fetchMembers();
  };

  if (!activeWorkspace) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No workspace selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Members Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage who has access to this workspace
              </CardDescription>
            </div>
            {canManageMembers && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join {activeWorkspace.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="colleague@company.com"
                          className="pl-10"
                          {...form.register("email")}
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={form.watch("role")}
                        onValueChange={(value) => form.setValue("role", value as AppRole)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer - Can view only</SelectItem>
                          <SelectItem value="member">Member - Can edit</SelectItem>
                          <SelectItem value="admin">Admin - Can manage</SelectItem>
                          {currentUserRole === "owner" && (
                            <SelectItem value="owner">Owner - Full control</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isInviting}>
                        {isInviting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Send Invitation
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role];
                const isCurrentUser = member.user_id === user?.id;
                const canModify = canManageMembers && !isCurrentUser && member.role !== "owner";

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.profile?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profile?.full_name || "Unknown User"}
                          {isCurrentUser && (
                            <span className="text-muted-foreground text-sm ml-2">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.job_title || "Team member"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={roleColors[member.role]}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "viewer")}>
                              Set as Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "member")}>
                              Set as Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                              Set as Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites Card */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => {
                const RoleIcon = roleIcons[invite.role];
                const expiresAt = new Date(invite.expires_at);
                const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={roleColors[invite.role]}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {invite.role}
                      </Badge>
                      {canManageMembers && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
