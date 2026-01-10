import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { QuoteDocument, QuoteLine, LINE_TYPE_LABELS } from '@/types/quoteTypes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuotePreviewPanelProps {
  document: Partial<QuoteDocument>;
  lines: QuoteLine[];
  zoom: number;
}

export function QuotePreviewPanel({ document, lines, zoom }: QuotePreviewPanelProps) {
  const { agencyInfo } = useAgencyInfo();

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

  // Calculate totals
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
  const discountLines = lines.filter(l => l.line_type === 'discount');
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  const scale = zoom / 100;

  return (
    <div 
      className="bg-white shadow-lg rounded-lg overflow-hidden origin-top-left"
      style={{ 
        transform: `scale(${scale})`,
        width: `${100 / scale}%`,
        minHeight: '297mm'
      }}
    >
      {/* Page content */}
      <div className="p-8 text-sm text-gray-800" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {agencyInfo?.logo_url ? (
              <img src={agencyInfo.logo_url} alt="Logo" className="h-12 object-contain" />
            ) : (
              <div className="font-bold text-xl text-gray-900">
                {agencyInfo?.name || 'Votre agence'}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              {agencyInfo?.address && <div>{agencyInfo.address}</div>}
              {(agencyInfo?.postal_code || agencyInfo?.city) && (
                <div>{agencyInfo.postal_code} {agencyInfo.city}</div>
              )}
              {agencyInfo?.phone && <div>Tél: {agencyInfo.phone}</div>}
              {agencyInfo?.email && <div>{agencyInfo.email}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 uppercase">
              {document.document_type === 'quote' ? 'Devis' : 
               document.document_type === 'contract' ? 'Contrat' : 'Proposition'}
            </div>
            <div className="text-gray-500 mt-1">
              {document.document_number || 'BROUILLON'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(document.created_at) || format(new Date(), 'd MMMM yyyy', { locale: fr })}
            </div>
          </div>
        </div>

        {/* Client info */}
        {document.client_company && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <div className="text-xs text-gray-500 uppercase mb-1">Client</div>
            <div className="font-medium">{document.client_company.name}</div>
            {document.client_contact && (
              <div className="text-sm text-gray-600">
                {document.client_contact.name}
                {document.client_contact.email && ` - ${document.client_contact.email}`}
              </div>
            )}
          </div>
        )}

        {/* Project info */}
        <div className="mb-6">
          <h2 className="font-semibold text-lg mb-2">{document.title || 'Projet sans titre'}</h2>
          {document.description && (
            <p className="text-gray-600 text-sm">{document.description}</p>
          )}
          <div className="flex gap-6 mt-3 text-xs text-gray-500">
            {document.project_address && (
              <span>📍 {document.project_address} {document.project_city}</span>
            )}
            {document.project_surface && (
              <span>📐 {document.project_surface} m²</span>
            )}
            {document.construction_budget && (
              <span>💰 Budget travaux: {formatCurrency(document.construction_budget)}</span>
            )}
          </div>
        </div>

        {/* Lines table */}
        <table className="w-full mb-6" style={{ fontSize: '11px' }}>
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 font-medium">Désignation</th>
              <th className="text-right py-2 font-medium w-20">Qté</th>
              <th className="text-right py-2 font-medium w-24">P.U.</th>
              <th className="text-right py-2 font-medium w-28">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {lines.filter(l => l.is_included).map((line, index) => (
              <tr key={line.id} className="border-b border-gray-100">
                <td className="py-2">
                  <div className="flex items-start gap-2">
                    {line.phase_code && (
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                        {line.phase_code}
                      </span>
                    )}
                    <div>
                      <div className="font-medium">{line.phase_name || 'Ligne sans titre'}</div>
                      {line.phase_description && (
                        <div className="text-xs text-gray-500 mt-0.5">{line.phase_description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-right py-2 align-top">
                  {line.quantity} {line.unit !== 'forfait' && line.unit}
                </td>
                <td className="text-right py-2 align-top">
                  {line.unit_price ? formatCurrency(line.unit_price) : '-'}
                </td>
                <td className="text-right py-2 align-top font-medium">
                  {formatCurrency(line.amount || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Optional items */}
        {lines.filter(l => !l.is_included && l.line_type !== 'discount').length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase mb-2">Options (non incluses)</div>
            <table className="w-full" style={{ fontSize: '11px' }}>
              <tbody>
                {lines.filter(l => !l.is_included && l.line_type !== 'discount').map((line) => (
                  <tr key={line.id} className="border-b border-dashed border-gray-200">
                    <td className="py-1.5 text-gray-500">
                      {line.phase_name}
                    </td>
                    <td className="text-right py-1.5 text-gray-500">
                      {formatCurrency(line.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-1 text-sm">
              <span>Total HT</span>
              <span className="font-medium">{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm text-gray-500">
              <span>TVA (20%)</span>
              <span>{formatCurrency(tva)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-1">
              <span className="font-bold">Total TTC</span>
              <span className="font-bold text-lg">{formatCurrency(totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {document.payment_terms && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-1">Conditions de paiement</div>
            <div className="text-xs text-gray-600">{document.payment_terms}</div>
          </div>
        )}

        {/* Validity */}
        <div className="text-xs text-gray-500 mb-8">
          {document.validity_days && (
            <span>Ce devis est valable {document.validity_days} jours.</span>
          )}
        </div>

        {/* Signature */}
        <div className="flex justify-between items-end mt-12">
          <div className="text-xs text-gray-500">
            <div>Date et signature du client</div>
            <div className="text-xs mt-1">Précédé de la mention "Bon pour accord"</div>
            <div className="border-b border-gray-300 w-48 mt-8"></div>
          </div>
          {agencyInfo?.signature_url && (
            <div>
              <img src={agencyInfo.signature_url} alt="Signature" className="h-16 object-contain" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-[9px] text-gray-400 text-center">
          {agencyInfo?.name} - {agencyInfo?.siret && `SIRET: ${agencyInfo.siret}`}
          {agencyInfo?.vat_number && ` - TVA: ${agencyInfo.vat_number}`}
        </div>
      </div>
    </div>
  );
}
