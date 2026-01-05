import { useState, useEffect } from 'react';
import { useAgencyInfo, UpdateAgencyInfoInput } from '@/hooks/useAgencyInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Building2, Palette, FileText, Save, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { LiveDocumentPreview } from '@/components/documents/editors/LiveDocumentPreview';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AgencySettings() {
  const { agencyInfo, isLoading, updateAgencyInfo } = useAgencyInfo();
  const [formData, setFormData] = useState<UpdateAgencyInfoInput>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (agencyInfo) {
      setFormData({
        name: agencyInfo.name,
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
        primary_color: agencyInfo.primary_color || '#1a1a2e',
        secondary_color: agencyInfo.secondary_color || '#16213e',
        accent_color: agencyInfo.accent_color || '#0f3460',
        footer_text: agencyInfo.footer_text || '',
      });
    }
  }, [agencyInfo]);

  const handleChange = (field: keyof UpdateAgencyInfoInput, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAgencyInfo.mutateAsync(formData);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Paramètres de l'agence</h3>
          <p className="text-sm text-muted-foreground">
            Ces informations apparaîtront sur tous vos documents
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <div className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Général</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Légal</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Style</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Identité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'agence</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="DOMINI Architecture"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="contact@domini.fr"
                      />
                    </div>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Adresse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address || ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="123 rue de l'Architecture"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations légales</CardTitle>
                  <CardDescription>
                    Ces informations seront affichées dans le pied de page des documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Couleurs des documents</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de vos documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Couleur principale</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={formData.primary_color || '#1a1a2e'}
                          onChange={(e) => handleChange('primary_color', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.primary_color || '#1a1a2e'}
                          onChange={(e) => handleChange('primary_color', e.target.value)}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Couleur secondaire</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={formData.secondary_color || '#16213e'}
                          onChange={(e) => handleChange('secondary_color', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.secondary_color || '#16213e'}
                          onChange={(e) => handleChange('secondary_color', e.target.value)}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent_color">Couleur d'accent</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accent_color"
                          type="color"
                          value={formData.accent_color || '#0f3460'}
                          onChange={(e) => handleChange('accent_color', e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.accent_color || '#0f3460'}
                          onChange={(e) => handleChange('accent_color', e.target.value)}
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pied de page personnalisé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Texte additionnel</Label>
                    <Textarea
                      id="footer_text"
                      value={formData.footer_text || ''}
                      onChange={(e) => handleChange('footer_text', e.target.value)}
                      placeholder="Mention légale, slogan, etc."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Aperçu en temps réel */}
        <div className="lg:sticky lg:top-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Aperçu du document</CardTitle>
              <CardDescription>
                Visualisez l'apparence de vos documents en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-muted/50 rounded-lg overflow-hidden"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
                    linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
                    linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
                  `,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                }}
              >
                <ScrollArea className="h-[500px]">
                  <div className="p-4 flex justify-center">
                    <LiveDocumentPreview
                      documentType="power_of_attorney"
                      documentNumber="DOC-2025-0001"
                      title="Document exemple"
                      content={{
                        delegator_name: "Jean Dupont",
                        delegator_role: "Gérant",
                        delegate_name: "Marie Martin",
                      }}
                      scale={0.35}
                    />
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
