import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Copy, RefreshCw, UserPlus } from "lucide-react";

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generatePassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function CreateMemberDialog({ open, onOpenChange }: CreateMemberDialogProps) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState("member");
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setJobTitle("");
    setPhone("");
    setPassword(generatePassword());
    setRole("member");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const regeneratePassword = () => {
    setPassword(generatePassword());
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast({ title: "Mot de passe copié" });
    } catch {
      toast({ title: "Mot de passe", description: password });
    }
  };

  const copyCredentials = async () => {
    const credentials = `Email: ${email}\nMot de passe provisoire: ${password}`;
    try {
      await navigator.clipboard.writeText(credentials);
      toast({ title: "Identifiants copiés" });
    } catch {
      toast({ title: "Identifiants", description: credentials });
    }
  };

  const handleCreate = async () => {
    if (!activeWorkspace || !email || !fullName || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: email.toLowerCase().trim(),
          password,
          fullName: fullName.trim(),
          workspaceId: activeWorkspace.id,
          role,
          jobTitle: jobTitle.trim() || null,
          phone: phone.trim() || null,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Copy credentials before closing
      await copyCredentials();

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Membre créé",
        description: "Les identifiants ont été copiés dans le presse-papiers",
      });
      handleClose(false);
    } catch (error: any) {
      console.error("Error creating member:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le membre",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Créer un membre
          </DialogTitle>
          <DialogDescription>
            Créer un compte utilisateur avec un mot de passe provisoire. L'utilisateur pourra le changer après connexion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Nom complet *</Label>
            <Input
              placeholder="Jean Dupont"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Poste</Label>
              <Input
                placeholder="Designer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                placeholder="+33 6 00 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="member">Membre</SelectItem>
                <SelectItem value="viewer">Lecteur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mot de passe provisoire *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={regeneratePassword}
                title="Générer nouveau"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyPassword}
                title="Copier"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mot de passe sera communiqué à l'utilisateur. Il pourra le modifier dans ses paramètres.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={creating || !email || !fullName || !password}>
            {creating ? "Création..." : "Créer et copier les identifiants"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
