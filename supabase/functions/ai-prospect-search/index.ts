import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FirecrawlSearchResult = {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
};

type FirecrawlSearchResponse = {
  success: boolean;
  data?: FirecrawlSearchResult[];
  error?: string;
};

type FirecrawlMapResponse = {
  success: boolean;
  links?: string[];
  error?: string;
};

type FirecrawlScrapeResponse = {
  success: boolean;
  data?: {
    title?: string;
    markdown?: string;
    html?: string;
    links?: string[];
    metadata?: Record<string, unknown>;
  };
  error?: string;
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

function safeUrl(input: string | undefined | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  try {
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `https://${s}`;
  } catch {
    return null;
  }
}

function getRootWebsite(url: string): string | null {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().replace(/^mailto:/i, "").split("?")[0].toLowerCase();
}

function isLikelyGenericEmail(email: string): boolean {
  const local = email.split("@")[0] || "";
  return [
    "contact",
    "info",
    "bonjour",
    "hello",
    "commercial",
    "sales",
    "support",
    "service",
    "communication",
    "presse",
    "admin",
    "rh",
  ].includes(local.toLowerCase());
}

function extractEmailsFromHtml(html: string): string[] {
  const out: string[] = [];

  // mailto:
  const mailtoRegex = /href\s*=\s*["']mailto:([^"'>\s]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRegex.exec(html)) !== null) {
    out.push(normalizeEmail(m[1]));
  }

  // visible emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = html.match(emailRegex) || [];
  for (const e of matches) out.push(normalizeEmail(e));

  // Remove obvious placeholders
  return [...new Set(out)].filter((e) =>
    e.includes("@") &&
    !e.includes("example.com") &&
    !e.includes("test.com") &&
    !e.includes("placeholder") &&
    e.length < 80
  );
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

function pickRelevantUrls(root: string, urls: string[]): string[] {
  // Keep only same-origin links
  const candidates = urls.filter((u) => u.startsWith(root));

  // Prioritize contact/team/about/legal pages
  const keywords = [
    "contact",
    "contacts",
    "equipe",
    "team",
    "about",
    "a-propos",
    "apropos",
    "notre-equipe",
    "gouvernance",
    "organisation",
    "mentions-legales",
    "legal",
    "presse",
    "communication",
    "direction",
    "fondation",
    "nous-contacter",
  ];

  const scored = candidates
    .map((u) => {
      const path = u.toLowerCase();
      const score = keywords.reduce((acc, k) => acc + (path.includes(k) ? 1 : 0), 0);
      return { u, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Always include root homepage scrape too (first)
  const unique = new Set<string>();
  const selected: string[] = [];
  const homepage = root.endsWith("/") ? root : `${root}/`;
  unique.add(homepage);
  selected.push(homepage);

  for (const s of scored) {
    if (selected.length >= 8) break;
    if (!unique.has(s.u)) {
      unique.add(s.u);
      selected.push(s.u);
    }
  }

  return selected;
}

function tryInferNameAndRoleFromMarkdown(markdown: string, email: string): { name?: string; role?: string } {
  const lines = markdown.split(/\r?\n/);
  const target = email.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.toLowerCase().includes(target)) continue;

    // Look around the line (previous + same + next)
    const window = [lines[i - 1], line, lines[i + 1]].filter(Boolean).join(" \n ");

    // Role keywords (French)
    const roleRegex = /(directeur|directrice|responsable|chef\.?|charg[ée]e?|head|manager)\s+([\p{L}’' -]{2,60})/iu;
    const roleMatch = window.match(roleRegex);

    // Name heuristic: 2-3 capitalized words
    const nameRegex = /\b([A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][\p{L}’'-]+\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][\p{L}’'-]+(?:\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ][\p{L}’'-]+)?)\b/u;
    const nameMatch = window.match(nameRegex);

    return {
      name: nameMatch?.[1],
      role: roleMatch ? `${roleMatch[1]} ${roleMatch[2]}`.trim() : undefined,
    };
  }

  return {};
}

async function firecrawlSearch(apiKey: string, query: string): Promise<FirecrawlSearchResponse> {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 12,
      lang: "fr",
      country: "FR",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error || `Search failed: ${res.status}` };
  }
  return data as FirecrawlSearchResponse;
}

async function firecrawlMap(apiKey: string, rootUrl: string): Promise<FirecrawlMapResponse> {
  const res = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: rootUrl,
      includeSubdomains: false,
      limit: 1500,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error || `Map failed: ${res.status}` };
  }
  return data as FirecrawlMapResponse;
}

async function firecrawlScrape(apiKey: string, url: string): Promise<FirecrawlScrapeResponse> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html", "links"],
      onlyMainContent: false,
      waitFor: 1500,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: data?.error || `Scrape failed: ${res.status}` };
  }
  return data as FirecrawlScrapeResponse;
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

    // IMPORTANT: no hallucination — we only return what we can extract from pages.
    let q = query;
    if (region) q += ` ${region}`;
    if (industry) q += ` ${industry}`;

    // Encourage finding official sites + contact pages.
    const searchQuery = `${q} site:.fr (contact OR "nous contacter" OR équipe OR gouvernance OR direction)`;

    const search = await firecrawlSearch(apiKey, searchQuery);
    if (!search.success) {
      return new Response(JSON.stringify({ error: "Search failed", details: search.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const urls = (search.data || [])
      .map((r) => safeUrl(r.url))
      .filter(Boolean) as string[];

    // Convert to root websites
    const roots = [...new Set(urls.map(getRootWebsite).filter(Boolean) as string[])].slice(0, 6);

    const prospects: ProspectResult[] = [];

    for (const root of roots) {
      // 1) Map the site to find contact pages
      const map = await firecrawlMap(apiKey, root);
      const mapped = map.success ? map.links || [] : [];
      const pagesToScrape = pickRelevantUrls(root, mapped.length ? mapped : [root]);

      // 2) Scrape selected pages
      const scrapeResults: FirecrawlScrapeResponse[] = [];
      for (const page of pagesToScrape) {
        const scraped = await firecrawlScrape(apiKey, page);
        if (scraped.success && scraped.data) scrapeResults.push(scraped);
      }

      // 3) Extract emails/phones from real HTML/markdown (including mailto)
      const allEmails = new Set<string>();
      const allPhones = new Set<string>();
      let bestTitle: string | undefined;
      let bestSourceUrl: string | undefined;
      let combinedMarkdown = "";

      for (let i = 0; i < scrapeResults.length; i++) {
        const d = scrapeResults[i].data!;
        if (!bestTitle && d.title) bestTitle = d.title;
        if (!bestSourceUrl && pagesToScrape[i]) bestSourceUrl = pagesToScrape[i];

        if (d.html) {
          for (const e of extractEmailsFromHtml(d.html)) allEmails.add(e);
        }
        if (d.markdown) {
          combinedMarkdown += `\n\n${d.markdown}`;
          for (const p of extractPhonesFromText(d.markdown)) allPhones.add(p);
        }
      }

      // Build contacts from emails, prioritizing non-generic emails
      const emailsSorted = [...allEmails].sort((a, b) => {
        const ag = isLikelyGenericEmail(a) ? 1 : 0;
        const bg = isLikelyGenericEmail(b) ? 1 : 0;
        return ag - bg;
      });

      const contacts: ContactResult[] = [];
      for (const email of emailsSorted.slice(0, 8)) {
        const inferred = combinedMarkdown ? tryInferNameAndRoleFromMarkdown(combinedMarkdown, email) : {};
        contacts.push({
          name: inferred.name || email.split("@")[0],
          email,
          role: inferred.role,
        });
      }

      // Company name: derive from title (without hallucination)
      let companyName = (bestTitle || "").split(/[-–|]/)[0]?.trim();
      if (!companyName) {
        // fallback to hostname
        try {
          companyName = new URL(root).hostname.replace(/^www\./, "");
        } catch {
          companyName = root;
        }
      }

      const phones = [...allPhones];

      // If we only got generic emails and nothing else, skip (too low signal)
      const hasUseful = contacts.length > 0 || phones.length > 0;
      if (!hasUseful) continue;

      prospects.push({
        company_name: companyName,
        company_website: root,
        company_phone: phones[0],
        company_email: emailsSorted.find((e) => isLikelyGenericEmail(e)) || emailsSorted[0],
        contacts,
        notes: `Données extraites depuis pages du site (mailto + pages contact/équipe).` ,
        source_url: bestSourceUrl || root,
        confidence_score: contacts.length > 0 ? 0.85 : 0.6,
      });
    }

    return new Response(
      JSON.stringify({
        prospects,
        citations: prospects.map((p) => p.source_url).filter(Boolean),
        query,
        count: prospects.length,
        source: "firecrawl_crawl_verified",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in ai-prospect-search:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
