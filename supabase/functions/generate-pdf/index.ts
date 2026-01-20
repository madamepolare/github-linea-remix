import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, filename } = await req.json();

    if (!html) {
      return new Response(
        JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('PDFSHIFT_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'PDFShift API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call PDFShift API
    // Docs: https://docs.pdfshift.io/api-reference/convert-to-pdf
    // NOTE: PDFShift v3 does NOT support `print_background` nor `prefer_css_page_size`.
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        // PDFShift supports both X-API-Key and Basic auth. X-API-Key is simplest.
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: html,
        format: 'A4',
        use_print: true,
        disable_backgrounds: false,
        margin: 0,
        // Force viewport to exact A4 pixel width (794px at 96dpi)
        // This ensures the browser renders at the same width as the preview
        viewport: { width: 794, height: 1123 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDFShift error:', errorText);
      return new Response(
        JSON.stringify({ error: 'PDF generation failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PDF as base64 - use chunked approach to avoid stack overflow
    const pdfBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(pdfBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const pdfBase64 = btoa(binary);

    return new Response(
      JSON.stringify({ 
        pdf: pdfBase64,
        filename: filename || 'document.pdf'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
