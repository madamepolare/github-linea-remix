/**
 * HTML-based PDF Generator
 * 
 * Ce module génère des devis en HTML avec support complet des thèmes.
 * Le même HTML est utilisé pour l'aperçu ET l'impression PDF native.
 */

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo, mapDocumentToTemplateData, renderHtmlTemplate } from './quoteTemplateVariables';

// Template HTML par défaut - Design épuré inspiré MadamePolare
// Utilise les variables CSS pour la personnalisation via thème
const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{document_type}} {{document_number}}</title>
  <style>
    @page { 
      size: A4; 
      margin: 15mm 20mm; 
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: var(--body-font, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); 
      font-size: var(--body-size, 10.5px); 
      color: var(--primary-color, #1a1a1a);
      background: var(--background-color, #fff);
      line-height: 1.6;
      font-weight: 400;
    }
    
    /* ===== TYPOGRAPHY ===== */
    h1, h2, h3, h4 {
      font-family: var(--heading-font, system-ui, sans-serif);
      font-weight: 500;
      letter-spacing: -0.01em;
    }
    
    /* ===== HEADER ===== */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 35px;
    }
    .header-agency {
      max-width: 200px;
    }
    .logo { 
      max-height: 50px; 
      max-width: 180px;
      object-fit: contain;
      margin-bottom: 12px;
    }
    .agency-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 8px;
    }
    .agency-details {
      font-size: 9px;
      color: var(--secondary-color, #666);
      line-height: 1.5;
    }
    .header-title {
      text-align: right;
    }
    .document-title-main {
      font-family: var(--heading-font, system-ui, sans-serif);
      font-size: 32px;
      font-weight: 300;
      color: var(--primary-color);
      margin-bottom: 5px;
      letter-spacing: -0.02em;
    }
    .document-number {
      font-size: 11px;
      font-weight: 500;
      color: var(--secondary-color);
      margin-bottom: 3px;
    }
    
    /* ===== CLIENT SECTION ===== */
    .client-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 20px 0;
      border-top: 1px solid var(--border-color, #e5e5e5);
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }
    .section-label {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--secondary-color);
      margin-bottom: 8px;
    }
    .client-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 4px;
    }
    .client-contact {
      font-size: 10px;
      color: var(--secondary-color);
      line-height: 1.6;
    }
    .client-right {
      text-align: right;
    }
    .date-label {
      font-size: 9px;
      color: var(--secondary-color);
    }
    .date-value {
      font-size: 11px;
      font-weight: 500;
      color: var(--primary-color);
    }
    
    /* ===== CONTEXT SECTION ===== */
    .context-section {
      margin-bottom: 30px;
    }
    .context-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 12px;
    }
    .context-text {
      font-size: 10px;
      color: var(--secondary-color);
      line-height: 1.7;
      text-align: justify;
    }
    
    /* ===== PHASES/PRESTATIONS ===== */
    .phase-section {
      margin-bottom: 25px;
    }
    .phase-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }
    .phase-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-color);
      flex: 1;
    }
    .phase-amount {
      font-size: 12px;
      font-weight: 500;
      color: var(--primary-color);
      text-align: right;
      min-width: 100px;
    }
    .phase-description {
      font-size: 10px;
      color: var(--secondary-color);
      line-height: 1.7;
      margin-bottom: 12px;
      text-align: justify;
    }
    .phase-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .phase-table td {
      padding: 6px 8px;
      font-size: 9.5px;
      border-bottom: 1px solid var(--border-color, #eee);
      vertical-align: top;
    }
    .phase-table td:first-child {
      padding-left: 0;
      color: var(--secondary-color);
    }
    .phase-table td:last-child {
      text-align: right;
      font-weight: 500;
      color: var(--primary-color);
      width: 90px;
    }
    .phase-duration {
      font-size: 9px;
      color: var(--secondary-color);
      font-style: italic;
      margin-bottom: 8px;
    }
    .phase-deliverables {
      margin-top: 10px;
    }
    .phase-deliverables-title {
      font-size: 9px;
      font-weight: 600;
      color: var(--secondary-color);
      margin-bottom: 5px;
    }
    .phase-deliverables-list {
      font-size: 9px;
      color: var(--secondary-color);
      padding-left: 15px;
    }
    .phase-deliverables-list li {
      margin-bottom: 3px;
    }
    
    /* ===== OPTIONS SECTION ===== */
    .options-section {
      margin-bottom: 25px;
      padding: 15px;
      background: var(--table-header-bg, #fafafa);
      border-radius: 4px;
    }
    .options-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary-color);
      margin-bottom: 12px;
    }
    .option-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed var(--border-color, #ddd);
      font-size: 10px;
    }
    .option-item:last-child {
      border-bottom: none;
    }
    .option-name {
      color: var(--secondary-color);
    }
    .option-amount {
      font-weight: 500;
      color: var(--primary-color);
    }
    
    /* ===== TOTALS ===== */
    .totals-section {
      margin: 30px 0;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 250px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 10px;
      color: var(--secondary-color);
    }
    .totals-row.discount {
      color: #b91c1c;
    }
    .totals-row.subtotal {
      color: var(--primary-color);
    }
    .totals-row.main-total {
      border-top: 2px solid var(--primary-color);
      margin-top: 8px;
      padding-top: 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
    }
    .totals-row.tva {
      font-size: 10px;
    }
    .totals-row.ttc {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary-color);
      margin-top: 5px;
    }
    
    /* ===== PAYMENT SECTION ===== */
    .payment-section {
      margin-top: 30px;
      padding: 15px 0;
      border-top: 1px solid var(--border-color, #e5e5e5);
    }
    .payment-title {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 8px;
    }
    .payment-text {
      font-size: 10px;
      color: var(--secondary-color);
    }
    
    /* ===== VALIDITY ===== */
    .validity {
      margin-top: 20px;
      font-size: 9px;
      color: var(--secondary-color);
    }
    
    /* ===== SIGNATURE ===== */
    .signature-section {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
    }
    .signature-box {
      flex: 1;
      text-align: center;
      min-height: 80px;
    }
    .signature-box.client {
      border: 1px dashed var(--border-color, #ccc);
      border-radius: 4px;
      padding: 15px;
    }
    .signature-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary-color);
      margin-bottom: 8px;
    }
    .signature-name {
      font-size: 10px;
      color: var(--primary-color);
    }
    .signature-mention {
      font-size: 8px;
      color: var(--secondary-color);
      font-style: italic;
      margin-top: 30px;
    }
    
    /* ===== FOOTER ===== */
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid var(--border-color, #e5e5e5);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-brand {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 3px;
    }
    .footer-tagline {
      font-size: 9px;
      color: var(--secondary-color);
      font-style: italic;
    }
    .footer-contact {
      text-align: right;
      font-size: 9px;
      color: var(--secondary-color);
    }
    .footer-legal {
      font-size: 7px;
      color: var(--secondary-color);
      margin-top: 10px;
      text-align: center;
    }
    
    /* ===== CONDITIONS ===== */
    .conditions-section {
      margin-top: 25px;
    }
    .conditions-title {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 8px;
    }
    .conditions-text {
      font-size: 9px;
      color: var(--secondary-color);
      line-height: 1.6;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="header-agency">
      {{#agency_logo_url}}
      <img src="{{agency_logo_url}}" alt="Logo" class="logo">
      {{/agency_logo_url}}
      {{^agency_logo_url}}
      <div class="agency-name">{{agency_name}}</div>
      {{/agency_logo_url}}
      <div class="agency-details">
        {{agency_address}}<br>
        {{agency_postal_code}} {{agency_city}}<br>
        {{#agency_phone}}{{agency_phone}}<br>{{/agency_phone}}
        {{agency_email}}
      </div>
    </div>
    <div class="header-title">
      <div class="document-title-main">{{document_type}} n° {{document_number}}</div>
      <div class="document-number">{{document_title}}</div>
    </div>
  </div>

  <!-- CLIENT SECTION -->
  <div class="client-section">
    <div class="client-left">
      <div class="section-label">À l'attention de</div>
      <div class="client-name">{{client_name}}</div>
      {{#client_contact_name}}
      <div class="client-contact">{{client_contact_name}}</div>
      {{/client_contact_name}}
      {{#client_address}}
      <div class="client-contact">{{client_address}}</div>
      {{/client_address}}
      {{#client_contact_email}}
      <div class="client-contact">{{client_contact_email}}</div>
      {{/client_contact_email}}
    </div>
    <div class="client-right">
      <div class="date-label">Date d'émission</div>
      <div class="date-value">{{date}}</div>
      {{#validity_date}}
      <div class="date-label" style="margin-top: 10px;">Valable jusqu'au</div>
      <div class="date-value">{{validity_date}}</div>
      {{/validity_date}}
    </div>
  </div>

  <!-- CONTEXT / INTRO -->
  {{#header_text}}
  <div class="context-section">
    <div class="context-title">Contexte</div>
    <div class="context-text">{{header_text}}</div>
  </div>
  {{/header_text}}

  <!-- PHASES / PRESTATIONS -->
  {{#phases}}
  <div class="phase-section">
    <div class="phase-header">
      <div class="phase-title">{{phase_name}}</div>
      <div class="phase-amount">{{phase_amount}}</div>
    </div>
    {{#phase_description}}
    <div class="phase-description">{{phase_description}}</div>
    {{/phase_description}}
    {{#phase_duration}}
    <div class="phase-duration">Durée estimée : {{phase_duration}}</div>
    {{/phase_duration}}
    {{#deliverables.length}}
    <div class="phase-deliverables">
      <div class="phase-deliverables-title">Livrables :</div>
      <ul class="phase-deliverables-list">
        {{#deliverables}}
        <li>{{deliverable_name}}</li>
        {{/deliverables}}
      </ul>
    </div>
    {{/deliverables.length}}
  </div>
  {{/phases}}

  <!-- OPTIONS -->
  {{#options.length}}
  <div class="options-section">
    <div class="options-title">Options</div>
    {{#options}}
    <div class="option-item">
      <span class="option-name">{{option_name}}{{#option_description}} — {{option_description}}{{/option_description}}</span>
      <span class="option-amount">{{option_amount}}</span>
    </div>
    {{/options}}
  </div>
  {{/options.length}}

  <!-- TOTALS -->
  <div class="totals-section">
    <div class="totals-box">
      {{#total_discount}}
      <div class="totals-row subtotal">
        <span>Sous-total</span>
        <span>{{subtotal_ht}}</span>
      </div>
      <div class="totals-row discount">
        <span>Remise commerciale</span>
        <span>-{{total_discount}}</span>
      </div>
      {{/total_discount}}
      <div class="totals-row main-total">
        <span>Total HT</span>
        <span>{{total_ht}}</span>
      </div>
      <div class="totals-row tva">
        <span>TVA {{vat_rate}}</span>
        <span>{{tva_amount}}</span>
      </div>
      <div class="totals-row ttc">
        <span>Total TTC</span>
        <span>{{total_ttc}}</span>
      </div>
    </div>
  </div>

  <!-- PAYMENT -->
  {{#payment_terms}}
  <div class="payment-section">
    <div class="payment-title">Modalités de paiement :</div>
    <div class="payment-text">{{payment_terms}}</div>
  </div>
  {{/payment_terms}}

  <!-- SPECIAL CONDITIONS -->
  {{#special_conditions}}
  <div class="conditions-section">
    <div class="conditions-title">Conditions particulières</div>
    <div class="conditions-text">{{special_conditions}}</div>
  </div>
  {{/special_conditions}}

  <!-- SIGNATURE -->
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-label">L'entreprise</div>
      <div class="signature-name">{{agency_name}}</div>
    </div>
    <div class="signature-box client">
      <div class="signature-label">Le client</div>
      <div class="signature-name">{{client_name}}</div>
      <div class="signature-mention">Bon pour accord — Date et signature</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>
      <div class="footer-brand">{{agency_name}}</div>
      {{#agency_tagline}}<div class="footer-tagline">{{agency_tagline}}</div>{{/agency_tagline}}
    </div>
    <div class="footer-contact">
      {{#agency_phone}}{{agency_phone}}<br>{{/agency_phone}}
      {{agency_email}}<br>
      {{#agency_website}}{{agency_website}}{{/agency_website}}
    </div>
  </div>
  <div class="footer-legal">
    {{#agency_siret}}SIRET: {{agency_siret}} {{/agency_siret}}
    {{#agency_vat_number}}— TVA: {{agency_vat_number}} {{/agency_vat_number}}
    {{#agency_capital}}— Capital: {{agency_capital}} {{/agency_capital}}
    {{#agency_rcs_city}}— RCS {{agency_rcs_city}}{{/agency_rcs_city}}
  </div>
</body>
</html>`;

export { DEFAULT_HTML_TEMPLATE };

/**
 * Injecte les variables CSS du thème dans le HTML
 * Utilise la typo système par défaut (system-ui) qui respecte la font de l'OS/workspace
 */
export function injectThemeStyles(html: string, theme: QuoteTheme): string {
  // Default to system fonts if not specified
  const headingFont = theme.heading_font || 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  const bodyFont = theme.body_font || 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  
  const cssVars = `
    :root {
      --primary-color: ${theme.primary_color || '#1a1a1a'};
      --secondary-color: ${theme.secondary_color || '#666666'};
      --accent-color: ${theme.accent_color || '#2563eb'};
      --background-color: ${theme.background_color || '#ffffff'};
      --header-bg-color: ${theme.header_bg_color || theme.background_color || '#ffffff'};
      --table-header-bg: ${theme.table_header_bg || '#fafafa'};
      --border-color: #e5e5e5;
      --heading-font: ${headingFont};
      --body-font: ${bodyFont};
      --heading-size: ${theme.heading_size || '32px'};
      --body-size: ${theme.body_size || '10.5px'};
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
 * Génère le HTML complet pour un devis avec thème et données
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
  
  // Inject theme styles if theme exists and not using custom HTML
  if (theme && !theme.use_custom_html) {
    html = injectThemeStyles(html, theme);
  }
  
  return html;
}

/**
 * Alias pour compatibilité
 */
export function getQuotePreviewHtml(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme
): string {
  return generateQuoteHtml(document, lines, agencyInfo, theme);
}

/**
 * Ouvre une fenêtre d'impression avec le HTML du devis
 * L'utilisateur peut ensuite sauvegarder en PDF via "Imprimer vers PDF"
 */
export function printQuoteHtml(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme,
  filename?: string
): void {
  const html = generateQuoteHtml(document, lines, agencyInfo, theme);
  
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups sont autorisées.');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Set window title for PDF filename
  printWindow.document.title = filename || `Devis ${document.document_number || 'brouillon'}`;
  
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
}
