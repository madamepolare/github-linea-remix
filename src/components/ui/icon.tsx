import { LucideIcon, LucideProps } from "lucide-react";
import { forwardRef } from "react";

interface IconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIcon;
}

/**
 * Thin icon wrapper component
 * Applies strokeWidth={1.5} for a lighter, more elegant appearance
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: LucideIcon, strokeWidth = 1.5, ...props }, ref) => {
    return <LucideIcon ref={ref} strokeWidth={strokeWidth} {...props} />;
  }
);

Icon.displayName = "Icon";

/**
 * Default stroke width for thin icons
 */
export const THIN_STROKE = 1.5;
