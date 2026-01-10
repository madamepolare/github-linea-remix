import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BPUItem {
  id: string;
  pricing_ref: string;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  category?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, useAI } = await req.json();
    
    if (!fileContent) {
      throw new Error('No file content provided');
    }

    console.log(`Parsing BPU file: ${fileName}, useAI: ${useAI}`);

    let items: BPUItem[] = [];

    // Detect file type and parse accordingly
    const isCSV = fileName?.toLowerCase().endsWith('.csv');
    const isTXT = fileName?.toLowerCase().endsWith('.txt');

    if (isCSV || isTXT) {
      // Parse CSV/TXT file
      items = parseCSVContent(fileContent);
      console.log(`Parsed ${items.length} items from CSV/TXT`);
    } else {
      // Try to parse as text content (could be pasted content)
      items = parseTextContent(fileContent);
      console.log(`Parsed ${items.length} items from text content`);
    }

    // If AI enrichment requested and we have items
    if (useAI && items.length > 0) {
      console.log('Enriching items with AI...');
      items = await enrichWithAI(items);
    }

    // If parsing yielded no results but we have content, try AI extraction
    if (items.length === 0 && fileContent.trim().length > 0) {
      console.log('No items parsed, trying AI extraction...');
      items = await extractWithAI(fileContent);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        items,
        itemCount: items.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing BPU file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseCSVContent(content: string): BPUItem[] {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const items: BPUItem[] = [];
  
  // Try to detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
  
  // Parse header to find column indices
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
  
  const refIndex = headers.findIndex(h => h.includes('ref') || h.includes('code') || h.includes('n°'));
  const nameIndex = headers.findIndex(h => h.includes('désignation') || h.includes('libellé') || h.includes('name') || h.includes('description'));
  const unitIndex = headers.findIndex(h => h.includes('unité') || h.includes('unit') || h === 'u');
  const priceIndex = headers.findIndex(h => h.includes('prix') || h.includes('tarif') || h.includes('price') || h.includes('pu') || h.includes('p.u'));
  const categoryIndex = headers.findIndex(h => h.includes('catégorie') || h.includes('category') || h.includes('lot'));

  console.log(`CSV parsing - columns: ref=${refIndex}, name=${nameIndex}, unit=${unitIndex}, price=${priceIndex}`);

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim());
    
    const ref = refIndex >= 0 ? values[refIndex] || '' : '';
    const name = nameIndex >= 0 ? values[nameIndex] || '' : values[0] || '';
    const unit = unitIndex >= 0 ? values[unitIndex] || 'u' : 'u';
    const priceStr = priceIndex >= 0 ? values[priceIndex] || '0' : '0';
    const category = categoryIndex >= 0 ? values[categoryIndex] || '' : '';

    // Parse price (handle French format with comma)
    const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

    if (name) {
      items.push({
        id: `bpu-${i}-${Date.now()}`,
        pricing_ref: ref || `BPU-${String(i).padStart(3, '0')}`,
        name,
        unit,
        unit_price: price,
        category
      });
    }
  }

  return items;
}

function parseTextContent(content: string): BPUItem[] {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items: BPUItem[] = [];

  // Pattern matching for common BPU formats
  // Format: REF - DESIGNATION - UNIT - PRICE
  // or: DESIGNATION (UNIT) PRICE €
  const pricePattern = /(\d+[.,]?\d*)\s*€?/;
  const unitPattern = /\((h|j|m²|u|forfait|jour|heure)\)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers or empty-ish lines
    if (line.toLowerCase().includes('désignation') || line.toLowerCase().includes('prix unitaire')) {
      continue;
    }

    // Try to extract price
    const priceMatch = line.match(pricePattern);
    const unitMatch = line.match(unitPattern);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.')) || 0;
      const unit = unitMatch ? unitMatch[1].toLowerCase() : 'u';
      
      // Remove price and unit from line to get name
      let name = line
        .replace(pricePattern, '')
        .replace(unitPattern, '')
        .replace(/€/g, '')
        .trim();

      // Try to extract reference at start
      const refMatch = name.match(/^([A-Z0-9.-]+)\s*[-:]\s*/i);
      let ref = '';
      if (refMatch) {
        ref = refMatch[1];
        name = name.replace(refMatch[0], '').trim();
      }

      if (name && price > 0) {
        items.push({
          id: `bpu-${i}-${Date.now()}`,
          pricing_ref: ref || `BPU-${String(items.length + 1).padStart(3, '0')}`,
          name,
          unit,
          unit_price: price
        });
      }
    }
  }

  return items;
}

async function enrichWithAI(items: BPUItem[]): Promise<BPUItem[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.log('No LOVABLE_API_KEY, skipping AI enrichment');
    return items;
  }

  try {
    const prompt = `Tu es un expert en chiffrage de projets. Voici une liste de postes BPU à enrichir.
Pour chaque poste, suggère une catégorie appropriée (ex: "Honoraires", "Études", "Production", "Coordination", etc.) si elle n'est pas déjà définie.

Postes:
${items.map(item => `- ${item.pricing_ref}: ${item.name} (${item.unit_price}€/${item.unit})`).join('\n')}

Réponds en JSON avec le format:
[{ "pricing_ref": "...", "category": "..." }]`;

    const response = await fetch('https://ai.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const categories = JSON.parse(jsonMatch[0]);
      
      return items.map(item => {
        const match = categories.find((c: any) => c.pricing_ref === item.pricing_ref);
        return match ? { ...item, category: match.category } : item;
      });
    }
  } catch (error) {
    console.error('AI enrichment error:', error);
  }

  return items;
}

async function extractWithAI(content: string): Promise<BPUItem[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.log('No LOVABLE_API_KEY, cannot extract with AI');
    return [];
  }

  try {
    const prompt = `Tu es un expert en chiffrage de projets. Extrait les postes tarifaires du contenu suivant (BPU - Bordereau des Prix Unitaires).

Contenu:
${content.substring(0, 4000)}

Réponds en JSON avec le format exact:
[{
  "pricing_ref": "code ou référence du poste",
  "name": "désignation du poste",
  "unit": "unité (h, j, m², u, forfait)",
  "unit_price": nombre (prix unitaire),
  "category": "catégorie si identifiable"
}]

Si tu ne trouves pas de postes tarifaires valides, réponds avec un tableau vide [].`;

    const response = await fetch('https://ai.lovable.dev/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: any, index: number) => ({
        id: `ai-${index}-${Date.now()}`,
        pricing_ref: item.pricing_ref || `AI-${String(index + 1).padStart(3, '0')}`,
        name: item.name || '',
        description: item.description || '',
        unit: item.unit || 'u',
        unit_price: parseFloat(item.unit_price) || 0,
        category: item.category || ''
      })).filter((item: BPUItem) => item.name && item.unit_price > 0);
    }
  } catch (error) {
    console.error('AI extraction error:', error);
  }

  return [];
}
