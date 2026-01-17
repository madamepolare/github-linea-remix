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
import { Users, X, Plus, Loader2, Crown, UserCircle, Briefcase } from "lucide-react";
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
import { useContacts } from "@/hooks/useContacts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  user_id: string | null;
  role: string;
  is_external: boolean;
  external_contact_id: string | null;
  notes: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  contact?: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string | null;
    phone: string | null;
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
  { value: "moe", label: "Maître d'œuvre" },
  { value: "bet", label: "BET" },
];

export function TeamManagementDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: TeamManagementDialogProps) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { contacts: allContacts } = useContacts();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Add internal member state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedInternalRole, setSelectedInternalRole] = useState<string>("member");
  
  // Add external member state
  const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedExternalRole, setSelectedExternalRole] = useState<string>("freelance");

  useEffect(() => {
    if (open && projectId) {
      fetchAllMembers();
      fetchAvailableUsers();
    }
  }, [open, projectId]);

  const fetchAllMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      // Get internal member profiles
      const internalMembers = data?.filter(m => !m.is_external) || [];
      const userIds = internalMembers.map((m) => m.user_id).filter(Boolean);
      
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        profiles = profilesData || [];
      }

      // Get external member contacts
      const externalMembers = data?.filter(m => m.is_external) || [];
      const contactIds = externalMembers.map(m => m.external_contact_id).filter(Boolean);
      
      let contacts: any[] = [];
      if (contactIds.length > 0) {
        const { data: contactsData } = await supabase
          .from("contacts")
          .select("id, name, avatar_url, email, phone")
          .in("id", contactIds);
        contacts = contactsData || [];
      }

      // Merge all data
      const membersWithData = data?.map((member) => ({
        ...member,
        profile: profiles.find((p) => p.user_id === member.user_id),
        contact: contacts.find((c) => c.id === member.external_contact_id),
      })) || [];

      setMembers(membersWithData);
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
      // Fetch workspace members first (avoid relying on PostgREST embedded relation)
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("user_id, role, is_hidden")
        .eq("workspace_id", activeWorkspace.id)
        .neq("is_hidden", true);

      if (membersError) throw membersError;

      const userIds = (members || []).map((m) => m.user_id).filter(Boolean);
      if (userIds.length === 0) {
        setAvailableUsers([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      setAvailableUsers(
        (members || []).map((m) => ({
          user_id: m.user_id,
          role: m.role,
          profiles: profileMap.get(m.user_id) || null,
        }))
      );
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]);
    }
  };

  const handleAddInternalMember = async () => {
    if (!selectedUserId || !activeWorkspace?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: selectedUserId,
        role: selectedInternalRole,
        is_external: false,
      });

      if (error) throw error;

      toast.success("Membre ajouté");
      setSelectedUserId("");
      fetchAllMembers();
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    } catch (error: any) {
      console.error("Error adding member:", error);
      if (error.code === "23505") {
        toast.error("Ce membre fait déjà partie de l'équipe");
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExternalMember = async () => {
    if (!selectedContactId || !activeWorkspace?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("project_members").insert({
        project_id: projectId,
        role: selectedExternalRole,
        is_external: true,
        external_contact_id: selectedContactId,
        user_id: null,
      });

      if (error) throw error;

      toast.success("Collaborateur externe ajouté");
      setSelectedContactId(null);
      fetchAllMembers();
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    } catch (error: any) {
      console.error("Error adding external member:", error);
      if (error.code === "23505") {
        toast.error("Ce contact fait déjà partie de l'équipe");
      } else {
        toast.error("Erreur lors de l'ajout");
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

      toast.success("Membre retiré");
      fetchAllMembers();
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
      fetchAllMembers();
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erreur lors de la mise à jour");
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

  const internalMembers = members.filter(m => !m.is_external);
  const externalMembers = members.filter(m => m.is_external);
  
  const filteredAvailableUsers = availableUsers.filter(
    (u) => !internalMembers.some((m) => m.user_id === u.user_id)
  );

  const availableExternalContacts = allContacts.filter(
    (c) => !externalMembers.some((m) => m.external_contact_id === c.id)
  );

  const getRoleLabel = (role: string, isExternal: boolean) => {
    const roles = isExternal ? EXTERNAL_ROLES : INTERNAL_ROLES;
    return roles.find(r => r.value === role)?.label || role;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Équipe projet
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{projectName}</p>
        </DialogHeader>

        <Tabs defaultValue="internal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="gap-2">
              <UserCircle className="h-4 w-4" />
              Interne ({internalMembers.length})
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Externe ({externalMembers.length})
            </TabsTrigger>
          </TabsList>

          {/* Internal Tab */}
          <TabsContent value="internal" className="space-y-4 mt-4">
            {/* Add internal member */}
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un membre..." />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {filteredAvailableUsers.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      Tous les membres sont déjà assignés
                    </div>
                  ) : (
                    filteredAvailableUsers.map((user) => (
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
                    ))
                  )}
                </SelectContent>
              </Select>
              <Select value={selectedInternalRole} onValueChange={setSelectedInternalRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  {INTERNAL_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                onClick={handleAddInternalMember}
                disabled={!selectedUserId || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Internal members list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : internalMembers.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <UserCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium">Aucun membre interne</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajoutez des membres de votre équipe
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {internalMembers.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border bg-card",
                      member.role === "lead" && "border-amber-500/30 bg-amber-500/5"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(member.profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {member.profile?.full_name || "Utilisateur"}
                        </span>
                        {member.role === "lead" && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {INTERNAL_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* External Tab */}
          <TabsContent value="external" className="space-y-4 mt-4">
            {/* Add external member */}
            <div className="flex gap-2">
              <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
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
                <PopoverContent className="w-[300px] p-0 z-50" align="start" sideOffset={4}>
                  <Command>
                    <CommandInput placeholder="Rechercher..." />
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>Aucun contact trouvé</CommandEmpty>
                      <CommandGroup>
                        {availableExternalContacts.map((contact) => (
                          <CommandItem
                            key={contact.id}
                            value={contact.name || contact.email || contact.id}
                            onSelect={() => {
                              setSelectedContactId(contact.id);
                              setIsContactPopoverOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={contact.avatar_url || ""} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(contact.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{contact.name}</span>
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
                <SelectContent position="popper" sideOffset={4}>
                  {EXTERNAL_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                onClick={handleAddExternalMember}
                disabled={!selectedContactId || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* External members list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : externalMembers.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium">Aucun collaborateur externe</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajoutez des freelances, consultants ou partenaires
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {externalMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.contact?.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(member.contact?.name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {member.contact?.name || "Contact"}
                      </span>
                      {member.contact?.email && (
                        <span className="text-xs text-muted-foreground truncate block">
                          {member.contact.email}
                        </span>
                      )}
                    </div>
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value)}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {EXTERNAL_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
