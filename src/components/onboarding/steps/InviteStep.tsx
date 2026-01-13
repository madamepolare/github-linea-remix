import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, UserPlus, X, Mail, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface InviteStepProps {
  onNext: (emails: string[]) => void;
  onBack: () => void;
}

export function InviteStep({ onNext, onBack }: InviteStepProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [error, setError] = useState("");

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const email = currentEmail.trim().toLowerCase();
    if (!email) return;
    
    if (!isValidEmail(email)) {
      setError("Email invalide");
      return;
    }
    
    if (emails.includes(email)) {
      setError("Email déjà ajouté");
      return;
    }
    
    setEmails([...emails, email]);
    setCurrentEmail("");
    setError("");
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <Users className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Invitez votre équipe</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Ajoutez les emails de vos collaborateurs. Ils recevront une invitation à rejoindre votre workspace.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={currentEmail}
                onChange={(e) => {
                  setCurrentEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="email@exemple.com"
                className={cn(
                  "h-14 pl-12 text-lg rounded-xl border-2",
                  error ? "border-destructive" : "focus:border-primary"
                )}
              />
            </div>
            <Button
              onClick={addEmail}
              variant="outline"
              className="h-14 px-6 rounded-xl border-2"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
          
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          {emails.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap gap-2"
            >
              {emails.map((email) => (
                <motion.span
                  key={email}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary"
                >
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {emails.length === 0
              ? "Vous pouvez passer cette étape et inviter des membres plus tard"
              : `${emails.length} invitation${emails.length > 1 ? "s" : ""} prête${emails.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex justify-between mt-10">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div className="flex gap-3">
            {emails.length === 0 && (
              <Button variant="ghost" onClick={() => onNext([])}>
                Passer
              </Button>
            )}
            <Button
              onClick={() => onNext(emails)}
              className="gap-2 h-12 px-6 rounded-xl"
            >
              {emails.length > 0 ? "Envoyer les invitations" : "Continuer"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
