/**
 * Chromium Vector PDF Generator
 * 
 * Génère des PDFs vectoriels fidèles au HTML via Browserless Chromium.
 * Le rendu est identique à Chrome print-to-PDF = qualité maximale.
 */

import { supabase } from '@/integrations/supabase/client';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo } from './quoteTemplateVariables';
import { generateQuoteHtml } from './generateHtmlPDF';

/**
 * Download vector PDF using Browserless Chromium
 * This produces a true vector PDF, identical to Chrome's native print output.
 */
export async function downloadChromiumPdf(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme | null,
  filename?: string
): Promise<void> {
  console.log('[PDF] Starting Chromium vector PDF generation...');
  
  // Generate the HTML with full theming
  const html = generateQuoteHtml(document, lines, agencyInfo, theme || undefined);
  console.log('[PDF] HTML generated, length:', html.length);

  // Call the edge function to generate PDF via Chromium
  console.log('[PDF] Calling generate-pdf-chromium edge function...');
  const { data, error } = await supabase.functions.invoke('generate-pdf-chromium', {
    body: {
      html,
      filename: filename || `Devis_${document.document_number || 'brouillon'}`
    }
  });

  console.log('[PDF] Edge function response:', { data: data ? 'received' : 'null', error });

  if (error) {
    console.error('[PDF] Generation error:', error);
    throw new Error(`Erreur lors de la génération du PDF: ${error.message || error}`);
  }

  if (!data?.pdf) {
    console.error('[PDF] No PDF in response:', data);
    throw new Error('Aucun PDF reçu du serveur');
  }

  console.log('[PDF] PDF received, base64 length:', data.pdf.length);

  // Convert base64 to blob and download
  const binaryString = atob(data.pdf);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${data.filename || filename || 'document'}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('[PDF] Download complete');
}
