import { useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";

interface DirectMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartConversation: (userId: string) => Promise<void>;
}

export function DirectMessageDialog({
  open,
  onOpenChange,
  onStartConversation,
}: DirectMessageDialogProps) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: profiles = [] } = useWorkspaceProfiles();
  const { user } = useAuth();

  // Filter out current user and search
  const filteredProfiles = profiles.filter(
    (p) =>
      p.user_id !== user?.id &&
      p.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (userId: string) => {
    setIsLoading(true);
    try {
      await onStartConversation(userId);
    } finally {
      setIsLoading(false);
      setSearch("");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
          <DialogDescription>
            Commencez une conversation avec un membre de l'équipe
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
            {filteredProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun membre trouvé
              </p>
            ) : (
              filteredProfiles.map((profile) => (
                <button
                  key={profile.user_id}
                  onClick={() => handleSelect(profile.user_id)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                >
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
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
