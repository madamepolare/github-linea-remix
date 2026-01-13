import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-background hover:bg-muted/50 text-foreground",
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        ghost: "hover:bg-muted/50 text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        soft: "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
        icon: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-lg",
        sm: "h-9 px-4 text-sm rounded-lg",
        lg: "h-11 px-6 rounded-lg",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-xs": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
