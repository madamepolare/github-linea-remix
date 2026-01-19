import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface TypingUser {
  user_id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

interface PresenceState {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  isTyping: boolean;
}

export function useTypingIndicator(channelId: string | undefined) {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channelId || !user?.id) return;

    const presenceChannel = supabase.channel(`typing:${channelId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<PresenceState>();
        const typing: TypingUser[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (key !== user.id && presences.length > 0) {
            const presence = presences[0];
            if (presence.isTyping) {
              typing.push({
                user_id: presence.user_id,
                full_name: presence.full_name,
                avatar_url: presence.avatar_url,
              });
            }
          }
        });

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: user.id,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            isTyping: false,
          });
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      presenceChannel.unsubscribe();
    };
  }, [channelId, user?.id, profile?.full_name, profile?.avatar_url]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !user?.id) return;

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Update presence with avatar
      channelRef.current.track({
        user_id: user.id,
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        isTyping,
      });

      // Auto-stop typing after 3 seconds of inactivity
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.track({
            user_id: user.id,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            isTyping: false,
          });
        }, 3000);
      }
    },
    [user?.id, profile?.full_name, profile?.avatar_url]
  );

  const stopTyping = useCallback(() => {
    setTyping(false);
  }, [setTyping]);

  return { typingUsers, setTyping, stopTyping };
}
