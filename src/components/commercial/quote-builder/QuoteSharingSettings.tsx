import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Link2, 
  Copy, 
  ExternalLink, 
  CheckCircle2,
  Globe,
  Sparkles
} from 'lucide-react';
import { ButtonLoader } from "@/components/ui/patterns";
import { QuoteDocument } from '@/types/quoteTypes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getOrCreatePublicQuoteLink } from '@/lib/publicQuoteLink';

interface QuoteSharingSettingsProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (updates: Partial<QuoteDocument>) => void;
}

export function QuoteSharingSettings({ document, onDocumentChange }: QuoteSharingSettingsProps) {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Auto-load existing link if document is saved
  useEffect(() => {
    if (document.id && document.workspace_id && !generatedLink) {
      getOrCreatePublicQuoteLink({
        documentId: document.id,
        workspaceId: document.workspace_id,
      }).then(setGeneratedLink).catch(() => {});
    }
  }, [document.id, document.workspace_id]);

  const handleGenerateLink = async () => {
    if (!document.id) {
      toast.error('Veuillez d\'abord enregistrer le devis');
      return;
    }

    setIsGeneratingLink(true);

    try {
      if (!document.id || !document.workspace_id) {
        throw new Error('Document incomplet');
      }

      const publicUrl = await getOrCreatePublicQuoteLink({
        documentId: document.id,
        workspaceId: document.workspace_id,
      });

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
          {document.requires_deposit && (
            <Badge variant="secondary" className="gap-1.5">
              Paiement acompte intégré
            </Badge>
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
                  <ButtonLoader />
                  <span className="ml-2">Génération en cours...</span>
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
