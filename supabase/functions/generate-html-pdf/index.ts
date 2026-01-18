import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, filename = 'document.pdf' } = await req.json();

    if (!html) {
      return new Response(
        JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI Gateway to generate PDF from HTML
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      // Fallback: return HTML that can be printed client-side
      return new Response(
        JSON.stringify({ 
          html,
          message: 'PDF generation requires API key. Use browser print instead.',
          fallback: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, we'll return the HTML and let the client handle PDF generation
    // In a production environment, you would use a service like Puppeteer, wkhtmltopdf, or a PDF API
    return new Response(
      JSON.stringify({ 
        html,
        filename,
        message: 'HTML ready for PDF generation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-html-pdf:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
