/**
 * Factur-X / ZUGFeRD XML Generation
 * Generates compliant e-invoicing XML for French 2026 reform
 */

import { Invoice, InvoiceItem } from '@/hooks/useInvoices';

export interface FacturXAgencyInfo {
  name: string;
  siret: string;
  vatNumber?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email?: string;
  phone?: string;
  rcsCity?: string;
  capitalSocial?: number;
  legalForm?: string;
  bankName?: string;
  iban?: string;
  bic?: string;
}

export interface FacturXOptions {
  profile?: 'MINIMUM' | 'BASIC' | 'EN16931' | 'EXTENDED';
  language?: string;
}

// Generate Factur-X compliant XML (EN 16931 profile)
export function generateFacturXXML(
  invoice: Invoice,
  items: InvoiceItem[],
  agencyInfo: FacturXAgencyInfo,
  options: FacturXOptions = {}
): string {
  const { profile = 'EN16931', language = 'fr' } = options;
  const now = new Date();
  
  // Document type code
  const typeCode = invoice.invoice_type === 'credit_note' ? '381' : '380';
  
  // Format dates
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  };

  // Generate unique ID
  const generateGUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Escape XML entities
  const escapeXML = (str: string | undefined | null): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Format amount with 2 decimals
  const formatAmount = (amount: number | undefined | null): string => {
    return (amount || 0).toFixed(2);
  };

  // Calculate totals by VAT rate
  const vatBreakdown = items.reduce((acc, item) => {
    const rate = item.tva_rate || 20;
    if (!acc[rate]) {
      acc[rate] = { basisAmount: 0, vatAmount: 0 };
    }
    acc[rate].basisAmount += item.amount_ht || 0;
    acc[rate].vatAmount += item.amount_tva || 0;
    return acc;
  }, {} as Record<number, { basisAmount: number; vatAmount: number }>);

  // Build line items XML
  const lineItemsXML = items.map((item, index) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${index + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        ${item.code ? `<ram:SellerAssignedID>${escapeXML(item.code)}</ram:SellerAssignedID>` : ''}
        <ram:Name>${escapeXML(item.description)}</ram:Name>
        ${item.detailed_description ? `<ram:Description>${escapeXML(item.detailed_description)}</ram:Description>` : ''}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatAmount(item.unit_price)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${item.unit === 'heure' ? 'HUR' : item.unit === 'jour' ? 'DAY' : 'C62'}">${item.quantity || 1}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${item.tva_rate || 20}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatAmount(item.amount_ht)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`).join('');

  // Build VAT breakdown XML
  const vatBreakdownXML = Object.entries(vatBreakdown).map(([rate, { basisAmount, vatAmount }]) => `
    <ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${formatAmount(vatAmount)}</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:BasisAmount>${formatAmount(basisAmount)}</ram:BasisAmount>
      <ram:CategoryCode>S</ram:CategoryCode>
      <ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`).join('');

  // Payment means code
  const paymentMeansCode = {
    'virement': '30',
    'cheque': '20',
    'carte': '48',
    'prelevement': '59',
    'especes': '10',
  }[invoice.payment_method || 'virement'] || '30';

  // Generate the Factur-X XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice 
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  
  <!-- Context -->
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:${profile.toLowerCase()}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  
  <!-- Document Header -->
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXML(invoice.invoice_number)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDate(invoice.invoice_date)}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:LanguageID>${language}</ram:LanguageID>
    ${invoice.notes ? `<ram:IncludedNote>
      <ram:Content>${escapeXML(invoice.notes)}</ram:Content>
    </ram:IncludedNote>` : ''}
  </rsm:ExchangedDocument>
  
  <!-- Supply Chain Trade Transaction -->
  <rsm:SupplyChainTradeTransaction>
    <!-- Header Trade Agreement -->
    <ram:ApplicableHeaderTradeAgreement>
      <!-- Seller (Agency) -->
      <ram:SellerTradeParty>
        <ram:Name>${escapeXML(agencyInfo.name)}</ram:Name>
        ${agencyInfo.legalForm ? `<ram:Description>${escapeXML(agencyInfo.legalForm)}</ram:Description>` : ''}
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXML(agencyInfo.siret)}</ram:ID>
          ${agencyInfo.rcsCity ? `<ram:TradingBusinessName>RCS ${escapeXML(agencyInfo.rcsCity)}</ram:TradingBusinessName>` : ''}
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXML(agencyInfo.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXML(agencyInfo.address)}</ram:LineOne>
          <ram:CityName>${escapeXML(agencyInfo.city)}</ram:CityName>
          <ram:CountryID>${agencyInfo.country === 'France' ? 'FR' : escapeXML(agencyInfo.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${agencyInfo.email ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${escapeXML(agencyInfo.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ''}
        ${agencyInfo.vatNumber ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXML(agencyInfo.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      
      <!-- Buyer (Client) -->
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXML(invoice.client_name)}</ram:Name>
        ${invoice.client_siret ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXML(invoice.client_siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>
          ${invoice.client_postal_code ? `<ram:PostcodeCode>${escapeXML(invoice.client_postal_code)}</ram:PostcodeCode>` : ''}
          ${invoice.client_address ? `<ram:LineOne>${escapeXML(invoice.client_address)}</ram:LineOne>` : ''}
          ${invoice.client_city ? `<ram:CityName>${escapeXML(invoice.client_city)}</ram:CityName>` : ''}
          <ram:CountryID>${invoice.client_country === 'France' || !invoice.client_country ? 'FR' : escapeXML(invoice.client_country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${invoice.client_vat_number ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXML(invoice.client_vat_number)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    
    <!-- Header Trade Delivery -->
    <ram:ApplicableHeaderTradeDelivery/>
    
    <!-- Header Trade Settlement -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${invoice.currency || 'EUR'}</ram:InvoiceCurrencyCode>
      
      <!-- Payment Means -->
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>${paymentMeansCode}</ram:TypeCode>
        ${agencyInfo.iban ? `<ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${escapeXML(agencyInfo.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>` : ''}
        ${agencyInfo.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${escapeXML(agencyInfo.bic)}</ram:BICID>
          ${agencyInfo.bankName ? `<ram:Name>${escapeXML(agencyInfo.bankName)}</ram:Name>` : ''}
        </ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>
      
      <!-- VAT Breakdown -->
      ${vatBreakdownXML}
      
      <!-- Payment Terms -->
      ${invoice.due_date ? `<ram:SpecifiedTradePaymentTerms>
        ${invoice.payment_terms ? `<ram:Description>${escapeXML(invoice.payment_terms)}</ram:Description>` : ''}
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formatDate(invoice.due_date)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>` : ''}
      
      <!-- Monetary Summation -->
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${formatAmount(invoice.subtotal_ht)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${formatAmount(invoice.subtotal_ht)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${invoice.currency || 'EUR'}">${formatAmount(invoice.tva_amount)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${formatAmount(invoice.total_ttc)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${formatAmount(invoice.amount_due)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
    
    <!-- Line Items -->
    ${lineItemsXML}
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
}

// Validate Factur-X XML structure (basic validation)
export function validateFacturXXML(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required elements
  const requiredElements = [
    'rsm:CrossIndustryInvoice',
    'rsm:ExchangedDocumentContext',
    'rsm:ExchangedDocument',
    'ram:ID',
    'ram:TypeCode',
    'ram:SellerTradeParty',
    'ram:BuyerTradeParty',
    'ram:GrandTotalAmount',
  ];

  requiredElements.forEach(element => {
    const tagName = element.split(':')[1];
    if (!xml.includes(`<${element}`) && !xml.includes(`<${tagName}`)) {
      errors.push(`Élément requis manquant: ${element}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get Factur-X profile description
export function getFacturXProfileDescription(profile: string): string {
  const profiles: Record<string, string> = {
    'MINIMUM': 'Profil Minimum - Informations essentielles uniquement',
    'BASIC': 'Profil Basic - Informations de base pour la comptabilité',
    'EN16931': 'Profil EN 16931 - Conforme à la norme européenne (recommandé)',
    'EXTENDED': 'Profil Extended - Toutes les informations détaillées',
  };
  return profiles[profile] || 'Profil inconnu';
}

// Export XML as downloadable file
export function downloadFacturXXML(xml: string, filename: string): void {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xml') ? filename : `${filename}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
