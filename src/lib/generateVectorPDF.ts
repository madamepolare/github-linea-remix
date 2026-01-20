/**
 * Vector PDF Generator
 * 
 * Génère des PDFs vectoriels (texte sélectionnable, zoom infini sans pixelisation)
 * en utilisant l'impression native du navigateur depuis le HTML.
 * 
 * Cette approche conserve tout le design CSS du template tout en produisant
 * un PDF vectoriel natif.
 */

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo } from './quoteTemplateVariables';
import { generateQuoteHtml } from './generateHtmlPDF';

/**
 * Download PDF using native browser print (vector output)
 * Opens print dialog which allows saving as PDF with full design fidelity
 */
export async function downloadVectorPdf(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme | null,
  filename?: string
): Promise<void> {
  // Generate the HTML with full theming
  const html = generateQuoteHtml(document, lines, agencyInfo, theme || undefined);

  // Open a new window for printing (better cross-browser support)
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    throw new Error('Popup blocked - please allow popups for PDF download');
  }

  // Add enhanced print styles
  const enhancedHtml = html.replace('</head>', `
    <style>
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        html, body {
          width: 210mm;
          min-height: 297mm;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .main-content {
          padding-bottom: 15mm;
        }
        /* Page break control */
        .no-break, .keep-together, .header, .info-grid, .totals-section, .signature-section {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .pricing-table tr {
          page-break-inside: avoid !important;
        }
      }
      @media screen {
        body {
          background: #f0f0f0;
          display: flex;
          justify-content: center;
          padding: 20px;
        }
        .main-content {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 210mm;
        }
      }
    </style>
    <script>
      // Auto-print after load
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 300);
      };
      // Close window after print
      window.onafterprint = function() {
        window.close();
      };
    </script>
  </head>`);

  // Write to print window
  printWindow.document.open();
  printWindow.document.write(enhancedHtml);
  printWindow.document.close();
}
