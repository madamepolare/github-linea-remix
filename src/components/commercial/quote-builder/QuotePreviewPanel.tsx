import React from 'react';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { useQuoteThemes, QuoteTheme } from '@/hooks/useQuoteThemes';
import { QuoteDocument, QuoteLine, LINE_TYPE_LABELS } from '@/types/quoteTypes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuotePreviewPanelProps {
  document: Partial<QuoteDocument>;
  lines: QuoteLine[];
  zoom: number;
  selectedThemeId?: string | null;
}

// Complete theme style mapping
interface ThemeStyles {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headerBgColor: string;
  // Typography
  headingFont: string;
  bodyFont: string;
  headingSize: string;
  bodySize: string;
  // Layout
  headerStyle: 'classic' | 'modern' | 'minimal' | 'centered';
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  // Table
  tableHeaderBg: string;
  tableBorderStyle: 'solid' | 'dashed' | 'none';
  tableStripeRows: boolean;
  // Footer
  footerStyle: 'simple' | 'detailed' | 'minimal';
  showSignatureArea: boolean;
}

function getThemeStyles(theme: QuoteTheme | undefined): ThemeStyles {
  if (!theme) {
    return {
      primaryColor: '#0a0a0a',
      secondaryColor: '#737373',
      accentColor: '#7c3aed',
      backgroundColor: '#ffffff',
      headerBgColor: '#ffffff',
      headingFont: 'system-ui, sans-serif',
      bodyFont: 'system-ui, sans-serif',
      headingSize: '24px',
      bodySize: '12px',
      headerStyle: 'classic',
      showLogo: true,
      logoPosition: 'left',
      logoSize: 'medium',
      tableHeaderBg: '#f5f5f5',
      tableBorderStyle: 'solid',
      tableStripeRows: false,
      footerStyle: 'simple',
      showSignatureArea: true,
    };
  }

  return {
    primaryColor: theme.primary_color,
    secondaryColor: theme.secondary_color,
    accentColor: theme.accent_color,
    backgroundColor: theme.background_color,
    headerBgColor: theme.header_bg_color || theme.background_color,
    headingFont: theme.heading_font,
    bodyFont: theme.body_font,
    headingSize: theme.heading_size || '24px',
    bodySize: theme.body_size || '12px',
    headerStyle: theme.header_style,
    showLogo: theme.show_logo,
    logoPosition: theme.logo_position,
    logoSize: theme.logo_size,
    tableHeaderBg: theme.table_header_bg,
    tableBorderStyle: theme.table_border_style,
    tableStripeRows: theme.table_stripe_rows,
    footerStyle: theme.footer_style,
    showSignatureArea: theme.show_signature_area,
  };
}

function getLogoSizeClass(size: 'small' | 'medium' | 'large'): string {
  switch (size) {
    case 'small': return 'max-h-12';
    case 'medium': return 'max-h-20';
    case 'large': return 'max-h-28';
    default: return 'max-h-20';
  }
}

function getLogoAlignClass(position: 'left' | 'center' | 'right'): string {
  switch (position) {
    case 'left': return 'object-left';
    case 'center': return 'object-center mx-auto';
    case 'right': return 'object-right ml-auto';
    default: return 'object-left';
  }
}

