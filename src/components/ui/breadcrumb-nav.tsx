import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  dropdown?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <span className="text-muted-foreground/50 mx-1">/</span>
          )}
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                "font-medium text-foreground inline-flex items-center gap-1",
                item.dropdown && "cursor-pointer hover:text-muted-foreground transition-colors"
              )}
            >
              {item.label}
              {item.dropdown && <ChevronRight className="h-4 w-4 rotate-90" />}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
