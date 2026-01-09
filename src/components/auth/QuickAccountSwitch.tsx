import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Comptes liés pour le quick switch (hardcoded pour toi uniquement)
const LINKED_ACCOUNTS = [
  {
    email: "gt@domini.archi",
    name: "Giacomo Terrani",
    workspace: "DOMINI",
    avatarUrl: null,
  },
  {
    email: "giacomo@madamepolare.com",
    name: "Giacomo Terrani",
    workspace: "MadamePolare",
    avatarUrl: null,
  },
];

// Emails autorisés pour le quick switch
const ALLOWED_EMAILS = LINKED_ACCOUNTS.map((a) => a.email.toLowerCase());

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
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn, signOut } = useAuth();

  const otherAccounts = LINKED_ACCOUNTS.filter(
    (a) => a.email.toLowerCase() !== currentEmail?.toLowerCase()
  );

  const handleSwitch = async () => {
    if (!selectedAccount || !password) return;

    setIsLoading(true);
    
    // D'abord se déconnecter
    await signOut();
    
    // Puis se reconnecter avec le nouveau compte
    const { error } = await signIn(selectedAccount, password);
    
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: "Mot de passe incorrect.",
      });
      setPassword("");
    } else {
      onOpenChange(false);
      setPassword("");
      setSelectedAccount(null);
      toast({
        title: "Compte changé",
        description: `Connecté en tant que ${selectedAccount}`,
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setPassword("");
    setSelectedAccount(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer de compte</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Liste des comptes disponibles */}
          <div className="space-y-2">
            <Label>Sélectionnez un compte</Label>
            <div className="space-y-2">
              {otherAccounts.map((account) => (
                <motion.button
                  key={account.email}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedAccount(account.email)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    selectedAccount === account.email
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    {account.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {account.name}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {account.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    <Building2 className="h-3 w-3" />
                    {account.workspace}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Champ mot de passe */}
          {selectedAccount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <Label htmlFor="switch-password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="switch-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password) {
                      handleSwitch();
                    }
                  }}
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSwitch}
            disabled={!selectedAccount || !password || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <User className="h-4 w-4 mr-2" />
            )}
            Se connecter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook pour vérifier si l'utilisateur peut utiliser le quick switch
export function useCanQuickSwitch(email?: string | null) {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
