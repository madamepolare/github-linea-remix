import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactResult {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  linkedin?: string;
}

interface ProspectResult {
  company_name: string;
  company_website?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  company_phone?: string;
  company_email?: string;
  company_industry?: string;
  company_size?: string;
  contacts: ContactResult[];
  notes?: string;
  source_url?: string;
  confidence_score?: number;
}

// Extract company info from scraped content
function extractCompanyFromContent(content: string, url: string, title: string): ProspectResult | null {
  // Phone patterns (French)
  const phonePatterns = [
    /(?:Tél|Tel|Téléphone|Phone|T)\s*[.:]\s*((?:0[1-9]|(?:\+33|0033)\s*[1-9])[\s.-]*(?:\d{2}[\s.-]*){4})/gi,
    /((?:0[1-9]|(?:\+33|0033)\s*[1-9])[\s.-]*(?:\d{2}[\s.-]*){4})/g
  ];
  
  // Email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  // Address patterns (French)
  const postalCodePattern = /\b(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][a-zàâäéèêëïîôùûç]+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ]?[a-zàâäéèêëïîôùûç]+)*)/g;
  
  // Try to extract company name from title or URL
  let companyName = title?.split(/[-–|]/)[0]?.trim();
  if (!companyName || companyName.length < 2) {
    // Try to extract from URL
    try {
      const urlObj = new URL(url);
      companyName = urlObj.hostname.replace(/^www\./, '').split('.')[0];
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    } catch {
      return null;
    }
  }
  
  // Extract emails
  const emails = content.match(emailPattern) || [];
  const validEmails = emails.filter(e => 
    !e.includes('example.com') && 
    !e.includes('test.com') &&
    !e.includes('placeholder') &&
    e.length < 50
  );
  
  // Extract phones
  let phones: string[] = [];
  for (const pattern of phonePatterns) {
    const matches = content.match(pattern) || [];
    phones.push(...matches);
  }
  phones = [...new Set(phones.map(p => p.replace(/\s+/g, ' ').trim()))];
  
  // Extract address
  let city = '';
  let postalCode = '';
  const addressMatch = postalCodePattern.exec(content);
  if (addressMatch) {
    postalCode = addressMatch[1];
    city = addressMatch[2];
  }
  
  // Try to get website from URL
  let website = '';
  try {
    const urlObj = new URL(url);
    website = `${urlObj.protocol}//${urlObj.hostname}`;
  } catch {}
  
  // Only return if we have at least some useful data
  if (!companyName || companyName.length < 2) {
    return null;
  }
  
  return {
    company_name: companyName,
    company_website: website,
    company_city: city,
    company_postal_code: postalCode,
    company_phone: phones[0] || undefined,
    company_email: validEmails.find(e => 
      e.includes('contact') || 
      e.includes('info') || 
      e.includes('commercial')
    ) || validEmails[0] || undefined,
    company_industry: undefined,
    contacts: [],
    notes: `Source vérifiée: ${url}`,
    source_url: url,
    confidence_score: validEmails.length > 0 || phones.length > 0 ? 0.8 : 0.5,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, region, industry } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl API key not configured. Please connect Firecrawl in Settings → Connectors." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search query for real companies
    let searchQuery = query;
    if (region) {
      searchQuery += ` ${region}`;
    }
    if (industry) {
      searchQuery += ` ${industry}`;
    }
    // Add terms to find actual business listings
    searchQuery += ` contact email téléphone site:societe.com OR site:pappers.fr OR site:kompass.com OR site:linkedin.com/company`;

    console.log("Searching with Firecrawl:", searchQuery);

    // Step 1: Search for real companies using Firecrawl
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 20,
        lang: "fr",
        country: "FR",
        scrapeOptions: {
          formats: ["markdown"]
        }
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Firecrawl search error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to search prospects", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchResponse.json();
    console.log("Firecrawl search results:", searchData?.data?.length || 0, "results");

    const prospects: ProspectResult[] = [];
    const seenCompanies = new Set<string>();

    // Process search results
    if (searchData.success && searchData.data) {
      for (const result of searchData.data) {
        const url = result.url || '';
        const title = result.title || '';
        const content = result.markdown || result.description || '';
        
        if (!content && !title) continue;

        const prospect = extractCompanyFromContent(content, url, title);
        
        if (prospect && prospect.company_name) {
          // Deduplicate by company name (lowercase comparison)
          const normalizedName = prospect.company_name.toLowerCase().trim();
          if (!seenCompanies.has(normalizedName)) {
            seenCompanies.add(normalizedName);
            prospects.push(prospect);
          }
        }
      }
    }

    console.log(`Extracted ${prospects.length} unique prospects from real search results`);

    return new Response(
      JSON.stringify({ 
        prospects, 
        citations: searchData.data?.map((r: any) => r.url).filter(Boolean) || [],
        query,
        count: prospects.length,
        source: "firecrawl_verified"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-prospect-search:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
