import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';
import { useQuoteThemes } from '@/hooks/useQuoteThemes';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { generateQuoteHtml } from '@/lib/generateHtmlPDF';
import { AgencyInfo } from '@/lib/quoteTemplateVariables';

interface QuotePreviewPanelProps {
  document: Partial<QuoteDocument>;
  lines: QuoteLine[];
  zoom: number;
  selectedThemeId?: string | null;
}

// A4 dimensions (210×297mm @ 96dpi)
// Keep the internal "paper" size fixed and scale it with CSS transform,
// otherwise the iframe will show its own scrollbars/cropping.
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

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
    
    const observer = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [updateContainerWidth]);

  // Calculate scale to fit the preview column width (no horizontal scroll at 100%)
  const padding = 24;
  const availableWidth = Math.max(0, containerWidth - padding * 2);

  // Fit-to-width scale, then apply user zoom on top
  const fitScale = availableWidth > 0 ? availableWidth / A4_WIDTH_PX : 0.5;
  const zoomFactor = zoom / 100;
  const scale = Math.max(0.1, fitScale * zoomFactor);

  // Wrapper uses the scaled size so outer scroll is handled by our container (not the iframe)
  const scaledWidth = Math.floor(A4_WIDTH_PX * scale);
  const scaledHeight = Math.floor(A4_HEIGHT_PX * scale);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center overflow-y-auto overflow-x-hidden bg-muted/30"
      style={{ padding }}
    >
      {/* Wrapper with scaled dimensions */}
      <div className="flex-shrink-0" style={{ width: scaledWidth, height: scaledHeight }}>
        {/* Fixed-size A4 paper scaled down/up */}
        <div
          className="bg-white shadow-xl rounded-sm origin-top-left overflow-hidden"
          style={{
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            ref={iframeRef}
            title="Aperçu du devis"
            scrolling="no"
            className="border-0 block"
            style={{
              width: A4_WIDTH_PX,
              height: A4_HEIGHT_PX,
              background: 'white',
              overflow: 'hidden',
            }}
          />
        </div>
      </div>
    </div>
  );
}