export function QuotePreviewPanel({ document, lines, zoom, selectedThemeId }: QuotePreviewPanelProps) {
  const { agencyInfo } = useAgencyInfo();
  const { themes } = useQuoteThemes();
  
  // Get selected theme or default
  const currentTheme = selectedThemeId 
    ? themes.find(t => t.id === selectedThemeId)
    : themes.find(t => t.is_default);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  // Get groups and organize lines
  const groups = lines.filter(l => l.line_type === 'group');
  const getGroupLines = (groupId: string) => lines.filter(l => l.group_id === groupId && l.line_type !== 'group');
  const ungroupedLines = lines.filter(l => !l.group_id && l.line_type !== 'group');
  const getGroupSubtotal = (groupId: string) => {
    return getGroupLines(groupId).filter(l => l.is_included && l.line_type !== 'discount').reduce((sum, l) => sum + (l.amount || 0), 0);
  };

  // Optional items (not included)
  const optionalItems = lines.filter(l => !l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');

  // Calculate totals
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const discountLines = lines.filter(l => l.line_type === 'discount');
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const vatRate = document.vat_rate ?? 20;
  const tva = totalHT * (vatRate / 100);
  const totalTTC = totalHT + tva;

  const scale = zoom / 100;
  
  // Get complete theme styles
  const ts = getThemeStyles(currentTheme);

  // Table border style
  const tableBorderClass = ts.tableBorderStyle === 'none' 
    ? 'border-0' 
    : ts.tableBorderStyle === 'dashed' 
      ? 'border-dashed' 
      : 'border-solid';

  // Row stripe style
  const getRowBg = (index: number) => {
    if (!ts.tableStripeRows) return 'transparent';
    return index % 2 === 1 ? `${ts.tableHeaderBg}40` : 'transparent';
  };

  return (
    <div 
      className="bg-white shadow-lg rounded-lg overflow-hidden origin-top w-full"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        minHeight: '297mm',
        backgroundColor: ts.backgroundColor,
      }}
    >
      {/* Page content */}
      <div 
        className="p-8" 
        style={{ 
          fontFamily: ts.bodyFont,
          color: ts.primaryColor,
          fontSize: ts.bodySize,
        }}
      >
        {/* ===== HEADER SECTION ===== */}
        <div 
          className="mb-6 -mx-8 -mt-8 px-8 pt-8 pb-4"
          style={{ backgroundColor: ts.headerBgColor }}
        >
          {ts.headerStyle === 'centered' ? (
            // Centered header
            <div className="text-center">
              {ts.showLogo && agencyInfo?.logo_url && (
                <img 
                  src={agencyInfo.logo_url} 
                  alt="Logo" 
                  className={`${getLogoSizeClass(ts.logoSize)} object-contain mx-auto mb-4`}
                />
              )}
              {(!agencyInfo?.logo_url && ts.showLogo) && (
                <div 
                  className="font-bold mb-4"
                  style={{ fontFamily: ts.headingFont, fontSize: ts.headingSize, color: ts.primaryColor }}
                >
                  {agencyInfo?.name || 'Votre agence'}
                </div>
              )}
              <div 
                className="text-2xl font-bold uppercase mb-2"
                style={{ color: ts.accentColor, fontFamily: ts.headingFont, fontSize: ts.headingSize }}
              >
                {document.document_type === 'quote' ? 'Devis' : 
                 document.document_type === 'contract' ? 'Contrat' : 'Proposition'}
              </div>
              <div style={{ color: ts.secondaryColor }}>
                {document.document_number || 'BROUILLON'}
              </div>
              <div className="text-xs mt-1" style={{ color: ts.secondaryColor }}>
                {formatDate(document.created_at) || format(new Date(), 'd MMMM yyyy', { locale: fr })}
              </div>
            </div>
          ) : ts.headerStyle === 'modern' ? (
            // Modern header - side by side with accent bar
            <div>
              <div 
                className="h-1 w-24 mb-4"
                style={{ backgroundColor: ts.accentColor }}
              />
              <div className="flex justify-between items-start">
                <div>
                  {ts.showLogo && agencyInfo?.logo_url ? (
                    <img 
                      src={agencyInfo.logo_url} 
                      alt="Logo" 
                      className={`${getLogoSizeClass(ts.logoSize)} object-contain ${getLogoAlignClass(ts.logoPosition)}`}
                    />
                  ) : (
                    <div 
                      className="font-bold"
                      style={{ fontFamily: ts.headingFont, fontSize: ts.headingSize, color: ts.primaryColor }}
                    >
                      {agencyInfo?.name || 'Votre agence'}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div 
                    className="font-bold uppercase"
                    style={{ color: ts.accentColor, fontFamily: ts.headingFont, fontSize: ts.headingSize }}
                  >
                    {document.document_type === 'quote' ? 'Devis' : 
                     document.document_type === 'contract' ? 'Contrat' : 'Proposition'}
                  </div>
                  <div className="mt-1" style={{ color: ts.secondaryColor }}>
                    {document.document_number || 'BROUILLON'}
                  </div>
                  <div className="text-xs mt-1" style={{ color: ts.secondaryColor }}>
                    {formatDate(document.created_at) || format(new Date(), 'd MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>
            </div>
          ) : ts.headerStyle === 'minimal' ? (
            // Minimal header - just essential info
            <div className="flex justify-between items-center">
              <div className="text-xs" style={{ color: ts.secondaryColor }}>
                {agencyInfo?.name || 'Votre agence'}
              </div>
              <div className="text-right">
                <span 
                  className="font-medium uppercase"
                  style={{ color: ts.accentColor, fontFamily: ts.headingFont }}
                >
                  {document.document_type === 'quote' ? 'Devis' : 
                   document.document_type === 'contract' ? 'Contrat' : 'Proposition'}
                </span>
                <span className="mx-2" style={{ color: ts.secondaryColor }}>|</span>
                <span style={{ color: ts.secondaryColor }}>
                  {document.document_number || 'BROUILLON'}
                </span>
              </div>
            </div>
          ) : (
            // Classic header (default)
            <>
              {ts.showLogo && agencyInfo?.logo_url ? (
                <img 
                  src={agencyInfo.logo_url} 
                  alt="Logo" 
                  className={`w-full ${getLogoSizeClass(ts.logoSize)} object-contain ${getLogoAlignClass(ts.logoPosition)} mb-4`}
                />
              ) : (
                ts.showLogo && (
                  <div 
                    className="font-bold text-2xl mb-4"
                    style={{ color: ts.primaryColor }}
                  >
                    {agencyInfo?.name || 'Votre agence'}
                  </div>
                )
              )}
              <div className="flex justify-between items-start">
                <div className="text-xs" style={{ color: ts.secondaryColor }}>
                  {agencyInfo?.address && <div>{agencyInfo.address}</div>}
                  {(agencyInfo?.postal_code || agencyInfo?.city) && (
                    <div>{agencyInfo.postal_code} {agencyInfo.city}</div>
                  )}
                  {agencyInfo?.phone && <div>Tél: {agencyInfo.phone}</div>}
                  {agencyInfo?.email && <div>{agencyInfo.email}</div>}
                </div>
                <div className="text-right">
                  <div 
                    className="font-bold uppercase"
                    style={{ color: ts.accentColor, fontFamily: ts.headingFont, fontSize: ts.headingSize }}
                  >
                    {document.document_type === 'quote' ? 'Devis' : 
                     document.document_type === 'contract' ? 'Contrat' : 'Proposition'}
                  </div>
                  <div className="mt-1" style={{ color: ts.secondaryColor }}>
                    {document.document_number || 'BROUILLON'}
                  </div>
                  <div className="text-xs mt-1" style={{ color: ts.secondaryColor }}>
                    {formatDate(document.created_at) || format(new Date(), 'd MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== CLIENT INFO ===== */}
        {document.client_company && (
          <div 
            className="mb-6 p-4 rounded"
            style={{ backgroundColor: `${ts.tableHeaderBg}60` }}
          >
            <div className="text-xs uppercase mb-1" style={{ color: ts.secondaryColor }}>Client</div>
            <div className="font-medium" style={{ color: ts.primaryColor }}>
              {document.client_company.name}
            </div>
            {document.client_contact && (
              <div className="text-sm" style={{ color: ts.secondaryColor }}>
                {document.client_contact.name}
                {document.client_contact.email && ` - ${document.client_contact.email}`}
              </div>
            )}
            {/* Billing contact if different */}
            {document.billing_contact && document.billing_contact.id !== document.client_contact?.id && (
              <div className="text-xs mt-2" style={{ color: ts.secondaryColor }}>
                <span className="uppercase">Facturation:</span> {document.billing_contact.name}
                {document.billing_contact.email && ` - ${document.billing_contact.email}`}
              </div>
            )}
          </div>
        )}

        {/* ===== PROJECT INFO ===== */}
        <div className="mb-6">
          <h2 
            className="font-semibold mb-2"
            style={{ fontFamily: ts.headingFont, fontSize: '18px', color: ts.primaryColor }}
          >
            {document.title || 'Projet sans titre'}
          </h2>
          {document.description && (
            <p style={{ color: ts.secondaryColor }}>{document.description}</p>
          )}
          
          {/* Project details grid */}
          <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: ts.secondaryColor }}>
            {document.project_address && (
              <span>📍 {document.project_address} {document.project_city} {document.postal_code}</span>
            )}
            {document.project_surface && (
              <span>📐 {document.project_surface} m²</span>
            )}
            {document.construction_budget && document.construction_budget_disclosed && (
              <span>💰 Budget travaux: {formatCurrency(document.construction_budget)}</span>
            )}
            {document.project_budget && (
              <span>💼 Budget projet: {formatCurrency(document.project_budget)}</span>
            )}
          </div>

          {/* Expected dates */}
          {(document.expected_start_date || document.expected_end_date) && (
            <div className="flex gap-4 mt-2 text-xs" style={{ color: ts.secondaryColor }}>
              {document.expected_start_date && (
                <span>🗓️ Début prévu: {formatDate(document.expected_start_date)}</span>
              )}
              {document.expected_end_date && (
                <span>📅 Fin prévue: {formatDate(document.expected_end_date)}</span>
              )}
            </div>
          )}

          {/* Reference client */}
          {document.reference_client && (
            <div className="text-xs mt-2" style={{ color: ts.secondaryColor }}>
              Réf. client: {document.reference_client}
            </div>
          )}

          {/* Public market info */}
          {document.is_public_market && (
            <div 
              className="mt-2 text-xs px-2 py-1 rounded inline-block"
              style={{ backgroundColor: `${ts.accentColor}20`, color: ts.accentColor }}
            >
              Marché public {document.market_reference && `- Réf: ${document.market_reference}`}
            </div>
          )}

          {/* Amendment indicator */}
          {document.is_amendment && (
            <div 
              className="mt-2 text-xs px-2 py-1 rounded inline-block ml-2"
              style={{ backgroundColor: `${ts.accentColor}20`, color: ts.accentColor }}
            >
              Avenant
            </div>
          )}
        </div>

        {/* ===== HEADER TEXT (custom) ===== */}
        {document.header_text && (
          <div 
            className="mb-6 text-sm whitespace-pre-wrap"
            style={{ color: ts.secondaryColor }}
          >
            {document.header_text}
          </div>
        )}

        {/* ===== FEE MODE INFO ===== */}
        {document.fee_mode && document.fee_mode !== 'fixed' && (
          <div className="mb-4 text-xs p-2 rounded" style={{ backgroundColor: `${ts.tableHeaderBg}40` }}>
            <span className="font-medium">Mode d'honoraires:</span>{' '}
            {document.fee_mode === 'percentage' && document.fee_percentage && (
              <span>{document.fee_percentage}% du budget travaux</span>
            )}
            {document.fee_mode === 'hourly' && document.hourly_rate && (
              <span>Taux horaire: {formatCurrency(document.hourly_rate)}/h</span>
            )}
            {document.fee_mode === 'mixed' && (
              <span>Honoraires mixtes</span>
            )}
          </div>
        )}

        {/* ===== LINES TABLE WITH GROUPS ===== */}
        <table className="w-full mb-6" style={{ fontSize: '11px' }}>
          <thead>
            <tr 
              className={tableBorderClass}
              style={{ 
                borderBottomWidth: 2, 
                borderColor: ts.accentColor,
              }}
            >
              <th 
                className="text-left py-2 px-1 font-medium" 
                style={{ backgroundColor: ts.tableHeaderBg, color: ts.primaryColor }}
              >
                Réf.
              </th>
              <th 
                className="text-left py-2 px-1 font-medium" 
                style={{ backgroundColor: ts.tableHeaderBg, color: ts.primaryColor }}
              >
                Désignation
              </th>
              <th 
                className="text-right py-2 px-1 font-medium w-16" 
                style={{ backgroundColor: ts.tableHeaderBg, color: ts.primaryColor }}
              >
                Qté
              </th>
              <th 
                className="text-right py-2 px-1 font-medium w-20" 
                style={{ backgroundColor: ts.tableHeaderBg, color: ts.primaryColor }}
              >
                P.U.
              </th>
              <th 
                className="text-right py-2 px-1 font-medium w-24" 
                style={{ backgroundColor: ts.tableHeaderBg, color: ts.primaryColor }}
              >
                Montant HT
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Render groups first */}
            {groups.map(group => {
              const groupLines = getGroupLines(group.id).filter(l => l.is_included);
              const groupSubtotal = getGroupSubtotal(group.id);
              
              return (
                <React.Fragment key={group.id}>
                  {/* Group header */}
                  <tr style={{ backgroundColor: ts.tableHeaderBg }}>
                    <td 
                      colSpan={5} 
                      className="py-2 px-2 font-semibold"
                      style={{ color: ts.primaryColor }}
                    >
                      {group.phase_name || 'Groupe'}
                      {group.phase_description && (
                        <span className="font-normal ml-2" style={{ color: ts.secondaryColor }}>
                          - {group.phase_description}
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Group lines */}
                  {groupLines.map((line, idx) => (
                    <tr 
                      key={line.id} 
                      className={`${tableBorderClass}`}
                      style={{ 
                        borderBottomWidth: 1,
                        borderColor: `${ts.secondaryColor}30`,
                        backgroundColor: getRowBg(idx),
                      }}
                    >
                      <td className="py-2 px-1 pl-4 align-top text-xs font-mono" style={{ color: ts.secondaryColor }}>
                        {line.pricing_ref || line.phase_code || '-'}
                      </td>
                      <td className="py-2 px-1">
                        <div className="font-medium" style={{ color: ts.primaryColor }}>
                          {line.phase_name || 'Ligne sans titre'}
                        </div>
                        {line.phase_description && (
                          <div className="text-xs mt-0.5" style={{ color: ts.secondaryColor }}>
                            {line.phase_description}
                          </div>
                        )}
                        {/* Deliverables */}
                        {line.deliverables && line.deliverables.length > 0 && (
                          <div className="text-xs mt-1" style={{ color: ts.secondaryColor }}>
                            <span className="font-medium">Livrables:</span>{' '}
                            {line.deliverables.join(', ')}
                          </div>
                        )}
                        {/* Dates if set */}
                        {(line.start_date || line.end_date) && (
                          <div className="text-xs mt-1" style={{ color: ts.secondaryColor }}>
                            {line.start_date && <span>Du {formatDate(line.start_date)}</span>}
                            {line.end_date && <span> au {formatDate(line.end_date)}</span>}
                          </div>
                        )}
                      </td>
                      <td className="text-right py-2 px-1 align-top" style={{ color: ts.primaryColor }}>
                        {line.quantity} {line.unit !== 'forfait' && line.unit}
                      </td>
                      <td className="text-right py-2 px-1 align-top" style={{ color: ts.secondaryColor }}>
                        {line.unit_price ? formatCurrency(line.unit_price) : '-'}
                      </td>
                      <td className="text-right py-2 px-1 align-top font-medium" style={{ color: ts.primaryColor }}>
                        {formatCurrency(line.amount || 0)}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Group subtotal */}
                  {groupLines.length > 0 && (
                    <tr 
                      className={tableBorderClass}
                      style={{ 
                        backgroundColor: `${ts.tableHeaderBg}80`,
                        borderBottomWidth: 1,
                        borderColor: ts.secondaryColor,
                      }}
                    >
                      <td colSpan={4} className="py-1.5 px-2 text-right text-xs font-medium" style={{ color: ts.secondaryColor }}>
                        Sous-total {group.phase_name}
                      </td>
                      <td className="text-right py-1.5 px-1 font-semibold" style={{ color: ts.primaryColor }}>
                        {formatCurrency(groupSubtotal)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Ungrouped lines */}
            {ungroupedLines.filter(l => l.is_included).map((line, idx) => (
              <tr 
                key={line.id} 
                className={tableBorderClass}
                style={{ 
                  borderBottomWidth: 1,
                  borderColor: `${ts.secondaryColor}30`,
                  backgroundColor: getRowBg(idx),
                }}
              >
                <td className="py-2 px-1 align-top text-xs font-mono" style={{ color: ts.secondaryColor }}>
                  {line.pricing_ref || line.phase_code || '-'}
                </td>
                <td className="py-2 px-1">
                  <div className="font-medium" style={{ color: ts.primaryColor }}>
                    {line.phase_name || 'Ligne sans titre'}
                  </div>
                  {line.phase_description && (
                    <div className="text-xs mt-0.5" style={{ color: ts.secondaryColor }}>
                      {line.phase_description}
                    </div>
                  )}
                  {/* Deliverables */}
                  {line.deliverables && line.deliverables.length > 0 && (
                    <div className="text-xs mt-1" style={{ color: ts.secondaryColor }}>
                      <span className="font-medium">Livrables:</span>{' '}
                      {line.deliverables.join(', ')}
                    </div>
                  )}
                  {/* Dates if set */}
                  {(line.start_date || line.end_date) && (
                    <div className="text-xs mt-1" style={{ color: ts.secondaryColor }}>
                      {line.start_date && <span>Du {formatDate(line.start_date)}</span>}
                      {line.end_date && <span> au {formatDate(line.end_date)}</span>}
                    </div>
                  )}
                </td>
                <td className="text-right py-2 px-1 align-top" style={{ color: ts.primaryColor }}>
                  {line.quantity} {line.unit !== 'forfait' && line.unit}
                </td>
                <td className="text-right py-2 px-1 align-top" style={{ color: ts.secondaryColor }}>
                  {line.unit_price ? formatCurrency(line.unit_price) : '-'}
                </td>
                <td className="text-right py-2 px-1 align-top font-medium" style={{ color: ts.primaryColor }}>
                  {formatCurrency(line.amount || 0)}
                </td>
              </tr>
            ))}

            {/* Discount lines */}
            {discountLines.length > 0 && discountLines.map((line) => (
              <tr 
                key={line.id}
                className={tableBorderClass}
                style={{ 
                  borderBottomWidth: 1,
                  borderColor: `${ts.secondaryColor}30`,
                }}
              >
                <td className="py-2 px-1 align-top text-xs font-mono" style={{ color: ts.secondaryColor }}>
                  {line.pricing_ref || '-'}
                </td>
                <td className="py-2 px-1" style={{ color: '#dc2626' }}>
                  <div className="font-medium">{line.phase_name || 'Remise'}</div>
                  {line.phase_description && (
                    <div className="text-xs mt-0.5">{line.phase_description}</div>
                  )}
                </td>
                <td className="text-right py-2 px-1 align-top" style={{ color: '#dc2626' }}>
                  {line.quantity !== 1 && `${line.quantity}`}
                </td>
                <td className="text-right py-2 px-1 align-top" style={{ color: '#dc2626' }}>
                  {line.percentage_fee ? `-${line.percentage_fee}%` : ''}
                </td>
                <td className="text-right py-2 px-1 align-top font-medium" style={{ color: '#dc2626' }}>
                  -{formatCurrency(Math.abs(line.amount || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== OPTIONAL ITEMS ===== */}
        {optionalItems.length > 0 && (
          <div className="mb-6">
            <div className="text-xs uppercase mb-2" style={{ color: ts.secondaryColor }}>
              Options (non incluses dans le total)
            </div>
            <table className="w-full" style={{ fontSize: '11px' }}>
              <tbody>
                {optionalItems.map((line) => (
                  <tr 
                    key={line.id} 
                    className="border-b border-dashed"
                    style={{ borderColor: `${ts.secondaryColor}40` }}
                  >
                    <td className="py-1.5 text-xs font-mono" style={{ color: ts.secondaryColor }}>
                      {line.pricing_ref || line.phase_code || '-'}
                    </td>
                    <td className="py-1.5" style={{ color: ts.secondaryColor }}>
                      {line.phase_name}
                      {line.phase_description && (
                        <span className="text-xs ml-2">- {line.phase_description}</span>
                      )}
                    </td>
                    <td className="text-right py-1.5" style={{ color: ts.secondaryColor }}>
                      {formatCurrency(line.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== TOTALS ===== */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            {totalDiscount > 0 && (
              <>
                <div className="flex justify-between py-1" style={{ color: ts.secondaryColor }}>
                  <span>Sous-total</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-1" style={{ color: '#dc2626' }}>
                  <span>Remise</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-1" style={{ color: ts.primaryColor }}>
              <span>Total HT</span>
              <span className="font-medium">{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between py-1" style={{ color: ts.secondaryColor }}>
              <span>TVA ({vatRate}%)</span>
              <span>{formatCurrency(tva)}</span>
            </div>
            <div 
              className="flex justify-between py-2 mt-1"
              style={{ borderTopWidth: 2, borderColor: ts.primaryColor }}
            >
              <span className="font-bold" style={{ color: ts.primaryColor }}>Total TTC</span>
              <span className="font-bold text-lg" style={{ color: ts.accentColor }}>
                {formatCurrency(totalTTC)}
              </span>
            </div>

            {/* Deposit info */}
            {document.requires_deposit && document.deposit_percentage && (
              <div className="mt-2 pt-2 border-t" style={{ borderColor: `${ts.secondaryColor}40` }}>
                <div className="flex justify-between text-sm" style={{ color: ts.accentColor }}>
                  <span>Acompte à la commande ({document.deposit_percentage}%)</span>
                  <span className="font-medium">
                    {formatCurrency(totalTTC * (document.deposit_percentage / 100))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== PAYMENT TERMS ===== */}
        {document.payment_terms && (
          <div className="mb-4">
            <div className="text-xs font-medium mb-1" style={{ color: ts.primaryColor }}>
              Conditions de paiement
            </div>
            <div className="text-xs whitespace-pre-wrap" style={{ color: ts.secondaryColor }}>
              {document.payment_terms}
            </div>
          </div>
        )}

        {/* ===== SPECIAL CONDITIONS ===== */}
        {document.special_conditions && (
          <div className="mb-4">
            <div className="text-xs font-medium mb-1" style={{ color: ts.primaryColor }}>
              Conditions particulières
            </div>
            <div className="text-xs whitespace-pre-wrap" style={{ color: ts.secondaryColor }}>
              {document.special_conditions}
            </div>
          </div>
        )}

        {/* ===== GENERAL CONDITIONS ===== */}
        {document.general_conditions && (
          <div className="mb-4">
            <div className="text-xs font-medium mb-1" style={{ color: ts.primaryColor }}>
              Conditions générales
            </div>
            <div className="text-xs whitespace-pre-wrap" style={{ color: ts.secondaryColor }}>
              {document.general_conditions}
            </div>
          </div>
        )}

        {/* ===== FOOTER TEXT (custom) ===== */}
        {document.footer_text && (
          <div 
            className="mb-6 text-xs whitespace-pre-wrap"
            style={{ color: ts.secondaryColor }}
          >
            {document.footer_text}
          </div>
        )}

        {/* ===== VALIDITY ===== */}
        <div className="text-xs mb-8" style={{ color: ts.secondaryColor }}>
          {document.validity_days && (
            <span>Ce devis est valable {document.validity_days} jours</span>
          )}
          {document.valid_until && (
            <span> (jusqu'au {formatDate(document.valid_until)})</span>
          )}
          {document.expected_signature_date && (
            <span>. Signature attendue pour le {formatDate(document.expected_signature_date)}</span>
          )}
          .
        </div>

        {/* ===== SIGNATURE AREA ===== */}
        {ts.showSignatureArea && (
          <div className="flex justify-between items-end mt-12">
            <div style={{ color: ts.secondaryColor }}>
              <div className="text-xs">Date et signature du client</div>
              <div className="text-xs mt-1">Précédé de la mention "Bon pour accord"</div>
              <div 
                className="w-48 mt-8"
                style={{ borderBottomWidth: 1, borderColor: ts.secondaryColor }}
              />
            </div>
            {agencyInfo?.signature_url && (
              <div>
                <img src={agencyInfo.signature_url} alt="Signature" className="h-16 object-contain" />
              </div>
            )}
          </div>
        )}

        {/* ===== FOOTER ===== */}
        {ts.footerStyle !== 'minimal' && (
          <div 
            className="mt-8 pt-4 text-center"
            style={{ 
              borderTopWidth: 1, 
              borderColor: `${ts.secondaryColor}40`,
              fontSize: ts.footerStyle === 'detailed' ? '10px' : '9px',
              color: ts.secondaryColor,
            }}
          >
            {agencyInfo?.name}
            {ts.footerStyle === 'detailed' && agencyInfo?.address && (
              <span> - {agencyInfo.address} {agencyInfo.postal_code} {agencyInfo.city}</span>
            )}
            {agencyInfo?.siret && <span> - SIRET: {agencyInfo.siret}</span>}
            {agencyInfo?.vat_number && <span> - TVA: {agencyInfo.vat_number}</span>}
            {ts.footerStyle === 'detailed' && agencyInfo?.capital_social && (
              <span> - Capital: {formatCurrency(agencyInfo.capital_social)}</span>
            )}
            {ts.footerStyle === 'detailed' && agencyInfo?.rcs_city && (
              <span> - RCS {agencyInfo.rcs_city}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
