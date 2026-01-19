import { motion } from "framer-motion";
import { TypingUser } from "@/hooks/useTypingIndicator";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-1.5 text-sm text-muted-foreground"
    >
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
            animate={{
              y: [0, -4, 0],
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
      <span>{getTypingText()}</span>
    </motion.div>
  );
}
