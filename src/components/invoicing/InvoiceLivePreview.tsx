import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InvoiceItem } from '@/hooks/useInvoices';

interface AgencyInfo {
  name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  siret?: string;
  vat_number?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
}

interface InvoiceLivePreviewProps {
  formData: {
    invoice_type: string;
    client_name: string;
    client_address: string;
    client_city: string;
    client_postal_code: string;
    client_siret?: string;
    client_vat_number?: string;
    project_name?: string;
    invoice_date: string;
    due_date: string;
    payment_terms?: string;
    bank_name?: string;
    bank_iban?: string;
    bank_bic?: string;
    header_text?: string;
    footer_text?: string;
    notes?: string;
  };
  items: Partial<InvoiceItem>[];
  totals: {
    subtotalHt: number;
    totalTva: number;
    totalTtc: number;
  };
  agencyInfo?: AgencyInfo | null;
}

const TYPE_TITLES: Record<string, string> = {
  standard: 'FACTURE',
  credit_note: 'AVOIR',
  proforma: 'FACTURE PROFORMA',
  deposit: 'FACTURE D\'ACOMPTE',
};

export function InvoiceLivePreview({ formData, items, totals, agencyInfo }: InvoiceLivePreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white text-black rounded-lg shadow-lg p-8 min-h-[800px] text-sm" style={{ aspectRatio: '210/297' }}>
      {/* Header */}
      <div className="flex justify-between mb-8">
        {/* Agency Info */}
        <div className="space-y-1">
          {agencyInfo?.logo_url ? (
            <img src={agencyInfo.logo_url} alt="Logo" className="h-12 mb-2" />
          ) : null}
          <p className="font-bold text-base">{agencyInfo?.name || 'VOTRE AGENCE'}</p>
          <p className="text-gray-600 text-xs">{agencyInfo?.address}</p>
          <p className="text-gray-600 text-xs">{agencyInfo?.postal_code} {agencyInfo?.city}</p>
          {agencyInfo?.siret && <p className="text-gray-600 text-xs">SIRET: {agencyInfo.siret}</p>}
          {agencyInfo?.vat_number && <p className="text-gray-600 text-xs">TVA: {agencyInfo.vat_number}</p>}
        </div>

        {/* Invoice Title */}
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {TYPE_TITLES[formData.invoice_type] || 'FACTURE'}
          </h1>
          <p className="text-gray-500 text-xs">N° [Auto-généré]</p>
        </div>
      </div>

      {/* Client & Dates */}
      <div className="flex justify-between mb-8">
        {/* Client Box */}
        <div className="bg-gray-50 rounded-lg p-4 w-[45%]">
          <p className="text-xs text-gray-500 uppercase mb-2">Facturé à</p>
          <p className="font-semibold">{formData.client_name || 'Client'}</p>
          <p className="text-xs text-gray-600">{formData.client_address}</p>
          <p className="text-xs text-gray-600">{formData.client_postal_code} {formData.client_city}</p>
          {formData.client_siret && <p className="text-xs text-gray-600 mt-1">SIRET: {formData.client_siret}</p>}
          {formData.client_vat_number && <p className="text-xs text-gray-600">TVA: {formData.client_vat_number}</p>}
        </div>

        {/* Dates */}
        <div className="text-right space-y-1">
          <p className="text-xs">
            <span className="text-gray-500">Date : </span>
            <span className="font-medium">{formatDate(formData.invoice_date)}</span>
          </p>
          <p className="text-xs">
            <span className="text-gray-500">Échéance : </span>
            <span className="font-medium">{formatDate(formData.due_date)}</span>
          </p>
          {formData.project_name && (
            <p className="text-xs mt-2">
              <span className="text-gray-500">Projet : </span>
              <span className="font-medium">{formData.project_name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Header Text */}
      {formData.header_text && (
        <p className="text-xs text-gray-600 mb-4">{formData.header_text}</p>
      )}

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left p-2 rounded-tl-lg">Code</th>
              <th className="text-left p-2">Description</th>
              <th className="text-right p-2">Qté</th>
              <th className="text-right p-2">P.U. HT</th>
              <th className="text-right p-2">TVA</th>
              <th className="text-right p-2 rounded-tr-lg">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {items.filter(item => item.description).map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-2 text-gray-600">{item.code || '-'}</td>
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                <td className="p-2 text-right">{formatCurrency(item.unit_price || 0)}</td>
                <td className="p-2 text-right">{item.tva_rate}%</td>
                <td className="p-2 text-right font-medium">{formatCurrency(item.amount_ht || 0)}</td>
              </tr>
            ))}
            {items.filter(item => item.description).length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  Aucune ligne de facturation
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-[250px] space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Total HT</span>
            <span className="font-medium">{formatCurrency(totals.subtotalHt)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">TVA</span>
            <span className="font-medium">{formatCurrency(totals.totalTva)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2 mt-2">
            <span>Total TTC</span>
            <span>{formatCurrency(totals.totalTtc)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {formData.notes && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-600">{formData.notes}</p>
        </div>
      )}

      {/* Payment Terms */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-1">Conditions de paiement</p>
        <p className="text-xs text-gray-600">{formData.payment_terms || 'Paiement à 30 jours.'}</p>
      </div>

      {/* Bank Details */}
      {(formData.bank_iban || formData.bank_bic) && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">Coordonnées bancaires</p>
          {formData.bank_name && <p className="text-xs text-gray-600">Banque : {formData.bank_name}</p>}
          {formData.bank_iban && <p className="text-xs text-gray-600">IBAN : {formData.bank_iban}</p>}
          {formData.bank_bic && <p className="text-xs text-gray-600">BIC : {formData.bank_bic}</p>}
        </div>
      )}

      {/* Footer */}
      {formData.footer_text && (
        <p className="text-xs text-gray-500 text-center mt-auto pt-4 border-t">{formData.footer_text}</p>
      )}
    </div>
  );
}
