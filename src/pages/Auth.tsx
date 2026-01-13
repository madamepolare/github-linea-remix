import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, profile, loading } = useAuth();
  
  // Get redirect parameter for invitation flow
  const redirectTo = searchParams.get('redirect');
  const inviteEmail = searchParams.get('email');
  
  // Check for pending invite in sessionStorage
  const pendingInviteToken = sessionStorage.getItem('pendingInviteToken');
  const pendingInviteEmail = sessionStorage.getItem('pendingInviteEmail');
  const pendingInviteWorkspace = sessionStorage.getItem('pendingInviteWorkspace');
  const pendingInviteRole = sessionStorage.getItem('pendingInviteRole');
  
  // Determine if we're in invite flow
  const isInviteFlow = !!(redirectTo?.includes('/invite') || pendingInviteToken);
  const suggestedEmail = inviteEmail || pendingInviteEmail || '';

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: suggestedEmail, password: "" },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: suggestedEmail, password: "", confirmPassword: "" },
  });

  // Get workspaces from auth context
  const { workspaces, activeWorkspace } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      // If there's a pending invite, go accept it
      if (pendingInviteToken) {
        navigate(`/invite?token=${pendingInviteToken}`);
        return;
      }
      // If redirect parameter exists (invitation flow), go there first
      if (redirectTo) {
        navigate(redirectTo);
        return;
      }
      // Otherwise check if onboarding is completed
      if (profile?.onboarding_completed) {
        // Redirect to workspace-scoped URL
        const targetWorkspace = activeWorkspace || workspaces.find(w => !w.is_hidden) || workspaces[0];
        if (targetWorkspace) {
          navigate(`/${targetWorkspace.slug}`);
        } else {
          // No workspace yet, go to onboarding
          navigate("/onboarding");
        }
      } else {
        navigate("/onboarding");
      }
    }
  }, [user, profile, workspaces, activeWorkspace, loading, navigate, redirectTo, pendingInviteToken]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
      });
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = "An account with this email already exists. Please sign in.";
      }
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: message,
      });
    } else {
      toast({
        title: "Compte créé !",
        description: "Bienvenue sur Linea. Configurons votre espace de travail.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
        
        {/* Geometric pattern - Linea style */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="linea-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="80" y2="0" stroke="currentColor" strokeWidth="1"/>
                <line x1="0" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#linea-grid)" className="text-background"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-background">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-background" />
              <div className="w-4 h-0.5 bg-background/60" />
              <div className="w-2 h-0.5 bg-background/30" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">LINEA</span>
          </div>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-5xl font-bold leading-tight"
            >
              Concevez l'avenir.<br />
              Gérez avec précision.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-background/70 max-w-md"
            >
              La plateforme complète pour les agences d'architecture. Projets, CRM, appels d'offres, finances et suivi de chantier — tout en un seul endroit.
            </motion.p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="font-display text-3xl font-bold">500+</div>
              <div className="text-sm text-background/60">Agences</div>
            </div>
            <div className="h-12 w-px bg-background/20" />
            <div className="text-center">
              <div className="font-display text-3xl font-bold">15K+</div>
              <div className="text-sm text-background/60">Projets gérés</div>
            </div>
            <div className="h-12 w-px bg-background/20" />
            <div className="text-center">
              <div className="font-display text-3xl font-bold">€2Md+</div>
              <div className="text-sm text-background/60">CA suivi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-foreground" />
              <div className="w-3 h-0.5 bg-foreground/60" />
              <div className="w-1.5 h-0.5 bg-foreground/30" />
            </div>
            <span className="font-display text-xl font-bold text-foreground tracking-tight">LINEA</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Invitation Banner */}
            {isInviteFlow && pendingInviteWorkspace && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Rejoignez {pendingInviteWorkspace}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invité en tant que <strong>{pendingInviteRole}</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center space-y-2">
              <h2 className="font-display text-3xl font-bold text-foreground">
                {isInviteFlow 
                  ? (isLogin ? "Connectez-vous" : "Créez votre compte")
                  : (isLogin ? "Bon retour" : "Créez votre compte")}
              </h2>
              <p className="text-muted-foreground">
                {isInviteFlow
                  ? (isLogin 
                      ? "Connectez-vous pour rejoindre l'équipe" 
                      : `Inscrivez-vous avec ${suggestedEmail}`)
                  : (isLogin
                      ? "Connectez-vous à votre espace Linea"
                      : "Commencez à gérer votre agence")}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  !isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inscription
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="vous@agence.com"
                        className="pl-10"
                        {...loginForm.register("email")}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Se connecter
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={signupForm.handleSubmit(handleSignup)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jean Dupont"
                        className="pl-10"
                        {...signupForm.register("fullName")}
                      />
                    </div>
                    {signupForm.formState.errors.fullName && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="vous@agence.com"
                        className="pl-10"
                        {...signupForm.register("email")}
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        {...signupForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10"
                        {...signupForm.register("confirmPassword")}
                      />
                    </div>
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Créer mon compte
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    En vous inscrivant, vous acceptez nos{" "}
                    <a href="#" className="text-foreground hover:underline">Conditions d'utilisation</a>
                    {" "}et notre{" "}
                    <a href="#" className="text-foreground hover:underline">Politique de confidentialité</a>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
