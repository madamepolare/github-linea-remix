import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface MultiAssigneePickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  renderTrigger?: (selectedMembers: Profile[]) => React.ReactNode;
}

export function MultiAssigneePicker({ value, onChange, className, renderTrigger }: MultiAssigneePickerProps) {
  const { activeWorkspace } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: members } = useQuery({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: async () => {
      const { data: memberData, error: memberError } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", activeWorkspace!.id);

      if (memberError) throw memberError;

      const userIds = memberData.map((m) => m.user_id);

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profileError) throw profileError;
      return profiles as Profile[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const toggleMember = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  const removeMember = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== userId));
  };

  const selectedMembers = members?.filter((m) => value.includes(m.user_id)) || [];

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Custom trigger rendering
  if (renderTrigger) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className={cn("cursor-pointer", className)}>
            {renderTrigger(selectedMembers)}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1">
            {members?.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => toggleMember(member.user_id)}
              >
                <Checkbox checked={value.includes(member.user_id)} />
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.full_name || "Utilisateur"}</span>
              </div>
            ))}
            {(!members || members.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun membre trouvé
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-start h-auto min-h-10", className)}
        >
          {selectedMembers.length === 0 ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              Assigner...
            </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedMembers.map((member) => (
                <Badge key={member.user_id} variant="secondary" className="gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-20 truncate">{member.full_name || "Utilisateur"}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => removeMember(member.user_id, e)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {members?.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
              onClick={() => toggleMember(member.user_id)}
            >
              <Checkbox checked={value.includes(member.user_id)} />
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{member.full_name || "Utilisateur"}</span>
            </div>
          ))}
          {(!members || members.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun membre trouvé
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}