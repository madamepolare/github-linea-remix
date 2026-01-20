/**
 * Chromium Vector PDF Generator
 * 
 * Génère des PDFs vectoriels fidèles au HTML via Browserless Chromium.
 * Le rendu est identique à Chrome print-to-PDF = qualité maximale.
 * 
 * Cette version embarque le logo et les polices custom en base64
 * pour garantir un rendu identique au preview.
 */

import { supabase } from '@/integrations/supabase/client';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo } from './quoteTemplateVariables';
import { generateQuoteHtml } from './generateHtmlPDF';

interface EmbeddedAssets {
  logoBase64?: string;
  customFonts?: Array<{
    fontFamily: string;
    dataUrl: string;
  }>;
}

/**
 * Convert an image URL to base64 data URL
 */
async function imageUrlToBase64(url: string): Promise<string | null> {
  if (!url) return null;
  
  // If already a data URL, return as-is
  if (url.startsWith('data:')) {
    return url;
  }
  
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      console.warn('[PDF] Failed to fetch image:', url, response.status);
      return null;
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[PDF] Error converting image to base64:', url, err);
    return null;
  }
}

/**
 * Embed logo as base64 in HTML
 */
function embedLogoInHtml(html: string, logoBase64: string | null): string {
  if (!logoBase64) return html;
  
  // Replace logo URL with base64 data URL in img src
  // Match: src="...logo url..." within img tags for logo
  return html.replace(
    /(<img[^>]*class="[^"]*logo[^"]*"[^>]*src=")([^"]+)(")/gi,
    `$1${logoBase64}$3`
  ).replace(
    /(<img[^>]*src=")([^"]+)("[^>]*class="[^"]*logo[^"]*")/gi,
    `$1${logoBase64}$3`
  );
}

/**
 * Inject @font-face declarations for custom fonts in HTML
 */
function embedFontsInHtml(html: string, customFonts: EmbeddedAssets['customFonts']): string {
  if (!customFonts || customFonts.length === 0) return html;
  
  const fontFaceDeclarations = customFonts.map(font => `
    @font-face {
      font-family: '${font.fontFamily}';
      src: url(${font.dataUrl}) format('woff2'), url(${font.dataUrl}) format('woff'), url(${font.dataUrl}) format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: block;
    }
  `).join('\n');
  
  // Inject font-face before </head>
  if (html.includes('</head>')) {
    return html.replace('</head>', `<style>${fontFaceDeclarations}</style></head>`);
  }
  
  // Fallback: wrap in style tag at beginning
  return `<style>${fontFaceDeclarations}</style>${html}`;
}

/**
 * Download vector PDF using Browserless Chromium
 * This produces a true vector PDF, identical to Chrome's native print output.
 * Assets (logo) are embedded as base64 for server-side rendering.
 */
export async function downloadChromiumPdf(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme | null,
  filename?: string,
  customFonts?: Array<{ fontFamily: string; dataUrl: string }>
): Promise<void> {
  console.log('[PDF] Starting Chromium vector PDF generation...');
  
  // Generate the base HTML with full theming
  let html = generateQuoteHtml(document, lines, agencyInfo, theme || undefined);
  console.log('[PDF] Base HTML generated, length:', html.length);
  
  // Embed logo as base64
  if (agencyInfo?.logo_url) {
    console.log('[PDF] Converting logo to base64...');
    const logoBase64 = await imageUrlToBase64(agencyInfo.logo_url);
    if (logoBase64) {
      html = embedLogoInHtml(html, logoBase64);
      console.log('[PDF] Logo embedded');
    }
  }
  
  // Embed custom fonts if provided
  if (customFonts && customFonts.length > 0) {
    html = embedFontsInHtml(html, customFonts);
    console.log('[PDF] Fonts embedded:', customFonts.map(f => f.fontFamily).join(', '));
  }
  
  console.log('[PDF] Final HTML length:', html.length);

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
