import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ViewSwitcherProps {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}

export function ViewSwitcher({ value, onChange, options, className }: ViewSwitcherProps) {
  return (
    <div className={cn("inline-flex items-center p-0.5 sm:p-1 rounded-lg bg-muted/50 border border-border/50 overflow-x-auto scrollbar-none", className)}>
      {options.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-2xs sm:text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap",
            value === option.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {value === option.value && (
            <motion.div
              layoutId="viewSwitcherActive"
              className="absolute inset-0 bg-background rounded-md shadow-sm border border-border/50"
              transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
            {option.icon}
            <span className="hidden xs:inline sm:inline">{option.label}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
