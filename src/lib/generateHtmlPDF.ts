/**
 * HTML-based PDF Generator
 * 
 * Ce module génère des devis en HTML avec support complet des thèmes.
 * Le même HTML est utilisé pour l'aperçu ET l'impression PDF native.
 * Supporte le téléchargement direct en PDF via html2canvas + jsPDF.
 */

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { AgencyInfo, mapDocumentToTemplateData, renderHtmlTemplate } from './quoteTemplateVariables';

// Template HTML par défaut - Design moderne inspiré de l'app
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
      margin: 0; 
    }
    @media print {
      html, body { 
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
      }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      font-size: var(--body-size, 10px); 
      color: var(--primary-color, #1a1a1a);
      background: var(--background-color, #fff);
      line-height: 1.5;
      font-weight: 400;
      margin: 0;
      padding: 0;
    }
    
    /* ===== PAGE BREAK CONTROL ===== */
    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .break-before {
      page-break-before: always;
      break-before: page;
    }
    .break-after {
      page-break-after: always;
      break-after: page;
    }
    .keep-together {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    /* ===== TOPBAR ===== */
    .topbar {
      width: 100%;
      background: #f5f5f5;
      padding: 6px 56px;
      font-size: 8px;
      color: #666;
      font-family: system-ui, sans-serif;
      text-align: center;
      letter-spacing: 0.02em;
    }
    
    /* ===== MAIN CONTENT ===== */
    .main-content {
      padding: 42px 56px 76px;
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
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--primary-color, #1a1a1a);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .header-agency {
      max-width: 240px;
    }
    .logo { 
      max-height: 45px; 
      max-width: 160px;
      object-fit: contain;
      margin-bottom: 10px;
    }
    .agency-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 4px;
    }
    .agency-legal-form {
      font-size: 9px;
      color: var(--secondary-color, #666);
      margin-bottom: 8px;
    }
    .agency-details {
      font-size: 8px;
      color: var(--secondary-color, #666);
      line-height: 1.5;
      margin-bottom: 6px;
    }
    .agency-fiscal {
      font-size: 7px;
      color: var(--secondary-color, #888);
      line-height: 1.4;
    }
    .header-title {
      text-align: right;
    }
    .document-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--secondary-color);
      margin-bottom: 4px;
    }
    .document-title-main {
      font-family: var(--heading-font, system-ui, sans-serif);
      font-size: 24px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    .document-number {
      font-size: 11px;
      font-weight: 500;
      color: var(--primary-color);
      margin-bottom: 2px;
    }
    .document-project-title {
      font-size: 10px;
      color: var(--secondary-color);
      max-width: 220px;
    }
    
    /* ===== INFO GRID ===== */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
      padding: 15px;
      background: var(--table-header-bg, #fafafa);
      border-radius: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .info-block {
      min-width: 0;
    }
    .info-block-full {
      grid-column: span 3;
    }
    .section-label {
      font-size: 7px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--secondary-color);
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }
    .info-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 2px;
    }
    .info-detail {
      font-size: 9px;
      color: var(--secondary-color);
      line-height: 1.5;
    }
    .info-fiscal {
      font-size: 8px;
      color: var(--secondary-color);
      margin-top: 4px;
    }
    .market-badge {
      display: inline-block;
      font-size: 7px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 3px 8px;
      background: var(--accent-color, #2563eb);
      color: white;
      border-radius: 3px;
      margin-top: 4px;
    }
    
    /* ===== AUTHOR BLOCK ===== */
    .author-block {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed var(--border-color, #ddd);
    }
    .author-label {
      font-size: 7px;
      color: var(--secondary-color);
      margin-bottom: 2px;
    }
    .author-name {
      font-size: 9px;
      font-weight: 500;
      color: var(--primary-color);
    }
    
    /* ===== DATES ROW ===== */
    .dates-row {
      display: flex;
      gap: 30px;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--border-color, #e5e5e5);
    }
    .date-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .date-label {
      font-size: 8px;
      color: var(--secondary-color);
    }
    .date-value {
      font-size: 10px;
      font-weight: 500;
      color: var(--primary-color);
    }
    
    /* ===== CONTEXT SECTION ===== */
    .context-section {
      margin-bottom: 20px;
      padding: 12px 15px;
      background: #fefefe;
      border-left: 3px solid var(--accent-color, #2563eb);
      border-radius: 0 4px 4px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .context-title {
      font-size: 9px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .context-text {
      font-size: 9px;
      color: var(--secondary-color);
      line-height: 1.6;
    }
    
    /* ===== PRICING TABLE ===== */
    .pricing-section {
      margin-bottom: 20px;
    }
    .pricing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .pricing-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary-color);
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    .pricing-table thead {
      background: var(--table-header-bg, #f8f8f8);
    }
    .pricing-table th {
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 7px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary-color);
      border-bottom: 2px solid var(--border-color, #e5e5e5);
    }
    .pricing-table th:last-child {
      text-align: right;
    }
    .pricing-table td {
      padding: 10px;
      vertical-align: top;
      border-bottom: 1px solid var(--border-color, #eee);
    }
    .pricing-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .pricing-table tr:nth-child(even) {
      background: rgba(0,0,0,0.01);
    }
    .pricing-table .phase-cell-name {
      font-weight: 500;
      color: var(--primary-color);
      margin-bottom: 2px;
    }
    .pricing-table .phase-cell-code {
      font-size: 8px;
      font-weight: 600;
      color: var(--accent-color, #2563eb);
      margin-right: 6px;
    }
    .pricing-table .phase-cell-desc {
      font-size: 8px;
      color: var(--secondary-color);
      margin-top: 3px;
      line-height: 1.4;
    }
    .pricing-table .phase-cell-qty {
      text-align: center;
      white-space: nowrap;
    }
    .pricing-table .phase-cell-amount {
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--primary-color);
      white-space: nowrap;
    }
    .type-badge {
      display: inline-block;
      font-size: 6px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 2px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-right: 6px;
      vertical-align: middle;
    }
    .type-badge.phase { background: #dbeafe; color: #1d4ed8; }
    .type-badge.service { background: #ede9fe; color: #7c3aed; }
    .type-badge.option { background: #fef3c7; color: #d97706; }
    .type-badge.expense { background: #fee2e2; color: #dc2626; }
    
    /* ===== DELIVERABLES ===== */
    .deliverables-inline {
      margin-top: 4px;
      font-size: 8px;
      color: var(--secondary-color);
    }
    .deliverables-inline span {
      display: inline-block;
      background: #f3f4f6;
      padding: 1px 6px;
      border-radius: 2px;
      margin-right: 4px;
      margin-top: 2px;
    }
    
    /* ===== OPTIONS SECTION ===== */
    .options-section {
      margin-bottom: 20px;
      padding: 12px 15px;
      background: #fffbeb;
      border: 1px dashed #d97706;
      border-radius: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .options-title {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #d97706;
      margin-bottom: 10px;
    }
    .option-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #fcd34d;
      font-size: 9px;
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
      margin: 20px 0;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .totals-box {
      width: 220px;
      background: var(--table-header-bg, #f8f8f8);
      padding: 12px 15px;
      border-radius: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 9px;
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
      margin-top: 6px;
      padding-top: 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-color);
    }
    .totals-row.tva {
      font-size: 9px;
    }
    .totals-row.ttc {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-color);
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px solid var(--border-color);
    }
    
    /* ===== PAYMENT SECTION ===== */
    .payment-section {
      margin-top: 20px;
      padding: 12px 15px;
      background: #f0fdf4;
      border-radius: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .payment-title {
      font-size: 9px;
      font-weight: 600;
      color: #166534;
      margin-bottom: 6px;
    }
    .payment-text {
      font-size: 9px;
      color: var(--secondary-color);
    }
    
    /* ===== VALIDITY ===== */
    .validity {
      margin-top: 15px;
      font-size: 8px;
      color: var(--secondary-color);
      font-style: italic;
    }
    
    /* ===== SIGNATURE ===== */
    .signature-section {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color, #e5e5e5);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .signature-box {
      flex: 1;
      text-align: center;
      min-height: 70px;
    }
    .signature-box.client {
      border: 1px dashed var(--border-color, #ccc);
      border-radius: 4px;
      padding: 12px;
    }
    .signature-label {
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary-color);
      margin-bottom: 6px;
    }
    .signature-name {
      font-size: 9px;
      color: var(--primary-color);
    }
    .signature-mention {
      font-size: 7px;
      color: var(--secondary-color);
      font-style: italic;
      margin-top: 25px;
    }
    
    /* ===== FOOTER ===== */
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color, #e5e5e5);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-brand {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 2px;
    }
    .footer-tagline {
      font-size: 8px;
      color: var(--secondary-color);
      font-style: italic;
    }
    .footer-contact {
      text-align: right;
      font-size: 8px;
      color: var(--secondary-color);
    }
    .footer-legal {
      font-size: 7px;
      color: var(--secondary-color);
      margin-top: 8px;
      text-align: center;
    }
    
    /* ===== CONDITIONS ===== */
    .conditions-section {
      margin-top: 20px;
    }
    .conditions-title {
      font-size: 9px;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 6px;
    }
    .conditions-text {
      font-size: 8px;
      color: var(--secondary-color);
      line-height: 1.5;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <!-- TOPBAR -->
  {{#topbar_text}}
  <div class="topbar">{{topbar_text}}</div>
  {{/topbar_text}}

  <div class="main-content">
    <!-- HEADER -->
    <div class="header">
      <div class="header-agency">
        {{#agency_logo_url}}
        <img src="{{agency_logo_url}}" alt="Logo" class="logo">
        {{/agency_logo_url}}
        {{^agency_logo_url}}
        <div class="agency-name">{{agency_name}}</div>
        {{/agency_logo_url}}
        {{#agency_legal_form}}
        <div class="agency-legal-form">{{agency_legal_form}}{{#agency_capital}} — Capital {{agency_capital}}{{/agency_capital}}</div>
        {{/agency_legal_form}}
        <div class="agency-details">
          {{agency_address}}<br>
          {{agency_postal_code}} {{agency_city}}<br>
          {{#agency_phone}}Tél. {{agency_phone}}<br>{{/agency_phone}}
          {{agency_email}}
          {{#agency_website}}<br>{{agency_website}}{{/agency_website}}
        </div>
        <div class="agency-fiscal">
          {{#agency_siret}}SIRET {{agency_siret}}<br>{{/agency_siret}}
          {{#agency_vat_number}}TVA {{agency_vat_number}}{{/agency_vat_number}}
          {{#agency_rcs_city}}<br>RCS {{agency_rcs_city}}{{/agency_rcs_city}}
          {{#agency_naf_code}} — NAF {{agency_naf_code}}{{/agency_naf_code}}
        </div>
      </div>
      <div class="header-title">
        <div class="document-label">{{document_type}}</div>
        <div class="document-title-main">N° {{document_number}}</div>
        <div class="document-project-title">{{document_title}}</div>
      </div>
    </div>

    <!-- INFO GRID: Client + Contact + Interlocuteur -->
    <div class="info-grid">
      <!-- Client block -->
      <div class="info-block">
        <div class="section-label">Client</div>
        <div class="info-name">{{client_name}}</div>
        {{#client_legal_form}}<div class="info-detail">{{client_legal_form}}</div>{{/client_legal_form}}
        {{#client_address}}<div class="info-detail">{{client_address}}</div>{{/client_address}}
        {{#client_postal_code}}<div class="info-detail">{{client_postal_code}} {{client_city}}</div>{{/client_postal_code}}
        {{#client_phone}}<div class="info-detail">Tél. {{client_phone}}</div>{{/client_phone}}
        {{#client_siret}}<div class="info-fiscal">SIRET {{client_siret}}</div>{{/client_siret}}
        {{#client_vat_number}}<div class="info-fiscal">TVA {{client_vat_number}}</div>{{/client_vat_number}}
      </div>
      
      <!-- Contact block -->
      <div class="info-block">
        <div class="section-label">Contact</div>
        {{#client_contact_name}}
        <div class="info-name">{{client_contact_name}}</div>
        {{#client_contact_role}}<div class="info-detail">{{client_contact_role}}</div>{{/client_contact_role}}
        {{#client_contact_email}}<div class="info-detail">{{client_contact_email}}</div>{{/client_contact_email}}
        {{#client_contact_phone}}<div class="info-detail">{{client_contact_phone}}</div>{{/client_contact_phone}}
        {{/client_contact_name}}
        {{^client_contact_name}}
        <div class="info-detail" style="font-style: italic;">Non renseigné</div>
        {{/client_contact_name}}
      </div>
      
      <!-- Interlocuteur / Marché public block -->
      <div class="info-block">
        {{#is_public_market}}
        <div class="section-label">Marché public</div>
        <div class="market-badge">Marché public</div>
        {{#market_reference}}<div class="info-detail" style="margin-top: 6px;">Réf. {{market_reference}}</div>{{/market_reference}}
        {{/is_public_market}}
        {{^is_public_market}}
        <div class="section-label">Votre interlocuteur</div>
        {{#author_name}}
        <div class="info-name">{{author_name}}</div>
        {{#author_email}}<div class="info-detail">{{author_email}}</div>{{/author_email}}
        {{#author_phone}}<div class="info-detail">{{author_phone}}</div>{{/author_phone}}
        {{/author_name}}
        {{^author_name}}
        <div class="info-detail" style="font-style: italic;">—</div>
        {{/author_name}}
        {{/is_public_market}}
      </div>
      
      <!-- Project location if exists -->
      {{#project_address}}
      <div class="info-block info-block-full">
        <div class="section-label">Lieu d'exécution</div>
        <div class="info-detail">{{project_address}}{{#project_city}}, {{project_postal_code}} {{project_city}}{{/project_city}}</div>
        {{#project_surface}}<div class="info-detail">Surface : {{project_surface}}</div>{{/project_surface}}
      </div>
      {{/project_address}}
    </div>

    <!-- DATES ROW -->
    <div class="dates-row">
      <div class="date-item">
        <span class="date-label">Émis le</span>
        <span class="date-value">{{date}}</span>
      </div>
      {{#validity_date}}
      <div class="date-item">
        <span class="date-label">Valable jusqu'au</span>
        <span class="date-value">{{validity_date}}</span>
      </div>
      {{/validity_date}}
      {{#expected_start_date}}
      <div class="date-item">
        <span class="date-label">Début prévu</span>
        <span class="date-value">{{expected_start_date}}</span>
      </div>
      {{/expected_start_date}}
    </div>

    <!-- CONTEXT / INTRO -->
    {{#header_text}}
    <div class="context-section">
      <div class="context-title">Objet</div>
      <div class="context-text">{{header_text}}</div>
    </div>
    {{/header_text}}

    <!-- PRICING TABLE -->
    <div class="pricing-section">
      <div class="pricing-header">
        <div class="pricing-title">Détail des prestations</div>
      </div>
      <table class="pricing-table">
        <thead>
          <tr>
            <th style="width: 55%">Désignation</th>
            <th style="width: 20%">Quantité</th>
            <th style="width: 25%">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {{#phases}}
          <tr>
            <td>
              {{#phase_code}}<span class="phase-cell-code">{{phase_code}}</span>{{/phase_code}}
              <span class="phase-cell-name">{{phase_name}}</span>
              {{#phase_description}}<div class="phase-cell-desc">{{phase_description}}</div>{{/phase_description}}
              {{#deliverables.length}}
              <div class="deliverables-inline">
                {{#deliverables}}<span>{{deliverable_name}}</span>{{/deliverables}}
              </div>
              {{/deliverables.length}}
            </td>
            <td class="phase-cell-qty">{{phase_quantity}} {{phase_unit}}</td>
            <td class="phase-cell-amount">{{phase_amount}}</td>
          </tr>
          {{/phases}}
        </tbody>
      </table>
    </div>

    <!-- OPTIONS -->
    {{#options.length}}
    <div class="options-section">
      <div class="options-title">Options (non incluses)</div>
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
          <span>Sous-total HT</span>
          <span>{{subtotal_ht}}</span>
        </div>
        <div class="totals-row discount">
          <span>Remise</span>
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
      <div class="payment-title">Modalités de paiement</div>
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

/**
 * Télécharge le devis en PDF directement (sans boîte de dialogue d'impression)
 * Utilise html2canvas + jsPDF pour un rendu fidèle avec découpage propre des pages
 */
export async function downloadQuotePdf(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo: AgencyInfo | null,
  theme?: QuoteTheme,
  filename?: string
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const html = generateQuoteHtml(document, lines, agencyInfo, theme);

  // A4 dimensions at 96 DPI
  const A4_WIDTH_PX = 794;
  const A4_HEIGHT_PX = 1123;
  const SCALE = 2; // Higher quality (2x resolution)

  // Create a hidden container for rendering
  const container = window.document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${A4_WIDTH_PX}px;
    height: auto;
    background: white;
    z-index: -1;
  `;
  window.document.body.appendChild(container);

  // Create iframe for isolated rendering
  const iframe = window.document.createElement('iframe');
  iframe.style.cssText = `
    width: ${A4_WIDTH_PX}px;
    height: ${A4_HEIGHT_PX}px;
    border: none;
    background: white;
  `;
  container.appendChild(iframe);

  // Write HTML to iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  const iframeWin = iframe.contentWindow;
  if (!iframeDoc || !iframeWin) {
    container.remove();
    throw new Error('Impossible de créer le document PDF');
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for images and fonts to load
  await new Promise((resolve) => setTimeout(resolve, 700));

  const computeSmartPageBreaks = (): Array<{ start: number; height: number }> => {
    iframeWin.scrollTo(0, 0);

    const contentHeight = Math.max(
      iframeDoc.body.scrollHeight,
      iframeDoc.documentElement.scrollHeight
    );

    const selectors = [
      '.header',
      '.info-grid',
      '.context-section',
      '.options-section',
      '.totals-section',
      '.payment-section',
      '.signature-section',
      '.pricing-table tr',
    ];

    const keepTogetherEls = Array.from(
      iframeDoc.querySelectorAll(selectors.join(','))
    ) as HTMLElement[];

    const rects = keepTogetherEls
      .map((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top + iframeWin.scrollY;
        const bottom = r.bottom + iframeWin.scrollY;
        return { top, bottom };
      })
      .filter((r) => Number.isFinite(r.top) && Number.isFinite(r.bottom) && r.bottom > r.top)
      .sort((a, b) => a.top - b.top);

    const pages: Array<{ start: number; height: number }> = [];
    let start = 0;

    while (start < contentHeight - 1) {
      const idealEnd = start + A4_HEIGHT_PX;
      let end = Math.min(idealEnd, contentHeight);

      // If the page boundary cuts through an element, move the break up to the element's top.
      for (const r of rects) {
        if (r.top < end && r.bottom > end) {
          const candidate = Math.max(start + 120, Math.floor(r.top) - 8);
          if (candidate < end) end = candidate;
          break;
        }
      }

      // Safety: ensure progress.
      if (end <= start + 80) {
        end = Math.min(idealEnd, contentHeight);
      }

      pages.push({ start, height: Math.min(A4_HEIGHT_PX, Math.max(1, end - start)) });
      start = end;
    }

    return pages;
  };

  try {
    const pages = computeSmartPageBreaks();
    const totalPages = pages.length;

    // Render FULL document once to a large canvas
    const fullCanvas = await html2canvas(iframeDoc.body, {
      scale: SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: A4_WIDTH_PX,
      windowWidth: A4_WIDTH_PX,
      logging: false,
    });

    // Capture mini-header for pages 2+ (agency info + doc number)
    // We'll render a separate header canvas from the .header element
    let headerCanvas: HTMLCanvasElement | null = null;
    const headerEl = iframeDoc.querySelector('.header') as HTMLElement | null;
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    
    if (headerEl && totalPages > 1) {
      headerCanvas = await html2canvas(headerEl, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH_PX,
        windowWidth: A4_WIDTH_PX,
        logging: false,
      });
    }

    // Create PDF (A4 dimensions in mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // A4 in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Slice the big canvas into clean A4 pages (no stretching)
    const pageW = A4_WIDTH_PX * SCALE;
    const pageH = A4_HEIGHT_PX * SCALE;

    const pageCanvas = window.document.createElement('canvas');
    pageCanvas.width = pageW;
    pageCanvas.height = pageH;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Footer dimensions
    const footerMarginBottom = 10; // mm from bottom
    const footerFontSize = 8;

    pages.forEach(({ start, height }, idx) => {
      if (idx > 0) pdf.addPage();

      // Clear + white background
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pageW, pageH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageW, pageH);

      // For pages 2+, draw the header at the top first
      let contentYOffset = 0;
      if (idx > 0 && headerCanvas) {
        const headerH = headerCanvas.height;
        // Draw header at top
        ctx.drawImage(headerCanvas, 0, 0);
        contentYOffset = headerH;
      }

      const sy = Math.round(start * SCALE);
      const sh = Math.round(height * SCALE);

      // Draw content (offset down if we added a header)
      if (idx > 0 && headerCanvas) {
        // Draw content below the header
        ctx.drawImage(fullCanvas, 0, sy, pageW, sh, 0, contentYOffset, pageW, sh);
      } else {
        // First page: draw normally
        ctx.drawImage(fullCanvas, 0, sy, pageW, sh, 0, 0, pageW, sh);
      }

      const imgData = pageCanvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Add page number footer
      pdf.setFontSize(footerFontSize);
      pdf.setTextColor(120, 120, 120);
      const pageText = `${idx + 1} / ${totalPages}`;
      const textWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, (pdfWidth - textWidth) / 2, pdfHeight - footerMarginBottom);
    });

    const pdfFilename = filename || `Devis ${document.document_number || 'brouillon'}`;
    pdf.save(`${pdfFilename}.pdf`);
  } finally {
    container.remove();
  }
}
