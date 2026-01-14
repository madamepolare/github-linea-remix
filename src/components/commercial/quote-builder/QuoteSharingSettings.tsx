import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Link2, 
  Copy, 
  ExternalLink, 
  Loader2,
  CheckCircle2,
  Euro,
  Calendar,
  Globe,
  Sparkles
} from 'lucide-react';
import { QuoteDocument } from '@/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuoteSharingSettingsProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (updates: Partial<QuoteDocument>) => void;
}

export function QuoteSharingSettings({ document, onDocumentChange }: QuoteSharingSettingsProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const depositAmount = (document.total_amount || 0) * ((document.deposit_percentage || 30) / 100);

  const handleGenerateLink = async () => {
    if (!document.id) {
      toast.error('Veuillez d\'abord enregistrer le devis');
      return;
    }

    setIsGeneratingLink(true);

    try {
      // Generate a unique token
      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      
      // Create the public link entry
      const { error } = await supabase
        .from('quote_public_links')
        .insert({
          document_id: document.id,
          workspace_id: document.workspace_id,
          token,
          requires_deposit: document.requires_deposit || false,
          deposit_percentage: document.deposit_percentage || 30,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (error) throw error;

      // Use production URL - detect from current origin or use custom domain
      const productionUrl = window.location.hostname.includes('lovable') 
        ? 'https://archigood.lovable.app' 
        : `${window.location.protocol}//${window.location.host}`;
      const publicUrl = `${productionUrl}/q/${token}`;
      setGeneratedLink(publicUrl);
      toast.success('Lien de consultation créé');
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Erreur lors de la génération du lien');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      toast.success('Lien copié dans le presse-papier');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Devis interactif en ligne</CardTitle>
            <CardDescription>
              Partagez un lien sécurisé pour que votre client puisse consulter et signer le devis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Features list */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3 w-3" />
            Options activables/désactivables
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            Signature électronique
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            Paiement acompte intégré
          </Badge>
        </div>

        {/* Deposit settings */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Euro className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="requires_deposit" className="font-medium cursor-pointer">
                  Requiert un acompte à la signature
                </Label>
                <p className="text-xs text-muted-foreground">
                  Le client devra payer un acompte pour valider le devis
                </p>
              </div>
            </div>
            <Switch
              id="requires_deposit"
              checked={document.requires_deposit || false}
              onCheckedChange={(checked) => onDocumentChange({ requires_deposit: checked })}
            />
          </div>

          {document.requires_deposit && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <Label>Pourcentage de l'acompte</Label>
                <span className="font-medium">{document.deposit_percentage || 30}%</span>
              </div>
              <Slider
                value={[document.deposit_percentage || 30]}
                onValueChange={([value]) => onDocumentChange({ deposit_percentage: value })}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-muted-foreground">Montant de l'acompte</span>
                <span className="font-semibold text-lg">{formatCurrency(depositAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Link generation */}
        <div className="space-y-3">
          {!generatedLink ? (
            <Button 
              onClick={handleGenerateLink} 
              disabled={isGeneratingLink || !document.id}
              className="w-full"
            >
              {isGeneratingLink ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Générer un lien de consultation
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-sm text-green-700 font-medium">
                  Lien créé avec succès
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Input 
                  value={generatedLink} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyLink}
                  className={cn(linkCopied && "bg-green-50 border-green-200")}
                >
                  {linkCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setGeneratedLink(null)}
                className="w-full text-muted-foreground"
              >
                Générer un nouveau lien
              </Button>
            </div>
          )}
          
          {!document.id && (
            <p className="text-xs text-muted-foreground text-center">
              Enregistrez le devis pour pouvoir générer un lien de partage
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
