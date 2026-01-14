import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Calendar, 
  Loader2,
  AlertCircle,
  Pen,
  RotateCcw,
  Check,
  PartyPopper,
  ArrowRight,
  Download,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { FONT_OPTIONS, COLOR_THEMES } from '@/hooks/useWorkspaceStyles';

// Interface for custom fonts stored in workspace
interface CustomFont {
  id: string;
  name: string;
  fileName: string;
  fontFamily: string;
  dataUrl?: string;
}

interface StyleSettings {
  headingFont?: string;
  bodyFont?: string;
  baseFontSize?: number;
  headingWeight?: string;
  bodyWeight?: string;
  borderRadius?: number;
  colorTheme?: string;
  customFonts?: CustomFont[];
}

interface QuoteData {
  document: {
    id: string;
    document_number: string;
    document_type: string;
    title: string;
    description?: string;
    status: string;
    total_amount: number;
    currency: string;
    validity_days: number;
    valid_until?: string;
    vat_rate?: number;
    project_address?: string;
    project_city?: string;
    postal_code?: string;
    project_surface?: number;
    requires_deposit?: boolean;
    deposit_percentage?: number;
    header_text?: string;
    footer_text?: string;
    payment_terms?: string;
    created_at: string;
    client_company?: { id: string; name: string; logo_url?: string; address?: string; city?: string; postal_code?: string };
    client_contact?: { id: string; name: string; email?: string; phone?: string };
  };
  phases: Array<{
    id: string;
    phase_code: string;
    phase_name: string;
    phase_description?: string;
    amount: number;
    is_included: boolean;
    line_type?: string;
    unit?: string;
    quantity?: number;
    unit_price?: number;
    deliverables?: string[];
  }>;
  agency: {
    name?: string;
    logo_url?: string;
    billing_name?: string;
    billing_address?: string;
    billing_city?: string;
    billing_postal_code?: string;
    siret?: string;
    vat_number?: string;
    style_settings?: StyleSettings;
  };
  link: {
    id: string;
    signed_at?: string;
    options_selected?: Record<string, boolean>;
    final_amount?: number;
    deposit_paid?: boolean;
    signed_pdf_url?: string;
  };
}

