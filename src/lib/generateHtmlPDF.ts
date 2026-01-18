/**
 * HTML-based PDF Generator
 * 
 * Ce module génère des devis en HTML avec support complet des thèmes.
 * Le même HTML est utilisé pour l'aperçu ET l'impression PDF native.
 */

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo, mapDocumentToTemplateData, renderHtmlTemplate } from './quoteTemplateVariables';

// Template HTML par défaut avec toutes les sections
const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{document_type}} {{document_number}}</title>
  <style>
    @page { 
      size: A4; 
      margin: 12mm 15mm; 
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: avoid; }
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: var(--body-font, 'Segoe UI', system-ui, sans-serif); 
      font-size: var(--body-size, 11px); 
      color: var(--primary-color, #1a1a1a);
      background: var(--background-color, white);
      line-height: 1.5;
    }
    .page {
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    /* ===== HEADER ===== */
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid var(--accent-color, #2563eb);
    }
    .header-left { flex: 1; }
    .header-right { text-align: right; }
    .logo { 
      max-height: 70px; 
      max-width: 200px;
      object-fit: contain; 
    }
    .agency-name {
      font-family: var(--heading-font, 'Segoe UI', sans-serif);
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-color, #1a1a1a);
      margin-bottom: 5px;
    }
    .agency-info { 
      font-size: 10px; 
      color: var(--secondary-color, #666666); 
      line-height: 1.4;
    }
    .document-type { 
      font-size: var(--heading-size, 28px); 
      font-weight: 700; 
      color: var(--accent-color, #2563eb);
      font-family: var(--heading-font, 'Segoe UI', sans-serif);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .document-number {
      font-size: 12px;
      color: var(--secondary-color, #666666);
      margin-top: 5px;
    }
    .document-date {
      font-size: 11px;
      color: var(--secondary-color, #666666);
    }
    
    /* ===== INFO GRID ===== */
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-bottom: 25px;
    }
    .info-box { 
      padding: 15px; 
      background: var(--table-header-bg, #f8fafc); 
      border-radius: 8px;
      border-left: 4px solid var(--accent-color, #2563eb);
    }
    .info-box h3 { 
      font-size: 9px; 
      font-weight: 700; 
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 10px; 
      color: var(--accent-color, #2563eb); 
    }
    .info-box p { 
      margin: 4px 0;
      font-size: 11px;
    }
    .info-box strong { 
      color: var(--primary-color, #1a1a1a);
      font-size: 13px;
    }
    
    /* ===== PROJECT INFO ===== */
    .project-details {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
      padding: 12px 15px;
      background: var(--table-header-bg, #f8fafc);
      border-radius: 6px;
      font-size: 10px;
      color: var(--secondary-color, #666666);
    }
    .project-details span {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    /* ===== INTRO TEXT ===== */
    .intro-text {
      margin-bottom: 20px;
      padding: 15px;
      background: linear-gradient(to right, var(--table-header-bg, #f8fafc), transparent);
      border-left: 3px solid var(--accent-color, #2563eb);
      font-size: 11px;
      color: var(--secondary-color, #666666);
      white-space: pre-wrap;
    }
    
    /* ===== TABLE ===== */
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 20px; 
    }
    thead tr { 
      background: var(--accent-color, #2563eb); 
    }
    th { 
      color: white; 
      padding: 12px 10px; 
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    th.align-right { text-align: right; }
    th.align-center { text-align: center; }
    td { 
      padding: 10px; 
      border-bottom: 1px solid #e5e7eb; 
      vertical-align: top;
      font-size: 11px;
    }
    td.align-right { text-align: right; }
    td.align-center { text-align: center; }
    tr:nth-child(even) td { 
      background: rgba(248, 250, 252, 0.5); 
    }
    .row-phase-code { 
      font-family: 'Consolas', 'Monaco', monospace; 
      font-size: 10px; 
      color: var(--accent-color, #2563eb);
      font-weight: 600;
    }
    .row-phase-name { 
      font-weight: 600; 
      color: var(--primary-color, #1a1a1a);
      margin-bottom: 3px;
    }
    .row-phase-description { 
      font-size: 10px; 
      color: var(--secondary-color, #666666); 
    }
    .row-phase-deliverables {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed #e5e7eb;
      font-size: 9px;
      color: var(--secondary-color, #666666);
    }
    .row-phase-deliverables strong {
      color: var(--accent-color, #2563eb);
    }
    .row-amount { 
      font-weight: 600; 
      color: var(--accent-color, #2563eb);
      white-space: nowrap;
    }
    
    /* ===== GROUPS ===== */
    .group-header td {
      background: var(--table-header-bg, #f8fafc) !important;
      font-weight: 700;
      color: var(--primary-color, #1a1a1a);
      border-bottom: 2px solid var(--accent-color, #2563eb);
    }
    .group-subtotal td {
      background: var(--table-header-bg, #f8fafc) !important;
      font-weight: 600;
      font-style: italic;
      border-top: 1px dashed var(--accent-color, #2563eb);
    }
    
    /* ===== OPTIONS ===== */
    .options-section { margin-bottom: 20px; }
    .options-section h3 { 
      font-size: 12px; 
      text-transform: uppercase;
      color: var(--accent-color, #2563eb); 
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px dashed var(--accent-color, #2563eb);
      letter-spacing: 0.05em;
    }
    .options-section table td { 
      color: var(--secondary-color, #666666); 
      border-style: dashed;
      font-style: italic;
    }
    
    /* ===== DISCOUNTS ===== */
    .discount-row td {
      color: #dc2626 !important;
      font-weight: 500;
    }
    
    /* ===== TOTALS ===== */
    .totals-container { 
      display: flex; 
      justify-content: flex-end; 
      margin-bottom: 25px;
    }
    .totals { 
      width: 280px;
      padding: 15px;
      background: var(--table-header-bg, #f8fafc);
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .totals-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 8px 0; 
      font-size: 11px;
      color: var(--secondary-color, #666666);
    }
    .totals-row.subtotal {
      color: var(--primary-color, #1a1a1a);
    }
    .totals-row.discount {
      color: #dc2626;
    }
    .totals-row.total { 
      border-top: 2px solid var(--accent-color, #2563eb);
      margin-top: 8px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-color, #1a1a1a);
    }
    .totals-row.total .value { 
      color: var(--accent-color, #2563eb); 
    }
    .totals-row.deposit {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
      font-weight: 600;
      color: var(--accent-color, #2563eb);
    }
    
    /* ===== SCHEDULE ===== */
    .schedule-section { margin-bottom: 20px; }
    .schedule-section h3 { 
      font-size: 12px; 
      font-weight: 600; 
      margin-bottom: 10px; 
      color: var(--primary-color, #1a1a1a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .schedule-table th { font-size: 9px; }
    .schedule-table td { font-size: 10px; }
    
    /* ===== CONDITIONS ===== */
    .conditions-section { margin-bottom: 20px; }
    .conditions-section h3 { 
      font-size: 11px; 
      font-weight: 600; 
      margin-bottom: 8px; 
      color: var(--primary-color, #1a1a1a);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .conditions-section p { 
      font-size: 10px; 
      color: var(--secondary-color, #666666); 
      white-space: pre-wrap;
      line-height: 1.6;
    }
    
    /* ===== VALIDITY ===== */
    .validity {
      font-size: 10px;
      color: var(--secondary-color, #666666);
      margin-bottom: 25px;
      padding: 10px 15px;
      background: var(--table-header-bg, #f8fafc);
      border-radius: 6px;
    }
    
    /* ===== SIGNATURE ===== */
    .signature-section { 
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-top: auto;
      padding-top: 30px;
    }
    .signature-box { 
      flex: 1;
      text-align: center;
      padding: 20px; 
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      min-height: 100px;
    }
    .signature-box.client {
      border-style: dashed;
      border-color: var(--secondary-color, #666666);
    }
    .signature-box h4 {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary-color, #1a1a1a);
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .signature-box p { 
      font-size: 9px; 
      color: var(--secondary-color, #666666);
    }
    .signature-box img {
      max-height: 50px;
      margin-top: 10px;
    }
    
    /* ===== FOOTER ===== */
    .footer { 
      margin-top: 30px;
      padding-top: 15px; 
      border-top: 1px solid #e5e7eb; 
      font-size: 8px; 
      color: var(--secondary-color, #666666);
      text-align: center;
      line-height: 1.6;
    }
    .footer strong {
      color: var(--primary-color, #1a1a1a);
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- HEADER -->
    <div class="header">
      <div class="header-left">
        {{#agency_logo_url}}
        <img src="{{agency_logo_url}}" alt="Logo" class="logo">
        {{/agency_logo_url}}
        {{^agency_logo_url}}
        <div class="agency-name">{{agency_name}}</div>
        {{/agency_logo_url}}
        <div class="agency-info">
          {{agency_address}}<br>
          {{agency_postal_code}} {{agency_city}}<br>
          {{#agency_phone}}Tél: {{agency_phone}}<br>{{/agency_phone}}
          {{agency_email}}
        </div>
      </div>
      <div class="header-right">
        <div class="document-type">{{document_type}}</div>
        <div class="document-number">N° {{document_number}}</div>
        <div class="document-date">{{date}}</div>
      </div>
    </div>

    <!-- CLIENT & PROJECT INFO -->
    <div class="info-grid">
      <div class="info-box">
        <h3>Client</h3>
        <p><strong>{{client_name}}</strong></p>
        {{#client_contact_name}}<p>{{client_contact_name}}</p>{{/client_contact_name}}
        {{#client_contact_email}}<p>{{client_contact_email}}</p>{{/client_contact_email}}
        {{#billing_contact_name}}
        <p style="margin-top: 8px; font-size: 10px; color: var(--secondary-color);">
          <em>Facturation: {{billing_contact_name}}</em>
        </p>
        {{/billing_contact_name}}
      </div>
      <div class="info-box">
        <h3>Projet</h3>
        <p><strong>{{document_title}}</strong></p>
        {{#project_address}}<p>{{project_address}}</p>{{/project_address}}
        {{#project_city}}<p>{{project_city}} {{project_postal_code}}</p>{{/project_city}}
      </div>
    </div>

    <!-- PROJECT DETAILS -->
    {{#project_surface}}
    <div class="project-details">
      <span>📐 Surface: {{project_surface}}</span>
      {{#construction_budget}}<span>💰 Budget travaux: {{construction_budget}}</span>{{/construction_budget}}
      {{#project_budget}}<span>💼 Budget projet: {{project_budget}}</span>{{/project_budget}}
      {{#expected_start_date}}<span>🗓️ Début: {{expected_start_date}}</span>{{/expected_start_date}}
      {{#expected_end_date}}<span>📅 Fin: {{expected_end_date}}</span>{{/expected_end_date}}
    </div>
    {{/project_surface}}

    <!-- INTRO TEXT -->
    {{#header_text}}
    <div class="intro-text">{{header_text}}</div>
    {{/header_text}}

    <!-- PHASES TABLE -->
    <table>
      <thead>
        <tr>
          <th style="width: 70px;">Réf.</th>
          <th>Désignation</th>
          <th class="align-center" style="width: 60px;">Qté</th>
          <th class="align-right" style="width: 90px;">P.U. HT</th>
          <th class="align-right" style="width: 100px;">Montant HT</th>
        </tr>
      </thead>
      <tbody>
        {{#phases}}
        <tr>
          <td class="row-phase-code">{{phase_code}}</td>
          <td>
            <div class="row-phase-name">{{phase_name}}</div>
            {{#phase_description}}<div class="row-phase-description">{{phase_description}}</div>{{/phase_description}}
            {{#deliverables.length}}
            <div class="row-phase-deliverables">
              <strong>Livrables:</strong>
              {{#deliverables}}{{deliverable_name}}{{^last}}, {{/last}}{{/deliverables}}
            </div>
            {{/deliverables.length}}
          </td>
          <td class="align-center">{{phase_quantity}} {{phase_unit}}</td>
          <td class="align-right">{{phase_unit_price}}</td>
          <td class="align-right row-amount">{{phase_amount}}</td>
        </tr>
        {{/phases}}
        
        {{#discounts}}
        <tr class="discount-row">
          <td></td>
          <td>{{discount_name}}{{#discount_description}} - {{discount_description}}{{/discount_description}}</td>
          <td></td>
          <td class="align-right">{{discount_percentage}}</td>
          <td class="align-right">{{discount_amount}}</td>
        </tr>
        {{/discounts}}
      </tbody>
    </table>

    <!-- OPTIONS -->
    {{#options.length}}
    <div class="options-section">
      <h3>Options (non incluses dans le montant)</h3>
      <table>
        <tbody>
          {{#options}}
          <tr>
            <td style="width: 70px;">{{option_code}}</td>
            <td>{{option_name}}{{#option_description}} - {{option_description}}{{/option_description}}</td>
            <td class="align-right" style="width: 100px;">{{option_amount}}</td>
          </tr>
          {{/options}}
        </tbody>
      </table>
    </div>
    {{/options.length}}

    <!-- TOTALS -->
    <div class="totals-container">
      <div class="totals">
        {{#total_discount}}
        <div class="totals-row subtotal">
          <span>Sous-total HT</span>
          <span>{{subtotal_ht}}</span>
        </div>
        <div class="totals-row discount">
          <span>Remise</span>
          <span>-{{total_discount}}</span>
        </div>
        {{/total_discount}}
        <div class="totals-row">
          <span>Total HT</span>
          <span>{{total_ht}}</span>
        </div>
        <div class="totals-row">
          <span>TVA ({{vat_rate}})</span>
          <span>{{tva_amount}}</span>
        </div>
        <div class="totals-row total">
          <span>Total TTC</span>
          <span class="value">{{total_ttc}}</span>
        </div>
        {{#requires_deposit}}
        <div class="totals-row deposit">
          <span>Acompte à la commande ({{deposit_percentage}})</span>
          <span>{{deposit_amount}}</span>
        </div>
        {{/requires_deposit}}
      </div>
    </div>

    <!-- INVOICE SCHEDULE -->
    {{#invoice_schedule.length}}
    <div class="schedule-section">
      <h3>Échéancier de facturation</h3>
      <table class="schedule-table">
        <thead>
          <tr>
            <th style="width: 40px;">N°</th>
            <th>Échéance</th>
            <th class="align-center" style="width: 80px;">%</th>
            <th class="align-right" style="width: 100px;">Montant HT</th>
            <th class="align-right" style="width: 100px;">Montant TTC</th>
            <th style="width: 100px;">Date prévue</th>
          </tr>
        </thead>
        <tbody>
          {{#invoice_schedule}}
          <tr>
            <td>{{schedule_number}}</td>
            <td>{{schedule_title}}{{#schedule_milestone}} ({{schedule_milestone}}){{/schedule_milestone}}</td>
            <td class="align-center">{{schedule_percentage}}</td>
            <td class="align-right">{{schedule_amount_ht}}</td>
            <td class="align-right">{{schedule_amount_ttc}}</td>
            <td>{{schedule_date}}</td>
          </tr>
          {{/invoice_schedule}}
        </tbody>
      </table>
    </div>
    {{/invoice_schedule.length}}

    <!-- PAYMENT TERMS -->
    {{#payment_terms}}
    <div class="conditions-section">
      <h3>Conditions de paiement</h3>
      <p>{{payment_terms}}</p>
    </div>
    {{/payment_terms}}

    <!-- SPECIAL CONDITIONS -->
    {{#special_conditions}}
    <div class="conditions-section">
      <h3>Conditions particulières</h3>
      <p>{{special_conditions}}</p>
    </div>
    {{/special_conditions}}

    <!-- VALIDITY -->
    <div class="validity">
      <strong>Validité:</strong> Ce devis est valable {{validity_days}} jours, soit jusqu'au {{validity_date}}.
    </div>

    <!-- SIGNATURE -->
    <div class="signature-section">
      <div class="signature-box">
        <h4>L'entreprise</h4>
        <p>{{agency_name}}</p>
        {{#agency_signature_url}}
        <img src="{{agency_signature_url}}" alt="Signature">
        {{/agency_signature_url}}
      </div>
      <div class="signature-box client">
        <h4>Le client</h4>
        <p>Date et signature</p>
        <p><em>Précédé de la mention "Bon pour accord"</em></p>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <strong>{{agency_name}}</strong><br>
      {{#agency_siret}}SIRET: {{agency_siret}} {{/agency_siret}}
      {{#agency_vat_number}}— TVA: {{agency_vat_number}} {{/agency_vat_number}}
      {{#agency_capital}}— Capital: {{agency_capital}} {{/agency_capital}}
      {{#agency_rcs_city}}— RCS {{agency_rcs_city}}{{/agency_rcs_city}}
      {{#footer_text}}<br>{{footer_text}}{{/footer_text}}
    </div>
  </div>
</body>
</html>`;

export { DEFAULT_HTML_TEMPLATE };

/**
 * Injecte les variables CSS du thème dans le HTML
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
      --heading-size: ${theme.heading_size || '28px'};
      --body-size: ${theme.body_size || '11px'};
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
  printWindow.document.title = filename || `${document.document_type === 'quote' ? 'Devis' : 'Contrat'} ${document.document_number || 'brouillon'}`;
  
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
}
