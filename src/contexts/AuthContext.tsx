import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { storeCurrentSession } from "@/components/auth/QuickAccountSwitch";
import { consumePendingWorkspace } from "@/lib/founderSwitch";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  phone: string | null;
  active_workspace_id: string | null;
  onboarding_completed: boolean;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  role: string;
  /** UI preference: membership hidden for this user */
  is_hidden?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setActiveWorkspace: (workspaceId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile;
  };

  const fetchWorkspaces = async (userId: string) => {
    const { data, error } = await supabase
      .from("workspace_members")
      .select(
        `
        role,
        is_hidden,
        workspace:workspaces(id, name, slug, logo_url, plan)
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching workspaces:", error);
      return [];
    }

    return data.map((item: any) => ({
      ...item.workspace,
      role: item.role,
      is_hidden: item.is_hidden ?? false,
    })) as Workspace[];
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    }
    const workspacesData = await fetchWorkspaces(user.id);
    setWorkspaces(workspacesData);
  };

  const setActiveWorkspaceInternal = async (workspaceId: string, userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ active_workspace_id: workspaceId })
      .eq("user_id", userId);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, active_workspace_id: workspaceId } : null);
    }
    return !error;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Store session for quick switch (only for allowed accounts)
        if (session?.user?.email && session.refresh_token) {
          storeCurrentSession(session.user.email, session.refresh_token);
        } else if (import.meta.env.DEV) {
          console.info("[founderSwitch] session missing email/refresh_token", {
            hasSession: !!session,
            email: session?.user?.email,
            hasRefreshToken: !!session?.refresh_token,
            event,
          });
        }

        if (session?.user) {
          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(() => {
             Promise.all([
               fetchProfile(session.user.id),
               fetchWorkspaces(session.user.id)
             ]).then(([profileData, workspacesData]) => {
               setProfile(profileData);
               setWorkspaces(workspacesData);

               // Ensure profile points to a visible (non-hidden) workspace. If not, pick the first visible one and persist it.
               const visibleWs = workspacesData.filter((w) => !w.is_hidden);
               const activeExists =
                 !!profileData?.active_workspace_id &&
                 visibleWs.some((w) => w.id === profileData.active_workspace_id);
               if (profileData && visibleWs.length > 0 && !activeExists) {
                 setActiveWorkspaceInternal(visibleWs[0].id, session.user.id);
               }

               // Check for pending workspace switch (founder seamless switch)
               const pendingWorkspaceId = consumePendingWorkspace();
               if (pendingWorkspaceId) {
                 // Vérifie que le workspace existe pour ce user
                 const workspaceExists = workspacesData.some(w => w.id === pendingWorkspaceId);
                 if (workspaceExists && profileData?.active_workspace_id !== pendingWorkspaceId) {
                   setActiveWorkspaceInternal(pendingWorkspaceId, session.user.id);
                 }
               }
             });
          }, 0);
        } else {
          setProfile(null);
          setWorkspaces([]);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // If the locally stored session is corrupted (e.g. bad_jwt / missing sub), purge it.
      if (session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.warn("Invalid session detected, signing out", userError);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setWorkspaces([]);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
         Promise.all([
           fetchProfile(session.user.id),
           fetchWorkspaces(session.user.id)
         ]).then(([profileData, workspacesData]) => {
           setProfile(profileData);
           setWorkspaces(workspacesData);

           // Ensure profile points to a visible (non-hidden) workspace. If not, pick the first visible one and persist it.
           const visibleWs = workspacesData.filter((w) => !w.is_hidden);
           const activeExists =
             !!profileData?.active_workspace_id &&
             visibleWs.some((w) => w.id === profileData.active_workspace_id);
           if (profileData && visibleWs.length > 0 && !activeExists) {
             setActiveWorkspaceInternal(visibleWs[0].id, session.user.id);
           }

           // Check for pending workspace switch on initial load too
           const pendingWorkspaceId = consumePendingWorkspace();
           if (pendingWorkspaceId) {
             const workspaceExists = workspacesData.some(w => w.id === pendingWorkspaceId);
             if (workspaceExists && profileData?.active_workspace_id !== pendingWorkspaceId) {
               setActiveWorkspaceInternal(pendingWorkspaceId, session.user.id);
             }
           }
           
           setLoading(false);
           setIsInitialized(true);
         });
      } else {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setWorkspaces([]);
  };

  const setActiveWorkspace = async (workspaceId: string) => {
    if (!user) return;
    await setActiveWorkspaceInternal(workspaceId, user.id);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  // Only consider non-hidden workspaces for auto-selection
  const visibleWorkspaces = workspaces.filter((w) => !w.is_hidden);
  const activeWorkspace =
    workspaces.find((w) => w.id === profile?.active_workspace_id) ||
    visibleWorkspaces[0] ||
    null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        workspaces,
        activeWorkspace,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        setActiveWorkspace,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
