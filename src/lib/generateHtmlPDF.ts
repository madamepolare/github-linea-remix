/**
 * HTML-based PDF Generator
 * 
 * This module generates PDFs from custom HTML templates with theme support.
 * It uses the browser's print-to-PDF capabilities or server-side rendering.
 */

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo, mapDocumentToTemplateData, renderHtmlTemplate, TemplateData } from './quoteTemplateVariables';
import { AgencyPDFInfo } from './pdfUtils';

// Default HTML template that uses theme variables
const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page { 
      size: A4; 
      margin: 15mm; 
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: var(--body-font, 'Inter', sans-serif); 
      font-size: var(--body-size, 11px); 
      color: var(--primary-color, #0a0a0a);
      background: var(--background-color, white);
      line-height: 1.5;
    }
    .page {
      padding: 20px;
      min-height: 100vh;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid var(--accent-color, #7c3aed);
    }
    .logo { max-height: 60px; object-fit: contain; }
    .agency-info { 
      text-align: right; 
      font-size: 10px; 
      color: var(--secondary-color, #737373); 
    }
    .document-header {
      margin-bottom: 25px;
    }
    .document-type { 
      font-size: var(--heading-size, 24px); 
      font-weight: 700; 
      color: var(--accent-color, #7c3aed);
      font-family: var(--heading-font, 'Inter', sans-serif);
      margin-bottom: 5px;
    }
    .document-number {
      font-size: 12px;
      color: var(--secondary-color, #737373);
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-bottom: 25px;
    }
    .info-box { 
      padding: 15px; 
      background: var(--table-header-bg, #f5f5f5); 
      border-radius: 6px; 
    }
    .info-box h3 { 
      font-size: 10px; 
      font-weight: 600; 
      text-transform: uppercase;
      margin-bottom: 8px; 
      color: var(--accent-color, #7c3aed); 
    }
    .info-box p { margin: 3px 0; }
    .info-box strong { color: var(--primary-color, #0a0a0a); }
    
    /* Table Styling */
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 25px; 
    }
    thead tr { 
      background: var(--table-header-bg, #7c3aed); 
    }
    th { 
      background: var(--accent-color, #7c3aed); 
      color: white; 
      padding: 10px 12px; 
      text-align: left;
      font-weight: 600;
      font-size: 10px;
    }
    th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
    td { 
      padding: 10px 12px; 
      border-bottom: 1px solid #e5e7eb; 
      vertical-align: top;
    }
    td:nth-child(3), td:nth-child(4), td:nth-child(5) { text-align: right; }
    tr:nth-child(even) td { 
      background: rgba(var(--table-header-bg-rgb, 245,245,245), 0.3); 
    }
    .phase-name { font-weight: 600; color: var(--primary-color, #0a0a0a); }
    .phase-description { 
      font-size: 10px; 
      color: var(--secondary-color, #737373); 
      margin-top: 3px; 
    }
    .phase-ref { 
      font-family: monospace; 
      font-size: 10px; 
      color: var(--accent-color, #7c3aed); 
    }
    .phase-amount { 
      font-weight: 600; 
      color: var(--accent-color, #7c3aed); 
    }
    .deliverables {
      font-size: 9px;
      color: var(--secondary-color, #737373);
      margin-top: 5px;
    }
    .deliverables strong { color: var(--accent-color, #7c3aed); }
    
    /* Totals */
    .totals-container { 
      display: flex; 
      justify-content: flex-end; 
      margin-bottom: 30px;
    }
    .totals { 
      width: 280px;
      padding: 15px;
      background: var(--table-header-bg, #f5f5f5);
      border-radius: 6px;
    }
    .totals .row { 
      display: flex; 
      justify-content: space-between; 
      padding: 6px 0; 
      font-size: 11px;
    }
    .totals .row.total { 
      border-top: 2px solid var(--accent-color, #7c3aed);
      margin-top: 8px;
      padding-top: 12px;
      font-size: 14px;
      font-weight: 700;
    }
    .totals .row.total .value { color: var(--accent-color, #7c3aed); }
    
    /* Options */
    .options { margin-bottom: 25px; }
    .options h3 { 
      font-size: 11px; 
      text-transform: uppercase;
      color: var(--accent-color, #7c3aed); 
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px dashed var(--accent-color, #7c3aed);
    }
    .options table td { 
      color: var(--secondary-color, #737373); 
      border-style: dashed;
    }
    
    /* Conditions */
    .conditions { margin-bottom: 25px; }
    .conditions h3 { 
      font-size: 11px; 
      font-weight: 600; 
      margin-bottom: 8px; 
      color: var(--primary-color, #0a0a0a);
    }
    .conditions p { 
      font-size: 10px; 
      color: var(--secondary-color, #737373); 
      white-space: pre-wrap;
      margin-bottom: 15px;
    }
    
    /* Signature */
    .signature-area { 
      display: flex;
      justify-content: flex-end;
      margin-top: 40px;
    }
    .signature-box { 
      text-align: center;
      padding: 30px 50px; 
      border: 1px dashed var(--secondary-color, #737373);
      border-radius: 6px;
    }
    .signature-box p { 
      font-size: 10px; 
      color: var(--secondary-color, #737373); 
    }
    
    /* Footer */
    .footer { 
      margin-top: 40px;
      padding-top: 15px; 
      border-top: 1px solid #e5e7eb; 
      font-size: 9px; 
      color: var(--secondary-color, #737373);
      text-align: center;
    }
    
    /* Validity */
    .validity {
      font-size: 10px;
      color: var(--secondary-color, #737373);
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        {{#agency_logo_url}}
        <img src="{{agency_logo_url}}" alt="Logo" class="logo">
        {{/agency_logo_url}}
      </div>
      <div class="agency-info">
        <strong>{{agency_name}}</strong><br>
        {{agency_address}}<br>
        {{agency_postal_code}} {{agency_city}}<br>
        {{agency_phone}}<br>
        {{agency_email}}
      </div>
    </div>

    <div class="document-header">
      <div class="document-type">{{document_type}}</div>
      <div class="document-number">N° {{document_number}} — {{date}}</div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <h3>Client</h3>
        <p><strong>{{client_name}}</strong></p>
        <p>{{client_contact_name}}</p>
        <p>{{client_contact_email}}</p>
      </div>
      <div class="info-box">
        <h3>Projet</h3>
        <p><strong>{{document_title}}</strong></p>
        <p>{{project_address}}</p>
        <p>{{project_city}} {{project_postal_code}}</p>
        {{#project_surface}}<p>Surface: {{project_surface}}</p>{{/project_surface}}
      </div>
    </div>

    {{#header_text}}
    <div class="conditions">
      <p>{{header_text}}</p>
    </div>
    {{/header_text}}

    <table>
      <thead>
        <tr>
          <th style="width: 60px;">Réf.</th>
          <th>Désignation</th>
          <th style="width: 60px;">Qté</th>
          <th style="width: 80px;">P.U.</th>
          <th style="width: 90px;">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        {{#phases}}
        <tr>
          <td class="phase-ref">{{phase_code}}</td>
          <td>
            <div class="phase-name">{{phase_name}}</div>
            {{#phase_description}}<div class="phase-description">{{phase_description}}</div>{{/phase_description}}
            {{#deliverables}}
            <div class="deliverables">
              <strong>Livrables:</strong> {{deliverable_name}}
            </div>
            {{/deliverables}}
          </td>
          <td>{{phase_quantity}} {{phase_unit}}</td>
          <td>{{phase_unit_price}}</td>
          <td class="phase-amount">{{phase_amount}}</td>
        </tr>
        {{/phases}}
      </tbody>
    </table>

    {{#options.length}}
    <div class="options">
      <h3>Options (non incluses)</h3>
      <table>
        <tbody>
          {{#options}}
          <tr>
            <td style="width: 60px;">{{option_code}}</td>
            <td>{{option_name}}</td>
            <td style="width: 90px; text-align: right;">{{option_amount}}</td>
          </tr>
          {{/options}}
        </tbody>
      </table>
    </div>
    {{/options.length}}

    <div class="totals-container">
      <div class="totals">
        {{#total_discount}}
        <div class="row">
          <span>Sous-total</span>
          <span>{{subtotal_ht}}</span>
        </div>
        <div class="row" style="color: #dc2626;">
          <span>Remise</span>
          <span>-{{total_discount}}</span>
        </div>
        {{/total_discount}}
        <div class="row">
          <span>Total HT</span>
          <span>{{total_ht}}</span>
        </div>
        <div class="row">
          <span>TVA ({{vat_rate}})</span>
          <span>{{tva_amount}}</span>
        </div>
        <div class="row total">
          <span>Total TTC</span>
          <span class="value">{{total_ttc}}</span>
        </div>
        {{#requires_deposit}}
        <div class="row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ccc;">
          <span>Acompte ({{deposit_percentage}})</span>
          <span style="font-weight: 600;">{{deposit_amount}}</span>
        </div>
        {{/requires_deposit}}
      </div>
    </div>

    {{#payment_terms}}
    <div class="conditions">
      <h3>Conditions de paiement</h3>
      <p>{{payment_terms}}</p>
    </div>
    {{/payment_terms}}

    {{#special_conditions}}
    <div class="conditions">
      <h3>Conditions particulières</h3>
      <p>{{special_conditions}}</p>
    </div>
    {{/special_conditions}}

    <div class="validity">
      Ce devis est valable {{validity_days}} jours (jusqu'au {{validity_date}}).
    </div>

    <div class="signature-area">
      <div class="signature-box">
        <p>Date et signature du client</p>
        <p><em>Précédé de la mention "Bon pour accord"</em></p>
      </div>
    </div>

    <div class="footer">
      {{agency_name}} — SIRET: {{agency_siret}} — TVA: {{agency_vat_number}}
      {{#agency_capital}} — Capital: {{agency_capital}}{{/agency_capital}}
    </div>
  </div>
</body>
</html>`;

export { DEFAULT_HTML_TEMPLATE };

/**
 * Injects theme CSS variables into an HTML template
 */
export function injectThemeStyles(html: string, theme: QuoteTheme): string {
  const cssVars = `
    :root {
      --primary-color: ${theme.primary_color};
      --secondary-color: ${theme.secondary_color};
      --accent-color: ${theme.accent_color};
      --background-color: ${theme.background_color};
      --header-bg-color: ${theme.header_bg_color || theme.background_color};
      --table-header-bg: ${theme.table_header_bg};
      --heading-font: ${theme.heading_font};
      --body-font: ${theme.body_font};
      --heading-size: ${theme.heading_size};
      --body-size: ${theme.body_size};
    }
  `;
  
  // Insert CSS variables after the opening <style> tag
  if (html.includes('<style>')) {
    return html.replace('<style>', `<style>${cssVars}`);
  }
  
  // Or add a new style block in head
  if (html.includes('</head>')) {
    return html.replace('</head>', `<style>${cssVars}</style></head>`);
  }
  
  return html;
}

/**
 * Generates the full HTML for a quote with theme and data
 */
export function generateQuoteHtml(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme
): string {
  // Use custom template if available, otherwise use default
  const baseTemplate = theme?.use_custom_html && theme?.custom_html_template 
    ? theme.custom_html_template 
    : DEFAULT_HTML_TEMPLATE;
  
  // Map document data to template variables
  const templateData = mapDocumentToTemplateData(document, lines, agencyInfo);
  
  // Render template with data
  let html = renderHtmlTemplate(baseTemplate, templateData);
  
  // Inject theme styles if using default template
  if (theme && !theme.use_custom_html) {
    html = injectThemeStyles(html, theme);
  }
  
  return html;
}

/**
 * Converts HTML to PDF using browser print API
 * This is a client-side fallback when server-side generation is not available
 */
export async function htmlToPdfBrowser(html: string, filename: string): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  printWindow.print();
  printWindow.close();
}

/**
 * Generates a PDF blob from HTML using canvas
 * Falls back to print dialog if canvas conversion fails
 */
export async function generatePdfFromHtml(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme
): Promise<Blob | null> {
  const html = generateQuoteHtml(document, lines, agencyInfo, theme);
  
  // Create an iframe to render the HTML
  const iframe = window.document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  window.document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.document.body.removeChild(iframe);
    return null;
  }
  
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();
  
  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Clean up
  window.document.body.removeChild(iframe);
  
  // For now, return null and use the server-side PDF generation
  // A full client-side solution would require html2canvas + jsPDF
  return null;
}

/**
 * Get the HTML for preview purposes
 */
export function getQuotePreviewHtml(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme
): string {
  return generateQuoteHtml(document, lines, agencyInfo, theme);
}
