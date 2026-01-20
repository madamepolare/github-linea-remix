import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate Vector PDF via Browserless Chromium
 * 
 * Uses Browserless.io's Chrome API to render HTML to a true vector PDF.
 * This produces the same quality as Chrome's native print-to-PDF.
 */
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

    const apiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Browserless API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PDF-Chromium] Generating PDF via Browserless...');
    console.log('[PDF-Chromium] HTML length:', html.length);

    // Browserless PDF API - uses Chrome's native PDF rendering
    // Docs: https://docs.browserless.io/docs/pdf
    const response = await fetch(`https://chrome.browserless.io/pdf?token=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
        options: {
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0',
          },
        },
        gotoOptions: {
          waitUntil: 'networkidle2',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDF-Chromium] Browserless error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'PDF generation failed', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PDF as binary
    const pdfBuffer = await response.arrayBuffer();
    console.log('[PDF-Chromium] PDF generated, size:', pdfBuffer.byteLength);

    // Convert to base64 in chunks to avoid stack overflow
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
    console.error('[PDF-Chromium] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
