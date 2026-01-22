import { LucideIcon, LucideProps } from "lucide-react";
import { forwardRef } from "react";

interface IconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIcon;
}

/**
 * Default stroke width from CSS variable --icon-stroke-width
 * Falls back to 1.25 if variable is not set
 */
const getIconStrokeWidth = (): number => {
  if (typeof window !== 'undefined') {
    const cssValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--icon-stroke-width')
      .trim();
    return cssValue ? parseFloat(cssValue) : 1.25;
  }
  return 1.25;
};

/**
 * Thin icon wrapper component
 * Uses --icon-stroke-width from CSS for consistent weight across the app
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: LucideIcon, strokeWidth, ...props }, ref) => {
    // Use provided strokeWidth or fall back to CSS variable
    const effectiveStrokeWidth = strokeWidth ?? getIconStrokeWidth();
    return <LucideIcon ref={ref} strokeWidth={effectiveStrokeWidth} {...props} />;
  }
);

Icon.displayName = "Icon";

/**
 * Default stroke width for thin icons (from design system)
 */
export const THIN_STROKE = 1.25;
