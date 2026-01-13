import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, website } = await req.json();
    console.log('Fetching logo for:', companyName, 'website:', website);

    if (!companyName && !website) {
      return new Response(
        JSON.stringify({ error: 'Company name or website required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract domain from website if provided
    let domain = '';
    if (website) {
      try {
        const url = new URL(website.startsWith('http') ? website : `https://${website}`);
        domain = url.hostname.replace('www.', '');
      } catch {
        console.log('Could not parse website URL:', website);
      }
    }

    // Try multiple logo sources
    const logoSources: { url: string; source: string }[] = [];

    // 1. Clearbit Logo API (free, high quality)
    if (domain) {
      logoSources.push({
        url: `https://logo.clearbit.com/${domain}`,
        source: 'clearbit'
      });
    }

    // 2. Google Favicon API (fallback)
    if (domain) {
      logoSources.push({
        url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        source: 'google_favicon'
      });
    }

    // 3. Try with company name as domain guess
    if (!domain && companyName) {
      const guessedDomain = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '') + '.com';
      
      logoSources.push({
        url: `https://logo.clearbit.com/${guessedDomain}`,
        source: 'clearbit_guessed'
      });

      // Also try .fr for French companies
      const guessedDomainFr = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '') + '.fr';
      
      logoSources.push({
        url: `https://logo.clearbit.com/${guessedDomainFr}`,
        source: 'clearbit_guessed_fr'
      });
    }

    // Check each source until we find a valid logo
    for (const logoSource of logoSources) {
      try {
        console.log('Trying logo source:', logoSource.source, logoSource.url);
        const response = await fetch(logoSource.url, { method: 'HEAD' });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('image/')) {
            console.log('Found valid logo from:', logoSource.source);
            return new Response(
              JSON.stringify({
                success: true,
                logoUrl: logoSource.url,
                source: logoSource.source
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (err) {
        console.log('Error checking logo source:', logoSource.source, err);
      }
    }

    // No logo found
    console.log('No logo found for:', companyName);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'No logo found',
        suggestions: [
          'Vérifiez que le site web est correct',
          'Essayez avec le domaine exact de l\'entreprise',
          'Uploadez manuellement un logo'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in fetch-company-logo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to fetch logo', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
