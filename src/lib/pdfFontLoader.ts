// Font loader for jsPDF with Inter font support
// Loads Inter font from Google Fonts CDN at runtime

import jsPDF from 'jspdf';

// Cache for loaded fonts
let interRegularBase64: string | null = null;
let interBoldBase64: string | null = null;
let fontsLoaded = false;

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Load a font file from URL and convert to base64
 */
async function loadFontAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to load font from ${url}:`, response.status);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return arrayBufferToBase64(arrayBuffer);
  } catch (error) {
    console.warn('Error loading font:', error);
    return null;
  }
}

/**
 * Load Inter fonts from Google Fonts CDN
 * Falls back to Helvetica if loading fails
 */
export async function loadInterFonts(): Promise<void> {
  if (fontsLoaded) return;
  
  try {
    // Google Fonts TTF URLs for Inter
    const interRegularUrl = 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf';
    const interBoldUrl = 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf';
    
    // Load fonts in parallel
    const [regular, bold] = await Promise.all([
      loadFontAsBase64(interRegularUrl),
      loadFontAsBase64(interBoldUrl)
    ]);
    
    interRegularBase64 = regular;
    interBoldBase64 = bold;
    fontsLoaded = true;
  } catch (error) {
    console.warn('Error loading Inter fonts, falling back to Helvetica:', error);
  }
}

/**
 * Register Inter fonts with jsPDF instance
 * Returns the font name to use ('Inter' or 'helvetica' as fallback)
 */
export function registerInterFont(pdf: jsPDF): string {
  if (interRegularBase64) {
    try {
      pdf.addFileToVFS('Inter-Regular.ttf', interRegularBase64);
      pdf.addFont('Inter-Regular.ttf', 'Inter', 'normal');
      
      if (interBoldBase64) {
        pdf.addFileToVFS('Inter-Bold.ttf', interBoldBase64);
        pdf.addFont('Inter-Bold.ttf', 'Inter', 'bold');
      }
      
      return 'Inter';
    } catch (error) {
      console.warn('Error registering Inter font:', error);
    }
  }
  
  // Fallback to helvetica
  return 'helvetica';
}

/**
 * Check if Inter fonts are loaded
 */
export function areInterFontsLoaded(): boolean {
  return fontsLoaded && interRegularBase64 !== null;
}

/**
 * Get the primary font name (Inter if loaded, helvetica otherwise)
 */
export function getPrimaryFontName(): string {
  return areInterFontsLoaded() ? 'Inter' : 'helvetica';
}
