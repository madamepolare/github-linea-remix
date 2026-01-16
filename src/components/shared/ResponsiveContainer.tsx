import { ReactNode } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveContainerProps {
  children: ReactNode;
  mobileContent?: ReactNode;
  breakpoint?: "sm" | "md" | "lg";
}

/**
 * Container that renders different content based on screen size
 * By default, switches at md breakpoint (768px)
 */
export function ResponsiveContainer({
  children,
  mobileContent,
  breakpoint = "md",
}: ResponsiveContainerProps) {
  const breakpointQueries = {
    sm: "(min-width: 640px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 1024px)",
  };

  const isDesktop = useMediaQuery(breakpointQueries[breakpoint]);

  // If no mobile content provided, always render children
  if (!mobileContent) {
    return <>{children}</>;
  }

  return isDesktop ? <>{children}</> : <>{mobileContent}</>;
}

/**
 * Hook to check if we're on mobile
 */
export function useIsMobile(breakpoint: "sm" | "md" | "lg" = "md") {
  const breakpointQueries = {
    sm: "(min-width: 640px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 1024px)",
  };

  const isDesktop = useMediaQuery(breakpointQueries[breakpoint]);
  return !isDesktop;
}
