import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Building2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Comptes liés pour le quick switch (hardcoded pour le fondateur uniquement)
const LINKED_ACCOUNTS = [
  {
    email: "gt@domini.archi",
    name: "Giacomo Terrani",
    workspace: "DOMINI",
  },
  {
    email: "giacomo@madamepolare.com",
    name: "Giacomo Terrani",
    workspace: "MadamePolare",
  },
];

// Emails autorisés pour le quick switch
const ALLOWED_EMAILS = LINKED_ACCOUNTS.map((a) => a.email.toLowerCase());

const STORAGE_KEY = "linea_linked_sessions";

interface StoredSession {
  email: string;
  refresh_token: string;
  stored_at: number;
}

// Stocke la session actuelle pour un compte lié
export function storeCurrentSession(email: string, refreshToken: string) {
  if (!ALLOWED_EMAILS.includes(email.toLowerCase())) return;
  
  const stored = getStoredSessions();
  const updated = stored.filter(s => s.email.toLowerCase() !== email.toLowerCase());
  updated.push({
    email: email.toLowerCase(),
    refresh_token: refreshToken,
    stored_at: Date.now(),
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

function getStoredSessions(): StoredSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getStoredSessionForEmail(email: string): StoredSession | null {
  const sessions = getStoredSessions();
  return sessions.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
}

interface QuickAccountSwitchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail?: string;
}

export function QuickAccountSwitch({
  open,
  onOpenChange,
  currentEmail,
}: QuickAccountSwitchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const { toast } = useToast();

  const otherAccounts = LINKED_ACCOUNTS.filter(
    (a) => a.email.toLowerCase() !== currentEmail?.toLowerCase()
  );

  // Vérifie quels comptes ont une session stockée
  const accountsWithStatus = otherAccounts.map(account => ({
    ...account,
    hasStoredSession: !!getStoredSessionForEmail(account.email),
  }));

  const handleInstantSwitch = async (email: string) => {
    const storedSession = getStoredSessionForEmail(email);
    
    if (!storedSession) {
      toast({
        variant: "destructive",
        title: "Session non disponible",
        description: "Connecte-toi d'abord manuellement à ce compte pour activer le switch instantané.",
      });
      return;
    }

    setIsLoading(true);
    setSwitchingTo(email);

    try {
      // Utilise le refresh token stocké pour restaurer la session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: storedSession.refresh_token,
      });

      if (error || !data.session) {
        // Le refresh token a expiré, on le supprime
        const stored = getStoredSessions().filter(
          s => s.email.toLowerCase() !== email.toLowerCase()
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        
        toast({
          variant: "destructive",
          title: "Session expirée",
          description: "Reconnecte-toi manuellement à ce compte.",
        });
        setIsLoading(false);
        setSwitchingTo(null);
        return;
      }

      // Met à jour le token stocké avec le nouveau
      storeCurrentSession(email, data.session.refresh_token);

      toast({
        title: "Compte changé ✓",
        description: `Connecté en tant que ${email}`,
      });

      onOpenChange(false);
      
      // Force reload pour réinitialiser tout le state
      window.location.href = "/";
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de changer de compte.",
      });
    } finally {
      setIsLoading(false);
      setSwitchingTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Switch instantané
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {accountsWithStatus.map((account) => (
            <motion.button
              key={account.email}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleInstantSwitch(account.email)}
              disabled={isLoading}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left",
                account.hasStoredSession
                  ? "border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer"
                  : "border-border opacity-60 cursor-not-allowed",
                switchingTo === account.email && "border-primary bg-primary/10"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                {account.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">
                  {account.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {account.email}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded font-medium">
                  <Building2 className="h-3 w-3" />
                  {account.workspace}
                </div>
                {!account.hasStoredSession && (
                  <span className="text-xs text-muted-foreground">
                    Connexion requise
                  </span>
                )}
              </div>
              {switchingTo === account.email && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </motion.button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Les sessions sont stockées localement. Connecte-toi manuellement à chaque compte une première fois.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Hook pour vérifier si l'utilisateur peut utiliser le quick switch
export function useCanQuickSwitch(email?: string | null) {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
