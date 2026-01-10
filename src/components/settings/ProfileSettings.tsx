import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Loader2, Save, Camera, Linkedin, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const profileSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  jobTitle: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(255).optional(),
  linkedinUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || "",
      jobTitle: profile?.job_title || "",
      phone: profile?.phone || "",
      company: (profile as any)?.company || "",
      linkedinUrl: (profile as any)?.linkedin_url || "",
      bio: (profile as any)?.bio || "",
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({ title: "Photo mise à jour", description: "Votre photo de profil a été enregistrée." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          job_title: data.jobTitle || null,
          phone: data.phone || null,
          company: data.company || null,
          linkedin_url: data.linkedinUrl || null,
          bio: data.bio || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayedAvatar = avatarPreview || profile?.avatar_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Votre profil
          </CardTitle>
          <CardDescription>Gérez vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 cursor-pointer ring-2 ring-border hover:ring-primary transition-all" onClick={handleAvatarClick}>
                  <AvatarImage src={displayedAvatar || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <p className="font-medium">{profile?.full_name || "Votre nom"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Cliquez pour changer la photo</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  placeholder="Jean Dupont"
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Fonction</Label>
                <Input
                  id="jobTitle"
                  placeholder="Architecte principal"
                  {...form.register("jobTitle")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Entreprise
                  </span>
                </Label>
                <Input
                  id="company"
                  placeholder="Nom de votre agence"
                  {...form.register("company")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+33 1 23 45 67 89"
                  {...form.register("phone")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="linkedinUrl">
                  <span className="flex items-center gap-1.5">
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </span>
                </Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/votre-profil"
                  {...form.register("linkedinUrl")}
                />
                {form.formState.errors.linkedinUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.linkedinUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Quelques mots sur vous et votre expertise..."
                rows={3}
                {...form.register("bio")}
              />
              <p className="text-xs text-muted-foreground">
                {(form.watch("bio") || "").length}/500 caractères
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
