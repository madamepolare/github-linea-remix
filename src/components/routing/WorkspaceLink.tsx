import { forwardRef } from "react";
import { Link, LinkProps } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface WorkspaceLinkProps extends Omit<LinkProps, "to"> {
  to: string;
}

/**
 * WorkspaceLink - A Link component that automatically prefixes paths with workspace slug
 * 
 * Usage:
 * <WorkspaceLink to="/projects">Projects</WorkspaceLink>
 * // Renders as: <Link to="/my-workspace/projects">Projects</Link>
 */
export const WorkspaceLink = forwardRef<HTMLAnchorElement, WorkspaceLinkProps>(
  ({ to, ...props }, ref) => {
    const { activeWorkspace } = useAuth();

    // Build workspace-prefixed path
    const getWorkspacePath = (path: string): string => {
      if (!activeWorkspace?.slug) return path;
      
      // Don't prefix if already has workspace slug
      if (path.startsWith(`/${activeWorkspace.slug}`)) return path;
      
      // Don't prefix public routes
      const publicPrefixes = ["/welcome", "/modules", "/solutions", "/auth", "/legal", "/about", "/blog", "/contact", "/roadmap", "/onboarding", "/invite"];
      if (publicPrefixes.some(prefix => path.startsWith(prefix))) return path;
      
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      return cleanPath ? `/${activeWorkspace.slug}/${cleanPath}` : `/${activeWorkspace.slug}`;
    };

    return <Link ref={ref} to={getWorkspacePath(to)} {...props} />;
  }
);

WorkspaceLink.displayName = "WorkspaceLink";
