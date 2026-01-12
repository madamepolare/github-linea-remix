import { useState, useCallback, useMemo } from "react";
import { Check, ChevronLeft, ChevronRight, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamMember } from "@/hooks/useTeamMembers";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberFocusSwitcherProps {
  members: TeamMember[];
  focusedMemberId: string | null;
  onFocusChange: (memberId: string | null) => void;
}

export function MemberFocusSwitcher({
  members,
  focusedMemberId,
  onFocusChange,
}: MemberFocusSwitcherProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const focusedMember = useMemo(() => {
    return members.find((m) => m.user_id === focusedMemberId) || null;
  }, [members, focusedMemberId]);

  const currentIndex = useMemo(() => {
    if (!focusedMemberId) return -1;
    return members.findIndex((m) => m.user_id === focusedMemberId);
  }, [members, focusedMemberId]);

  const navigatePrev = useCallback(() => {
    if (members.length === 0) return;
    if (currentIndex === -1 || currentIndex === 0) {
      // Go to last member
      onFocusChange(members[members.length - 1].user_id);
    } else {
      onFocusChange(members[currentIndex - 1].user_id);
    }
  }, [members, currentIndex, onFocusChange]);

  const navigateNext = useCallback(() => {
    if (members.length === 0) return;
    if (currentIndex === -1 || currentIndex === members.length - 1) {
      // Go to first member
      onFocusChange(members[0].user_id);
    } else {
      onFocusChange(members[currentIndex + 1].user_id);
    }
  }, [members, currentIndex, onFocusChange]);

  const toggleFocusMode = useCallback(() => {
    if (focusedMemberId) {
      onFocusChange(null);
    } else if (members.length > 0) {
      onFocusChange(members[0].user_id);
    }
  }, [focusedMemberId, members, onFocusChange]);

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      {/* Navigation arrows (only shown in focus mode) */}
      {focusedMemberId && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={navigatePrev}
          disabled={members.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Member selector dropdown */}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={focusedMemberId ? "secondary" : "ghost"}
            className={cn(
              "h-8 gap-2 px-2",
              focusedMemberId && "bg-primary/10 border border-primary/20"
            )}
          >
            {focusedMember ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={focusedMember.profile?.avatar_url || ""} />
                  <AvatarFallback className="text-[9px]">
                    {(focusedMember.profile?.full_name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {focusedMember.profile?.full_name || "Sans nom"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({currentIndex + 1}/{members.length})
                </span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span className="text-sm">Tous ({members.length})</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
          {/* All members option */}
          <DropdownMenuItem
            onClick={() => {
              onFocusChange(null);
              setDropdownOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-sm border",
                !focusedMemberId
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              )}
            >
              {!focusedMemberId && <Check className="h-3 w-3" />}
            </div>
            <Users className="h-4 w-4" />
            <span className="flex-1">Tous les membres</span>
            <span className="text-xs text-muted-foreground">{members.length}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />

          {/* Individual members */}
          {members.map((member, index) => (
            <DropdownMenuItem
              key={member.user_id}
              onClick={() => {
                onFocusChange(member.user_id);
                setDropdownOpen(false);
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border",
                  focusedMemberId === member.user_id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {focusedMemberId === member.user_id && <Check className="h-3 w-3" />}
              </div>
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.profile?.avatar_url || ""} />
                <AvatarFallback className="text-[9px]">
                  {(member.profile?.full_name || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{member.profile?.full_name || "Sans nom"}</div>
                {member.role && (
                  <div className="text-[10px] text-muted-foreground truncate">{member.role}</div>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Navigation arrows (only shown in focus mode) */}
      {focusedMemberId && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={navigateNext}
          disabled={members.length <= 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Toggle focus mode button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 ml-1",
          focusedMemberId && "text-primary"
        )}
        onClick={toggleFocusMode}
        title={focusedMemberId ? "Afficher tous les membres" : "Mode focus"}
      >
        <User className={cn("h-4 w-4", focusedMemberId && "fill-current")} />
      </Button>
    </div>
  );
}
