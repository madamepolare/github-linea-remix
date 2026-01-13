import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm transition-all duration-200",
          "placeholder:text-muted-foreground/50",
          "hover:border-border",
          "focus:outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
