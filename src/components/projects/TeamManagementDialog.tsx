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
import { Users, X, Plus, Loader2, Crown, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectContacts } from "@/hooks/useProjectContacts";
import { useContacts } from "@/hooks/useContacts";
import { Separator } from "@/components/ui/separator";

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

const INTERNAL_ROLES = [
  { value: "lead", label: "Chef de projet" },
  { value: "member", label: "Membre" },
  { value: "viewer", label: "Observateur" },
];

const EXTERNAL_ROLES = [
  { value: "freelance", label: "Freelance" },
  { value: "consultant", label: "Consultant" },
  { value: "sous_traitant", label: "Sous-traitant" },
  { value: "partenaire", label: "Partenaire" },
];

export function TeamManagementDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: TeamManagementDialogProps) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  
  // Internal team state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // External collaborators state
  const { 
    contacts: projectContacts, 
    isLoading: isLoadingContacts,
    addContact, 
    updateContact, 
    removeContact 
  } = useProjectContacts(projectId);
  const { contacts: allContacts } = useContacts();
  const [isAddExternalOpen, setIsAddExternalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedExternalRole, setSelectedExternalRole] = useState("freelance");

  // Add mode toggle
  const [addMode, setAddMode] = useState<"internal" | "external">("internal");

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

  const handleAddExternalContact = () => {
    if (!selectedContactId) return;
    
    addContact.mutate({
      contactId: selectedContactId,
      role: selectedExternalRole,
      isPrimary: false,
    }, {
      onSuccess: () => {
        setSelectedContactId(null);
        setSelectedExternalRole("freelance");
        setIsAddExternalOpen(false);
      }
    });
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

  const filteredAvailableUsers = availableUsers.filter(
    (u) => !members.some((m) => m.user_id === u.user_id)
  );

  // Filter external contacts (freelances, not client contacts)
  const externalTeamContacts = projectContacts.filter(
    pc => EXTERNAL_ROLES.some(r => r.value === pc.role)
  );

  // Filter available external contacts (not already in project)
  const availableExternalContacts = allContacts.filter(
    c => !projectContacts.some(pc => pc.contact_id === c.id)
  );

  const totalTeamCount = members.length + externalTeamContacts.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Équipe projet - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add member section with toggle */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Ajouter à l'équipe</Label>
              <div className="flex gap-1">
                <Button
                  variant={addMode === "internal" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setAddMode("internal")}
                  className="text-xs h-7"
                >
                  Interne
                </Button>
                <Button
                  variant={addMode === "external" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setAddMode("external")}
                  className="text-xs h-7"
                >
                  Externe
                </Button>
              </div>
            </div>

            {addMode === "internal" ? (
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
                    {INTERNAL_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
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
            ) : (
              <div className="flex gap-2">
                <Popover open={isAddExternalOpen} onOpenChange={setIsAddExternalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      {selectedContactId ? (
                        allContacts.find(c => c.id === selectedContactId)?.name || "Contact"
                      ) : (
                        <span className="text-muted-foreground">Sélectionner un contact...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un contact..." />
                      <CommandList>
                        <CommandEmpty>Aucun contact trouvé</CommandEmpty>
                        <CommandGroup heading="Contacts disponibles">
                          {availableExternalContacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={contact.name || contact.email || contact.id}
                              onSelect={() => {
                                setSelectedContactId(contact.id);
                                setIsAddExternalOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={contact.avatar_url || ""} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(contact.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{contact.name}</p>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Select value={selectedExternalRole} onValueChange={setSelectedExternalRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTERNAL_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  onClick={handleAddExternalContact}
                  disabled={!selectedContactId || addContact.isPending}
                >
                  {addContact.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Unified team list */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Équipe ({totalTeamCount})
            </Label>

            {isLoading || isLoadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : totalTeamCount === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun membre dans l'équipe
              </p>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {/* Internal members */}
                {members.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Équipe interne
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {members.length}
                      </Badge>
                    </div>
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
                              <Crown className="h-3 w-3 text-amber-500" />
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
                            {INTERNAL_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
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
                  </>
                )}

                {/* External collaborators */}
                {externalTeamContacts.length > 0 && (
                  <>
                    {members.length > 0 && <Separator className="my-3" />}
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Collaborateurs externes
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {externalTeamContacts.length}
                      </Badge>
                    </div>
                    {externalTeamContacts.map((pc) => (
                      <div
                        key={pc.id}
                        className="flex items-center gap-3 p-2 rounded-lg border bg-background"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={pc.contact?.avatar_url || ""} />
                          <AvatarFallback>
                            {getInitials(pc.contact?.name || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {pc.contact?.name || "Contact"}
                            </p>
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                        <Select
                          value={pc.role}
                          onValueChange={(value) =>
                            updateContact.mutate({ id: pc.id, role: value })
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXTERNAL_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeContact.mutate(pc.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
