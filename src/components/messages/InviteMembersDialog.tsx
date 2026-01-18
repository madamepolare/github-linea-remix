import { useState } from "react";
import { Check, Search, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelName: string;
  existingMemberIds: string[];
  onMembersAdded: () => void;
}

export function InviteMembersDialog({
  open,
  onOpenChange,
  channelId,
  channelName,
  existingMemberIds,
  onMembersAdded,
}: InviteMembersDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: profiles = [] } = useWorkspaceProfiles();
  const { user } = useAuth();

  // Filter out current members and search
  const availableProfiles = profiles.filter(
    (p) =>
      !existingMemberIds.includes(p.user_id) &&
      p.user_id !== user?.id &&
      (p.full_name?.toLowerCase().includes(search.toLowerCase()) || !search)
  );

  const toggleSelection = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;

    setIsLoading(true);
    try {
      const members = selectedIds.map((id) => ({
        channel_id: channelId,
        user_id: id,
        role: "member" as const,
      }));

      const { error } = await supabase.from("team_channel_members").insert(members);

      if (error) throw error;

      toast.success(
        `${selectedIds.length} membre${selectedIds.length > 1 ? "s" : ""} ajouté${selectedIds.length > 1 ? "s" : ""}`
      );
      setSelectedIds([]);
      setSearch("");
      onMembersAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error inviting members:", error);
      toast.error("Erreur lors de l'invitation des membres");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter des membres</DialogTitle>
          <DialogDescription>
            Ajouter des membres au canal #{channelName}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[300px] -mx-6 px-6">
          <div className="space-y-1">
            {availableProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {existingMemberIds.length === profiles.length - 1
                  ? "Tous les membres sont déjà dans ce canal"
                  : "Aucun membre trouvé"}
              </p>
            ) : (
              availableProfiles.map((profile) => {
                const isSelected = selectedIds.includes(profile.user_id);
                return (
                  <button
                    key={profile.user_id}
                    onClick={() => toggleSelection(profile.user_id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(profile.user_id)}
                    />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {profile.full_name || "Utilisateur"}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""}
          </span>
          <Button
            onClick={handleInvite}
            disabled={selectedIds.length === 0 || isLoading}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isLoading ? "Ajout..." : "Inviter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
