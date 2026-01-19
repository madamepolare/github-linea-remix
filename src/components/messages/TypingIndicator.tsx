import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface TypingUser {
  user_id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name || "Quelqu'un"} est en train d'écrire`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name || "Quelqu'un"} et ${typingUsers[1].full_name || "quelqu'un d'autre"} sont en train d'écrire`;
    }
    return `${typingUsers.length} personnes sont en train d'écrire`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-muted/30"
    >
      {/* Pulsing avatars */}
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user, index) => (
          <motion.div
            key={user.user_id}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          >
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        ))}
      </div>

      {/* Animated dots */}
      <div className="flex gap-0.5 ml-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
            animate={{
              y: [0, -3, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Text */}
      <span className="text-xs">{getTypingText()}</span>
    </motion.div>
  );
}
