import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      root.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newIsDark = !isDark;
    
    if (newIsDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    
    setIsDark(newIsDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <div className="relative h-[18px] w-[18px]">
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? 90 : 0,
            opacity: isDark ? 0 : 1,
          }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.25} />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : -90,
            opacity: isDark ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.25} />
        </motion.div>
      </div>
      {!collapsed && (
        <motion.span
          initial={false}
          animate={{ opacity: 1 }}
          className="flex-1 text-left"
        >
          {isDark ? "Dark mode" : "Light mode"}
        </motion.span>
      )}
      {!collapsed && (
        <div
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors duration-200",
            isDark ? "bg-foreground" : "bg-border"
          )}
        >
          <motion.div
            initial={false}
            animate={{ x: isDark ? 16 : 2 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute top-1 h-3 w-3 rounded-full",
              isDark ? "bg-background" : "bg-muted-foreground"
            )}
          />
        </div>
      )}
    </button>
  );
}
