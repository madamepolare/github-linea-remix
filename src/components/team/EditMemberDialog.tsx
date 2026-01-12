import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Linkedin, Building2 } from "lucide-react";

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    user_id: string;
    profile?: {
      full_name?: string;
      avatar_url?: string;
      job_title?: string;
      phone?: string;
      email?: string;
      company?: string;
      linkedin_url?: string;
      bio?: string;
    };
  } | null;
}

export function EditMemberDialog({ open, onOpenChange, member }: EditMemberDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    job_title: "",
    phone: "",
    avatar_url: "",
    company: "",
    linkedin_url: "",
    bio: "",
  });

  useEffect(() => {
    if (member?.profile) {
      setFormData({
        full_name: member.profile.full_name || "",
        job_title: member.profile.job_title || "",
        phone: member.profile.phone || "",
        avatar_url: member.profile.avatar_url || "",
        company: (member.profile as any)?.company || "",
        linkedin_url: (member.profile as any)?.linkedin_url || "",
        bio: (member.profile as any)?.bio || "",
      });
    }
  }, [member]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Fichier invalide", description: "Veuillez sélectionner une image." });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Fichier trop volumineux", description: "L'image doit faire moins de 5 Mo." });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${member.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Photo téléchargée" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de télécharger la photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          job_title: formData.job_title || null,
          phone: formData.phone || null,
          avatar_url: formData.avatar_url || null,
          company: formData.company || null,
          linkedin_url: formData.linkedin_url || null,
          bio: formData.bio || null,
        })
        .eq("user_id", member.user_id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({ title: "Profil mis à jour" });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = formData.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
                <AvatarImage src={formData.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <label
                htmlFor="member-avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="member-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>
            <div>
              <p className="font-medium">{formData.full_name || "Nom du membre"}</p>
              <p className="text-sm text-muted-foreground">{member?.profile?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Cliquez pour changer la photo</p>
            </div>
          </div>

          {/* Form fields - matching ProfileSettings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member_full_name">Nom complet</Label>
              <Input
                id="member_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member_job_title">Fonction</Label>
              <Input
                id="member_job_title"
                value={formData.job_title}
                onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                placeholder="Architecte principal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member_company">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Entreprise
                </span>
              </Label>
              <Input
                id="member_company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Nom de l'agence"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member_phone">Téléphone</Label>
              <Input
                id="member_phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="member_linkedin">
                <span className="flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </span>
              </Label>
              <Input
                id="member_linkedin"
                value={formData.linkedin_url}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/profil"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={member?.profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member_bio">Bio</Label>
            <Textarea
              id="member_bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Quelques mots sur ce membre..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 caractères
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
