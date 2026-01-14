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

function normalizeEmail(email: string): string {
  return email.trim().replace(/^mailto:/i, "").split("?")[0].toLowerCase();
}

function isValidEmail(email: string): boolean {
  return (
    email.includes("@") &&
    !email.includes("example.com") &&
    !email.includes("test.com") &&
    !email.includes("placeholder") &&
    !email.includes("@sentry") &&
    !email.includes("@wix") &&
    !email.endsWith(".png") &&
    !email.endsWith(".jpg") &&
    email.length < 80 &&
    email.length > 5
  );
}

function isLikelyGenericEmail(email: string): boolean {
  const local = email.split("@")[0] || "";
  return [
    "contact", "info", "bonjour", "hello", "commercial", "sales",
    "support", "service", "communication", "presse", "admin", "rh",
    "accueil", "direction", "secretariat", "comptabilite", "webmaster"
  ].includes(local.toLowerCase());
}

function extractEmailsFromText(text: string): string[] {
  const out: string[] = [];

  // mailto: links
  const mailtoRegex = /mailto:([^"'\s>]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRegex.exec(text)) !== null) {
    out.push(normalizeEmail(m[1]));
  }

  // visible emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  for (const e of matches) out.push(normalizeEmail(e));

  return [...new Set(out)].filter(isValidEmail);
}

function extractPhonesFromText(text: string): string[] {
  const phones = new Set<string>();
  const patterns = [
    /(?:\+33|0033)\s*[1-9](?:[\s.-]*\d{2}){4}/g,
    /\b0[1-9](?:[\s.-]*\d{2}){4}\b/g,
  ];
  for (const p of patterns) {
    const m = text.match(p) || [];
    for (const raw of m) phones.add(raw.replace(/\s+/g, " ").trim());
  }
  return [...phones];
}

function extractAddressFromText(text: string): { city?: string; postalCode?: string } {
  const match = text.match(/\b(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][a-zàâäéèêëïîôùûç]+(?:[\s-][A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ]?[a-zàâäéèêëïîôùûç]+)*)/);
  if (match) {
    return { postalCode: match[1], city: match[2] };
  }
  return {};
}

function tryInferNameAndRoleFromContext(text: string, email: string): { name?: string; role?: string } {
  const lines = text.split(/\r?\n/);
  const target = email.toLowerCase();
  const emailLocal = email.split("@")[0];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.toLowerCase().includes(target) && !line.toLowerCase().includes(emailLocal)) continue;

    // Look around the line
    const window = [lines[i - 2], lines[i - 1], line, lines[i + 1], lines[i + 2]].filter(Boolean).join(" ");

    // Role keywords (French)
    const roleRegex = /(directeur|directrice|responsable|chef\.?|chargé\.?e?|head|manager|président\.?e?|délégué\.?e?|coordinat(?:eur|rice))\s+(?:de\s+(?:la\s+)?|du\s+|des\s+)?([\p{L}'' -]{2,40})/iu;
    const roleMatch = window.match(roleRegex);

    // Name heuristic: 2-3 capitalized words near email
    const nameRegex = /\b([A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][\p{L}''-]+\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][\p{L}''-]+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][\p{L}''-]+)?)\b/u;
    const nameMatch = window.match(nameRegex);

    return {
      name: nameMatch?.[1],
      role: roleMatch ? `${roleMatch[1]} ${roleMatch[2]}`.trim() : undefined,
    };
  }

  return {};
}

function getRootWebsite(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}

function getCompanyNameFromTitle(title: string, url: string): string {
  // Clean title
  let name = (title || "").split(/[-–|:]/)[0]?.trim();
  
  // Remove common suffixes
  name = name.replace(/\s*(accueil|home|contact|nous contacter|bienvenue)$/i, "").trim();
  
  if (!name || name.length < 2) {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      name = hostname.split(".")[0];
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      name = url;
    }
  }
  
  return name;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, region, industry } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Firecrawl connector not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build search query
    let searchQuery = query;
    if (region) searchQuery += ` ${region}`;
    if (industry) searchQuery += ` ${industry}`;
    
    // Add terms to find contact pages with real emails
    searchQuery += ` (contact OR "nous contacter" OR équipe OR direction) email`;

    console.log("Searching:", searchQuery);

    // Step 1: Search with Firecrawl (with scrape to get content)
    const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 15,
        lang: "fr",
        country: "FR",
        scrapeOptions: {
          formats: ["markdown", "html"],
        },
      }),
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      console.error("Search failed:", err);
      return new Response(JSON.stringify({ error: "Search failed", details: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchData = await searchRes.json();
    console.log("Search returned", searchData?.data?.length || 0, "results");

    const prospects: ProspectResult[] = [];
    const seenDomains = new Set<string>();

    if (searchData.success && searchData.data) {
      for (const result of searchData.data) {
        const url = result.url || "";
        const title = result.title || "";
        const markdown = result.markdown || result.description || "";
        const html = result.html || "";
        const combinedText = `${markdown}\n${html}`;

        if (!url || combinedText.length < 50) continue;

        const rootSite = getRootWebsite(url);
        if (!rootSite || seenDomains.has(rootSite)) continue;
        seenDomains.add(rootSite);

        // Extract data from the scraped content
        const emails = extractEmailsFromText(combinedText);
        const phones = extractPhonesFromText(combinedText);
        const address = extractAddressFromText(combinedText);
        const companyName = getCompanyNameFromTitle(title, url);

        // Build contacts from non-generic emails
        const personalEmails = emails.filter(e => !isLikelyGenericEmail(e));
        const genericEmails = emails.filter(e => isLikelyGenericEmail(e));

        const contacts: ContactResult[] = [];
        
        // Personal emails -> contacts with inferred names
        for (const email of personalEmails.slice(0, 5)) {
          const inferred = tryInferNameAndRoleFromContext(combinedText, email);
          contacts.push({
            name: inferred.name || email.split("@")[0].replace(/[._-]/g, " "),
            email,
            role: inferred.role,
          });
        }

        // Skip if no useful data at all
        if (emails.length === 0 && phones.length === 0) {
          console.log("Skipping", companyName, "- no emails or phones found");
          continue;
        }

        const confidence = contacts.length > 0 ? 0.9 : (emails.length > 0 ? 0.7 : 0.5);

        prospects.push({
          company_name: companyName,
          company_website: rootSite,
          company_city: address.city,
          company_postal_code: address.postalCode,
          company_phone: phones[0],
          company_email: genericEmails[0] || emails[0],
          contacts,
          notes: `Données extraites de: ${url}`,
          source_url: url,
          confidence_score: confidence,
        });

        console.log(`Added: ${companyName} - ${contacts.length} contacts, ${emails.length} emails`);
      }
    }

    console.log(`Total: ${prospects.length} prospects with verified data`);

    return new Response(
      JSON.stringify({
        prospects,
        citations: prospects.map(p => p.source_url).filter(Boolean),
        query,
        count: prospects.length,
        source: "firecrawl_verified",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
