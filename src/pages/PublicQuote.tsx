import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Calendar, 
  Euro,
  FileText,
  Loader2,
  AlertCircle,
  Pen,
  RotateCcw,
  Check,
  PartyPopper
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

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
  };
  link: {
    id: string;
    signed_at?: string;
    options_selected?: Record<string, boolean>;
    final_amount?: number;
    deposit_paid?: boolean;
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

  // Fetch quote data
  useEffect(() => {
    const fetchQuote = async () => {
      if (!token) {
        setError('Lien invalide');
        setIsLoading(false);
        return;
      }

      try {
        const { data: responseData, error: fetchError } = await supabase.functions.invoke(
          'public-quote-view',
          { body: {}, headers: {} }
        );

        // Since we can't pass query params to invoke, use fetch directly
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-quote-view?token=${token}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du chargement');
        }

        const quoteData = await response.json();
        setData(quoteData);

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

        // If already signed, show success
        if (quoteData.link.signed_at) {
          setStep('success');
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
    ctx.strokeStyle = '#1a1a1a';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600" />
          <p className="text-muted-foreground">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Devis inaccessible</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Merci !</h2>
            <p className="text-muted-foreground mb-6">
              Votre signature a bien été enregistrée pour le devis {doc.document_number}.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p><strong>Montant HT :</strong> {formatCurrency(link.final_amount || total)}</p>
              <p><strong>Signé le :</strong> {link.signed_at ? new Date(link.signed_at).toLocaleString('fr-FR') : 'Maintenant'}</p>
            </div>
            {doc.requires_deposit && !link.deposit_paid && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Un acompte de {formatCurrency(depositAmount)} est requis.
                </p>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  Payer l'acompte
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sign screen
  if (step === 'sign') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pen className="h-5 w-5" />
                Signer le devis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Montant à valider</p>
                <p className="text-2xl font-bold">{formatCurrency(total)} HT</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(totalTTC)} TTC</p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signerName">Nom complet *</Label>
                  <Input
                    id="signerName"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signerEmail">Email *</Label>
                  <Input
                    id="signerEmail"
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Signature *</Label>
                  <Button variant="ghost" size="sm" onClick={clearSignature}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Effacer
                  </Button>
                </div>
                <div className="border-2 border-dashed rounded-lg bg-white">
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

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep('view')}>
                  Retour
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={handleSign}
                  disabled={isSigning || !signerName || !signerEmail || !hasSignature}
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // View screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt={agency.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold">{agency.name?.charAt(0) || 'A'}</span>
              </div>
            )}
            <div>
              <h1 className="font-semibold">{agency.name || 'Agence'}</h1>
              <p className="text-xs text-muted-foreground">Devis {doc.document_number}</p>
            </div>
          </div>
          <Badge variant={doc.status === 'signed' ? 'default' : 'secondary'}>
            {doc.status === 'signed' ? 'Signé' : doc.status === 'sent' ? 'En attente' : doc.status}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Document info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{doc.title}</CardTitle>
            {doc.description && (
              <p className="text-sm text-muted-foreground">{doc.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {doc.client_company && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{doc.client_company.name}</p>
                    {doc.client_company.address && (
                      <p className="text-xs text-muted-foreground">
                        {doc.client_company.address}, {doc.client_company.postal_code} {doc.client_company.city}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {doc.project_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Lieu du projet</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.project_address}, {doc.postal_code} {doc.project_city}
                    </p>
                  </div>
                </div>
              )}
              {doc.valid_until && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Valide jusqu'au</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.valid_until).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lines/Phases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détail de la proposition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {phases.map((phase) => {
                const isOptional = phase.line_type === 'option' || !phase.is_included;
                const isSelected = optionsSelected[phase.id];

                return (
                  <div
                    key={phase.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      isOptional && !isSelected && "opacity-60 bg-muted/30",
                      isOptional && isSelected && "border-amber-300 bg-amber-50/50",
                      !isOptional && "bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{phase.phase_name}</span>
                          {isOptional && (
                            <Badge variant="outline" className="text-xs">Option</Badge>
                          )}
                        </div>
                        {phase.phase_description && (
                          <p className="text-sm text-muted-foreground">{phase.phase_description}</p>
                        )}
                        {phase.deliverables && phase.deliverables.length > 0 && (
                          <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                            {phase.deliverables.map((d, i) => (
                              <li key={i} className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{formatCurrency(phase.amount || 0)}</p>
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
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-white/80">
                <span>Total HT</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>TVA ({doc.vat_rate || 20}%)</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total TTC</span>
                <span>{formatCurrency(totalTTC)}</span>
              </div>
              {doc.requires_deposit && (
                <div className="flex justify-between text-white/80 pt-2">
                  <span>Acompte à la signature ({doc.deposit_percentage || 30}%)</span>
                  <span>{formatCurrency(depositAmount)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-amber-50 to-transparent pt-4 pb-6">
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-lg h-14 shadow-lg"
            onClick={() => setStep('sign')}
          >
            <Pen className="h-5 w-5 mr-2" />
            Accepter et signer ce devis
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>{agency.billing_name || agency.name}</p>
          {agency.billing_address && (
            <p>{agency.billing_address}, {agency.billing_postal_code} {agency.billing_city}</p>
          )}
          {agency.siret && <p>SIRET : {agency.siret}</p>}
          {agency.vat_number && <p>TVA : {agency.vat_number}</p>}
        </div>
      </footer>
    </div>
  );
}
