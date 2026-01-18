import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
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

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_RATIO = A4_HEIGHT_MM / A4_WIDTH_MM;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
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

  // Measure container width for proper scaling
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerWidth(rect.width);
    }
  }, []);

  useEffect(() => {
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, [updateContainerWidth]);

  // Calculate scale based on container width and zoom
  // A4 width is 210mm ≈ 794px at 96dpi
  const A4_WIDTH_PX = 794;
  const padding = 48; // 24px padding on each side
  const availableWidth = containerWidth - padding;
  const baseScale = availableWidth > 0 ? availableWidth / A4_WIDTH_PX : 0.6;
  const scale = baseScale * (zoom / 100);
  
  // Calculate the height needed for the scaled content
  const scaledHeight = A4_WIDTH_PX * A4_RATIO * scale;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex justify-center items-start p-6 overflow-auto bg-muted/30"
    >
      <div 
        className="bg-white shadow-xl rounded-sm flex-shrink-0"
        style={{ 
          width: A4_WIDTH_PX,
          height: A4_WIDTH_PX * A4_RATIO,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <iframe
          ref={iframeRef}
          className="border-0 block"
          style={{ 
            width: A4_WIDTH_PX,
            height: A4_WIDTH_PX * A4_RATIO, 
            background: 'white',
          }}
          title="Aperçu du devis"
        />
      </div>
    </div>
  );
}

/**
 * Exporte la fonction pour générer le HTML (utilisé par QuoteBuilder pour l'impression)
 */
export { generateQuoteHtml } from '@/lib/generateHtmlPDF';
