import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, Save, Upload, FileText, Palette, Image, PenLine, X, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAgencyInfo, UpdateAgencyInfoInput } from "@/hooks/useAgencyInfo";
import { usePlanningSettings } from "@/hooks/usePlanningSettings";
import { supabase } from "@/integrations/supabase/client";
import { LiveDocumentPreview } from "@/components/documents/editors/LiveDocumentPreview";
import { ScrollArea } from "@/components/ui/scroll-area";

const workspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

// Helper component for hours select
function HourSelect({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value.toString()} onValueChange={(v) => onChange(parseInt(v))}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h.toString()}>
              {h.toString().padStart(2, "0")}:00
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AgencyHoursSection() {
  const { planningSettings, updatePlanningSettings, isLoading } = usePlanningSettings();

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-1">Heures d'ouverture</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Les créneaux en dehors de ces horaires seront grisés sur le planning
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <HourSelect
            value={planningSettings.agency_open_hour}
            onChange={(v) => updatePlanningSettings.mutate({ agency_open_hour: v })}
            label="Ouverture"
          />
          <span className="text-muted-foreground mt-6">à</span>
          <HourSelect
            value={planningSettings.agency_close_hour}
            onChange={(v) => updatePlanningSettings.mutate({ agency_close_hour: v })}
            label="Fermeture"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-1">Pause déjeuner</h4>
        <p className="text-sm text-muted-foreground mb-4">
          La pause sera légèrement grisée mais reste planifiable
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <HourSelect
            value={planningSettings.lunch_start_hour}
            onChange={(v) => updatePlanningSettings.mutate({ lunch_start_hour: v })}
            label="Début"
          />
          <span className="text-muted-foreground mt-6">à</span>
          <HourSelect
            value={planningSettings.lunch_end_hour}
            onChange={(v) => updatePlanningSettings.mutate({ lunch_end_hour: v })}
            label="Fin"
          />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSettings() {
  const { activeWorkspace, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { agencyInfo, isLoading: isLoadingAgency, updateAgencyInfo } = useAgencyInfo();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<UpdateAgencyInfoInput>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [dailyRate, setDailyRate] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Fetch daily rate
  useEffect(() => {
    if (activeWorkspace) {
      supabase.from("workspaces").select("daily_rate").eq("id", activeWorkspace.id).single()
        .then(({ data }) => setDailyRate(data?.daily_rate?.toString() || ""));
    }
  }, [activeWorkspace]);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: activeWorkspace?.name || "",
      slug: activeWorkspace?.slug || "",
    },
  });

  useEffect(() => {
    if (agencyInfo) {
      setFormData({
        name: agencyInfo.name,
        logo_url: agencyInfo.logo_url,
        signature_url: agencyInfo.signature_url,
        address: agencyInfo.address || '',
        city: agencyInfo.city || '',
        postal_code: agencyInfo.postal_code || '',
        phone: agencyInfo.phone || '',
        email: agencyInfo.email || '',
        website: agencyInfo.website || '',
        siret: agencyInfo.siret || '',
        siren: agencyInfo.siren || '',
        vat_number: agencyInfo.vat_number || '',
        capital_social: agencyInfo.capital_social || undefined,
        forme_juridique: agencyInfo.forme_juridique || '',
        rcs_city: agencyInfo.rcs_city || '',
        code_naf: agencyInfo.code_naf || '',
        footer_text: agencyInfo.footer_text || '',
      });
    }
  }, [agencyInfo]);

  const handleChange = (field: keyof UpdateAgencyInfoInput, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: WorkspaceFormData) => {
    if (!activeWorkspace) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ name: data.name, slug: data.slug })
        .eq("id", activeWorkspace.id);

      if (error) {
        if (error.message.includes("duplicate")) {
          toast({
            variant: "destructive",
            title: "Slug already taken",
            description: "Please choose a different workspace URL.",
          });
        } else {
          throw error;
        }
        return;
      }

      await refreshProfile();
      toast({
        title: "Workspace updated",
        description: "Your workspace settings have been saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating workspace",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAgency = async () => {
    setIsLoading(true);
    try {
      await updateAgencyInfo.mutateAsync(formData);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'signature') => {
    if (!activeWorkspace) return;

    const setUploading = type === 'logo' ? setIsUploadingLogo : setIsUploadingSignature;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeWorkspace.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('workspace-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        const { error: bucketError } = await supabase.storage.createBucket('workspace-assets', {
          public: true,
        });
        
        if (!bucketError) {
          const { error: retryError } = await supabase.storage
            .from('workspace-assets')
            .upload(fileName, file, { upsert: true });
          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('workspace-assets')
        .getPublicUrl(fileName);

      const fieldName = type === 'logo' ? 'logo_url' : 'signature_url';
      handleChange(fieldName, publicUrl);

      toast({
        title: type === 'logo' ? "Logo uploadé" : "Signature uploadée",
        description: "L'image a été enregistrée avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'upload",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (type: 'logo' | 'signature') => {
    const fieldName = type === 'logo' ? 'logo_url' : 'signature_url';
    handleChange(fieldName, null);
  };

  if (!activeWorkspace) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No workspace selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Paramètres du Workspace
              </CardTitle>
              <CardDescription>Gérez les informations de votre agence</CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">
              {activeWorkspace.plan} plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="general" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Général</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Horaires</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Légal</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Logo & Signature</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Aperçu</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du Workspace</Label>
                    <Input
                      id="name"
                      placeholder="Mon Agence d'Architecture"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL du Workspace</Label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 h-10 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                        linea.app/
                      </span>
                      <Input
                        id="slug"
                        className="rounded-l-none"
                        {...form.register("slug")}
                      />
                    </div>
                    {form.formState.errors.slug && (
                      <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                    )}
                  </div>
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

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Tarification</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Tarif journalier (€/jour)</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      onBlur={async () => {
                        if (!activeWorkspace) return;
                        const value = dailyRate ? parseFloat(dailyRate) : 0;
                        await supabase.from("workspaces").update({ daily_rate: value }).eq("id", activeWorkspace.id);
                        toast({ title: "Tarif mis à jour" });
                      }}
                      placeholder="500"
                    />
                    <p className="text-xs text-muted-foreground">Utilisé pour calculer les coûts dans l'onglet Budget</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Coordonnées de l'agence</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agency-name">Nom de l'agence</Label>
                    <Input
                      id="agency-name"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="DOMINI Architecture"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="www.domini.fr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-email">Email</Label>
                    <Input
                      id="workspace-email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contact@domini.fr"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="123 rue de l'Architecture"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code || ''}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveAgency} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Enregistrer les coordonnées
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hours" className="space-y-6">
              <AgencyHoursSection />
            </TabsContent>

            <TabsContent value="legal" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="forme_juridique">Forme juridique</Label>
                  <Input
                    id="forme_juridique"
                    value={formData.forme_juridique || ''}
                    onChange={(e) => handleChange('forme_juridique', e.target.value)}
                    placeholder="SARL, SAS, EURL..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capital_social">Capital social (€)</Label>
                  <Input
                    id="capital_social"
                    type="number"
                    value={formData.capital_social || ''}
                    onChange={(e) => handleChange('capital_social', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={formData.siret || ''}
                    onChange={(e) => handleChange('siret', e.target.value)}
                    placeholder="123 456 789 00012"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siren">SIREN</Label>
                  <Input
                    id="siren"
                    value={formData.siren || ''}
                    onChange={(e) => handleChange('siren', e.target.value)}
                    placeholder="123 456 789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rcs_city">RCS (ville)</Label>
                  <Input
                    id="rcs_city"
                    value={formData.rcs_city || ''}
                    onChange={(e) => handleChange('rcs_city', e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code_naf">Code NAF</Label>
                  <Input
                    id="code_naf"
                    value={formData.code_naf || ''}
                    onChange={(e) => handleChange('code_naf', e.target.value)}
                    placeholder="7111Z"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_number">N° TVA intracommunautaire</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number || ''}
                  onChange={(e) => handleChange('vat_number', e.target.value)}
                  placeholder="FR 12 345678901"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footer_text">Texte de pied de page</Label>
                <Textarea
                  id="footer_text"
                  value={formData.footer_text || ''}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  placeholder="Mention légale, slogan, etc."
                  rows={2}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveAgency} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Logo de l'agence
                    </CardTitle>
                    <CardDescription>
                      Ce logo apparaîtra sur tous vos documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logo');
                      }}
                    />
                    {formData.logo_url ? (
                      <div className="relative">
                        <div className="border rounded-lg p-4 bg-muted/50 flex items-center justify-center min-h-[120px]">
                          <img 
                            src={formData.logo_url} 
                            alt="Logo" 
                            className="max-h-24 max-w-full object-contain"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleRemoveImage('logo')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-32 border-dashed"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Cliquez pour uploader</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Signature */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
                      Signature
                    </CardTitle>
                    <CardDescription>
                      Votre signature apparaîtra automatiquement sur les documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'signature');
                      }}
                    />
                    {formData.signature_url ? (
                      <div className="relative">
                        <div className="border rounded-lg p-4 bg-white flex items-center justify-center min-h-[120px]">
                          <img 
                            src={formData.signature_url} 
                            alt="Signature" 
                            className="max-h-20 max-w-full object-contain"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleRemoveImage('signature')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-32 border-dashed"
                        onClick={() => signatureInputRef.current?.click()}
                        disabled={isUploadingSignature}
                      >
                        {isUploadingSignature ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Cliquez pour uploader</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAgency} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Aperçu du document</CardTitle>
                  <CardDescription>
                    Visualisez l'apparence de vos documents en temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <ScrollArea className="h-[500px]">
                      <div className="flex justify-center">
                        <LiveDocumentPreview
                          documentType="power_of_attorney"
                          documentNumber="DOC-2025-0001"
                          title="Document exemple"
                          content={{
                            delegator_name: "Jean Dupont",
                            delegator_role: "Gérant",
                            delegate_name: "Marie Martin",
                            scope: "Tous pouvoirs pour représenter l'agence",
                          }}
                          scale={0.4}
                        />
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles et destructives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Supprimer le Workspace</p>
              <p className="text-sm text-muted-foreground">
                Supprime définitivement ce workspace et toutes ses données
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}