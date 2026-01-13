import { ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, workspaces, activeWorkspace, loading } = useAuth();
  const location = useLocation();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding but is accessing root without workspace slug
  // Redirect to their active workspace
  if (profile?.onboarding_completed && !workspaceSlug && location.pathname === "/") {
    const targetWorkspace = activeWorkspace || workspaces.find(w => !w.is_hidden) || workspaces[0];
    if (targetWorkspace) {
      return <Navigate to={`/${targetWorkspace.slug}`} replace />;
    }
  }

  return <>{children}</>;
}
