import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DayQualityVoteProps {
  value: number | null;
  onChange: (value: number) => void;
}

const moods = [
  { value: 1, emoji: "😫", label: "Difficile", color: "text-red-500" },
  { value: 2, emoji: "😕", label: "Compliquée", color: "text-orange-500" },
  { value: 3, emoji: "😐", label: "Neutre", color: "text-yellow-500" },
  { value: 4, emoji: "🙂", label: "Bien", color: "text-lime-500" },
  { value: 5, emoji: "🤩", label: "Excellente", color: "text-green-500" },
];

export function DayQualityVote({ value, onChange }: DayQualityVoteProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-6">
        {moods.map((mood) => {
          const isSelected = value === mood.value;
          const isHovered = hoveredValue === mood.value;

          return (
            <motion.button
              key={mood.value}
              type="button"
              onClick={() => onChange(mood.value)}
              onMouseEnter={() => setHoveredValue(mood.value)}
              onMouseLeave={() => setHoveredValue(null)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200",
                isSelected
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "hover:bg-muted",
              )}
            >
              <motion.span
                className="text-4xl"
                animate={{
                  scale: isSelected ? [1, 1.2, 1] : 1,
                  rotate: isHovered ? [0, -10, 10, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {mood.emoji}
              </motion.span>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isSelected ? mood.color : "text-muted-foreground"
                )}
              >
                {mood.label}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="quality-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                  initial={false}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
