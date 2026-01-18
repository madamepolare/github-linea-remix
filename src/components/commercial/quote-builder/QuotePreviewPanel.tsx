import React, { useMemo, useRef, useEffect } from 'react';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { useQuoteThemes, QuoteTheme } from '@/hooks/useQuoteThemes';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { generateQuoteHtml } from '@/lib/generateHtmlPDF';
import { AgencyInfo } from '@/lib/quoteTemplateVariables';

interface QuotePreviewPanelProps {
  document: Partial<QuoteDocument>;
  lines: QuoteLine[];
  zoom: number;
  selectedThemeId?: string | null;
}

/**
 * QuotePreviewPanel - 100% HTML Rendering
 * 
 * Ce composant affiche l'aperçu du devis via un iframe HTML.
 * Le même HTML est utilisé pour l'impression PDF native.
 * Le thème sélectionné contrôle le design (couleurs, polices, mise en page).
 */
export function QuotePreviewPanel({ document, lines, zoom, selectedThemeId }: QuotePreviewPanelProps) {
  const { agencyInfo } = useAgencyInfo();
  const { themes } = useQuoteThemes();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Get selected theme or default
  const currentTheme = selectedThemeId 
    ? themes.find(t => t.id === selectedThemeId)
    : themes.find(t => t.is_default);

  // Generate HTML preview with theme
  const htmlPreview = useMemo(() => {
    const agencyData: AgencyInfo = {
      name: agencyInfo?.name,
      logo_url: agencyInfo?.logo_url,
      address: agencyInfo?.address,
      city: agencyInfo?.city,
      postal_code: agencyInfo?.postal_code,
      phone: agencyInfo?.phone,
      email: agencyInfo?.email,
      website: agencyInfo?.website,
      siret: agencyInfo?.siret,
      siren: agencyInfo?.siren,
      vat_number: agencyInfo?.vat_number,
      capital_social: agencyInfo?.capital_social,
      forme_juridique: agencyInfo?.forme_juridique,
      rcs_city: agencyInfo?.rcs_city,
      code_naf: agencyInfo?.code_naf,
    };
    
    return generateQuoteHtml(document, lines, agencyData, currentTheme);
  }, [currentTheme, document, lines, agencyInfo]);

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current && htmlPreview) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlPreview);
        doc.close();
      }
    }
  }, [htmlPreview]);

  const scale = zoom / 100;
  
  return (
    <div 
      className="bg-white shadow-lg rounded-lg overflow-hidden origin-top w-full"
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        width: '210mm',
        minHeight: '297mm',
      }}
    >
      <iframe
        ref={iframeRef}
        className="w-full border-0"
        style={{ 
          width: '210mm',
          minHeight: '297mm', 
          height: '100%',
          background: 'white'
        }}
        title="Aperçu du devis"
      />
    </div>
  );
}

/**
 * Exporte la fonction pour générer le HTML (utilisé par QuoteBuilder pour l'impression)
 */
export { generateQuoteHtml } from '@/lib/generateHtmlPDF';