export default function PublicQuote() {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuoteData | null>(null);
  const [optionsSelected, setOptionsSelected] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<'view' | 'sign' | 'success'>('view');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const [themeColors, setThemeColors] = useState<{ primary: string; accent: string } | null>(null);
  const [fontFamilies, setFontFamilies] = useState<{ heading: string; body: string }>({
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif"
  });

  // Load workspace fonts dynamically (supports both Google Fonts and custom fonts)
  const loadWorkspaceFonts = async (styleSettings: StyleSettings) => {
    if (!styleSettings) return { heading: "'Inter', sans-serif", body: "'Inter', sans-serif" };
    
    const customFonts = styleSettings.customFonts || [];
    
    const loadFont = async (fontId: string): Promise<string> => {
      // First check Google Fonts
      const googleFont = FONT_OPTIONS.find(f => f.id === fontId);
      if (googleFont) {
        if (!document.querySelector(`link[href="${googleFont.googleUrl}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = googleFont.googleUrl;
          document.head.appendChild(link);
        }
        return googleFont.family;
      }
      
      // Then check custom fonts
      const customFont = customFonts.find(f => f.id === fontId);
      if (customFont && customFont.dataUrl) {
        try {
          const fontFace = new FontFace(customFont.fontFamily, `url(${customFont.dataUrl})`);
          await fontFace.load();
          document.fonts.add(fontFace);
          return `'${customFont.fontFamily}', sans-serif`;
        } catch (err) {
          console.error('Error loading custom font:', err);
        }
      }
      
      return "'Inter', sans-serif";
    };
    
    // Load both fonts
    const headingFamily = await loadFont(styleSettings.headingFont || 'inter');
    const bodyFamily = await loadFont(styleSettings.bodyFont || 'inter');
    
    return { heading: headingFamily, body: bodyFamily };
  };

  // Apply workspace styles to document root
  const applyWorkspaceStyles = (styleSettings: StyleSettings, fonts: { heading: string; body: string }) => {
    if (!styleSettings) return;
    
    const root = document.documentElement;
    
    // Get color theme
    const theme = COLOR_THEMES.find(t => t.id === styleSettings.colorTheme);
    
    // Apply CSS variables to :root for global effect
    root.style.setProperty('--font-heading', fonts.heading);
    root.style.setProperty('--font-body', fonts.body);
    
    if (styleSettings.baseFontSize) {
      root.style.setProperty('--font-size-base', `${styleSettings.baseFontSize}px`);
    }
    if (styleSettings.borderRadius !== undefined) {
      root.style.setProperty('--radius', `${styleSettings.borderRadius}px`);
    }
    if (theme) {
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--accent', theme.accent);
      setThemeColors({ primary: theme.primary, accent: theme.accent });
    }
    
    setFontFamilies(fonts);
  };

  // Fetch quote data
  useEffect(() => {
    const fetchQuote = async () => {
      if (!token) {
        setError('Lien invalide');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-quote-view?token=${token}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du chargement');
        }

        const quoteData = await response.json();
        setData(quoteData);

        // Load workspace fonts and apply styles
        if (quoteData.agency?.style_settings) {
          const fonts = await loadWorkspaceFonts(quoteData.agency.style_settings);
          applyWorkspaceStyles(quoteData.agency.style_settings, fonts);
        }

        // Initialize options from phases
        const initialOptions: Record<string, boolean> = {};
        quoteData.phases.forEach((phase: any) => {
          initialOptions[phase.id] = phase.is_included;
        });
        setOptionsSelected(quoteData.link.options_selected || initialOptions);

        // Pre-fill signer info from contact
        if (quoteData.document.client_contact) {
          setSignerName(quoteData.document.client_contact.name || '');
          setSignerEmail(quoteData.document.client_contact.email || '');
        }

        // If already signed, show success and set PDF URL if exists
        if (quoteData.link.signed_at) {
          setStep('success');
          if (quoteData.link.signed_pdf_url) {
            setSignedPdfUrl(quoteData.link.signed_pdf_url);
          }
        }

      } catch (err) {
        console.error('Error fetching quote:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, [token]);

  // Calculate total based on selected options
  const calculateTotal = () => {
    if (!data) return 0;
    return data.phases
      .filter(phase => optionsSelected[phase.id])
      .reduce((sum, phase) => sum + (phase.amount || 0), 0);
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!data || !token || !signerName || !signerEmail || !hasSignature) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSigning(true);

    try {
      const signatureData = canvas.toDataURL('image/png');
      const finalAmount = calculateTotal();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-quote-sign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            token,
            signerName,
            signerEmail,
            signatureData,
            optionsSelected,
            finalAmount,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la signature');
      }

      // Success!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setStep('success');

    } catch (err) {
      console.error('Error signing:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la signature');
    } finally {
      setIsSigning(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  // Generate and download signed PDF
  const handleDownloadSignedPDF = async () => {
    if (!token) return;
    
    // If we already have the URL, download directly
    if (signedPdfUrl) {
      window.open(signedPdfUrl, '_blank');
      return;
    }
    
    setIsGeneratingPDF(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-signed-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }
      
      const result = await response.json();
      
      if (result.pdf_url) {
        setSignedPdfUrl(result.pdf_url);
        window.open(result.pdf_url, '_blank');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-foreground" />
          <p className="text-muted-foreground text-sm tracking-wide">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-foreground" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">Devis inaccessible</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { document: doc, phases, agency, link } = data;
  const total = calculateTotal();
  const vatAmount = total * ((doc.vat_rate || 20) / 100);
  const totalTTC = total + vatAmount;
  const depositAmount = doc.requires_deposit ? total * ((doc.deposit_percentage || 30) / 100) : 0;

  // Success screen
  if (step === 'success') {
    return (
      <div ref={containerRef} className="min-h-screen flex flex-col bg-white" style={{ fontFamily: 'var(--font-body)' }}>
        {/* Logo Banner */}
        <header className="w-full border-b">
          <div className="w-full flex items-center justify-center py-8 px-6">
            {agency.logo_url ? (
              <img 
                src={agency.logo_url} 
                alt={agency.name} 
                className="h-16 max-h-16 w-auto object-contain"
              />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontFamily: fontFamilies.heading }}>{agency.name}</h1>
            )}
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
              style={{ backgroundColor: themeColors ? `hsl(${themeColors.primary})` : 'hsl(var(--foreground))' }}
            >
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ fontFamily: fontFamilies.heading }}>Merci !</h2>
            <p className="text-muted-foreground mb-8">
              Votre signature a bien été enregistrée pour le devis {doc.document_number}.
            </p>
            <div className="bg-muted/30 border rounded-lg p-6 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-semibold">{formatCurrency(link.final_amount || total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signé le</span>
                <span className="font-semibold">{link.signed_at ? new Date(link.signed_at).toLocaleString('fr-FR') : 'Maintenant'}</span>
              </div>
            </div>
            
            {/* Download signed PDF button */}
            <div className="mt-8">
              <Button 
                variant="outline"
                className="w-full h-12 text-base font-medium gap-2"
                onClick={handleDownloadSignedPDF}
                disabled={isGeneratingPDF}
                style={{ fontFamily: fontFamilies.heading }}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Télécharger le devis signé
                  </>
                )}
              </Button>
            </div>
            
            {doc.requires_deposit && !link.deposit_paid && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Un acompte de {formatCurrency(depositAmount)} est requis.
                </p>
                <Button 
                  className="w-full h-12 text-base font-medium text-white"
                  style={{ 
                    backgroundColor: themeColors ? `hsl(${themeColors.primary})` : 'hsl(var(--primary))',
                    fontFamily: fontFamilies.heading 
                  }}
                >
                  Payer l'acompte
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="max-w-4xl mx-auto px-6 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{agency.billing_name || agency.name}</p>
            {agency.billing_address && (
              <p>{agency.billing_address}, {agency.billing_postal_code} {agency.billing_city}</p>
            )}
            <div className="flex items-center justify-center gap-4 pt-2">
              {agency.siret && <span>SIRET {agency.siret}</span>}
              {agency.vat_number && <span>TVA {agency.vat_number}</span>}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Sign screen
  if (step === 'sign') {
    return (
      <div ref={containerRef} className="min-h-screen flex flex-col bg-white" style={{ fontFamily: 'var(--font-body)' }}>
        {/* Logo Banner */}
        <header className="w-full border-b">
          <div className="w-full flex items-center justify-center py-8 px-6">
            {agency.logo_url ? (
              <img 
                src={agency.logo_url} 
                alt={agency.name} 
                className="h-16 max-h-16 w-auto object-contain"
              />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontFamily: fontFamilies.heading }}>{agency.name}</h1>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3" style={{ fontFamily: fontFamilies.heading }}>
              <Pen className="h-6 w-6" />
              Signer le devis
            </h2>
            <p className="text-muted-foreground">
              Validez votre accord en signant ci-dessous
            </p>
          </div>

          <div className="space-y-6">
            {/* Amount summary */}
            <div className="p-5 bg-muted/30 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Montant à valider</p>
              <p className="text-3xl font-bold tracking-tight">{formatCurrency(total)} <span className="text-lg font-normal text-muted-foreground">HT</span></p>
              <p className="text-sm text-muted-foreground">{formatCurrency(totalTTC)} TTC</p>
            </div>

            {/* Form fields */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="signerName" className="text-sm font-medium">Nom complet *</Label>
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Votre nom"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signerEmail" className="text-sm font-medium">Email *</Label>
                <Input
                  id="signerEmail"
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="h-12"
                />
              </div>
            </div>

            {/* Signature canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Signature *</Label>
                <Button variant="ghost" size="sm" onClick={clearSignature} className="text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Effacer
                </Button>
              </div>
              <div className="border-2 border-dashed rounded-lg bg-muted/20">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Dessinez votre signature ci-dessus
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              En signant, vous acceptez les conditions générales et confirmez votre accord sur le montant de {formatCurrency(total)} HT.
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('view')}>
                Retour
              </Button>
              <Button 
                className="flex-1 h-12 font-medium text-white"
                onClick={handleSign}
                disabled={isSigning || !signerName || !signerEmail || !hasSignature}
                style={{ 
                  backgroundColor: themeColors ? `hsl(${themeColors.primary})` : 'hsl(var(--primary))',
                  fontFamily: fontFamilies.heading 
                }}
              >
                {isSigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signature...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Signer
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // View screen - Main quote display
  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-white" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Logo Banner - Full Width */}
      <header className="w-full border-b sticky top-0 z-10 bg-white">
        <div className="w-full flex items-center justify-center py-8 px-6">
          {agency.logo_url ? (
            <img 
              src={agency.logo_url} 
              alt={agency.name} 
              className="h-16 max-h-16 w-auto object-contain"
            />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight uppercase" style={{ fontFamily: fontFamilies.heading }}>{agency.name}</h1>
          )}
        </div>
      </header>

      {/* Agency Info Bar */}
      <div className="w-full border-b bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">
              Devis <span className="font-medium text-foreground">{doc.document_number}</span>
            </span>
            {doc.valid_until && (
              <span className="text-muted-foreground">
                Valide jusqu'au <span className="font-medium text-foreground">{new Date(doc.valid_until).toLocaleDateString('fr-FR')}</span>
              </span>
            )}
          </div>
          <Badge 
            variant={doc.status === 'signed' ? 'default' : 'secondary'}
            className="font-medium"
          >
            {doc.status === 'signed' ? 'Signé' : doc.status === 'sent' ? 'En attente' : doc.status}
          </Badge>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 space-y-10">
        {/* Document Title & Description */}
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: fontFamilies.heading }}>{doc.title}</h2>
          {doc.description && (
            <p className="text-muted-foreground text-lg leading-relaxed" style={{ fontFamily: fontFamilies.body }}>{doc.description}</p>
          )}
        </section>

        {/* Client & Project Info */}
        <section className="grid sm:grid-cols-2 gap-6">
          {doc.client_company && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{doc.client_company.name}</p>
                {doc.client_company.address && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {doc.client_company.address}<br />
                    {doc.client_company.postal_code} {doc.client_company.city}
                  </p>
                )}
              </div>
            </div>
          )}
          {doc.project_address && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Lieu du projet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {doc.project_address}<br />
                  {doc.postal_code} {doc.project_city}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Phases / Lines */}
        <section>
          <h3 className="text-xl font-semibold tracking-tight mb-6" style={{ fontFamily: fontFamilies.heading }}>Détail de la proposition</h3>
          <div className="space-y-3">
            {phases.map((phase) => {
              const isOptional = phase.line_type === 'option' || !phase.is_included;
              const isSelected = optionsSelected[phase.id];

              return (
                <div
                  key={phase.id}
                  className={cn(
                    "p-5 rounded-lg border transition-all",
                    isOptional && !isSelected && "opacity-60 bg-muted/20",
                    isOptional && isSelected && "border-foreground bg-muted/10",
                    !isOptional && "bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-base" style={{ fontFamily: fontFamilies.heading }}>{phase.phase_name}</span>
                        {isOptional && (
                          <Badge variant="outline" className="text-xs font-normal">Option</Badge>
                        )}
                      </div>
                      {phase.phase_description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{phase.phase_description}</p>
                      )}
                      {phase.deliverables && phase.deliverables.length > 0 && (
                        <ul className="mt-3 text-sm text-muted-foreground space-y-1.5">
                          {phase.deliverables.map((d, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-lg">{formatCurrency(phase.amount || 0)}</p>
                      {isOptional && (
                        <Switch
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            setOptionsSelected(prev => ({ ...prev, [phase.id]: checked }))
                          }
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary */}
        <section 
          className="rounded-xl p-8 text-white"
          style={{ backgroundColor: themeColors ? `hsl(${themeColors.primary})` : 'hsl(var(--foreground))' }}
        >
          <div className="space-y-3">
            <div className="flex justify-between text-white/70">
              <span>Total HT</span>
              <span className="font-medium">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>TVA ({doc.vat_rate || 20}%)</span>
              <span className="font-medium">{formatCurrency(vatAmount)}</span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex justify-between text-2xl font-bold pt-2" style={{ fontFamily: fontFamilies.heading }}>
              <span>Total TTC</span>
              <span>{formatCurrency(totalTTC)}</span>
            </div>
            {doc.requires_deposit && (
              <div className="flex justify-between text-white/70 pt-2">
                <span>Acompte à la signature ({doc.deposit_percentage || 30}%)</span>
                <span className="font-medium">{formatCurrency(depositAmount)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Action button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-8">
          <Button 
            size="lg" 
            className="w-full h-14 text-base font-medium shadow-lg text-white"
            onClick={() => setStep('sign')}
            style={{ 
              backgroundColor: themeColors ? `hsl(${themeColors.primary})` : 'hsl(var(--primary))',
              fontFamily: fontFamilies.heading 
            }}
          >
            <Pen className="h-5 w-5 mr-2" />
            Accepter et signer ce devis
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{agency.billing_name || agency.name}</p>
          {agency.billing_address && (
            <p>{agency.billing_address}, {agency.billing_postal_code} {agency.billing_city}</p>
          )}
          <div className="flex items-center justify-center gap-4 pt-2">
            {agency.siret && <span>SIRET {agency.siret}</span>}
            {agency.vat_number && <span>TVA {agency.vat_number}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
