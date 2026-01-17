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
    const { fileContent, fileName, useAI, isBase64, xlsData } = await req.json();
    
    if (!fileContent && !xlsData) {
      throw new Error('No file content provided');
    }

    console.log(`Parsing BPU file: ${fileName}, useAI: ${useAI}, isBase64: ${isBase64}, hasXlsData: ${!!xlsData}`);

    let items: BPUItem[] = [];

    // Detect file type and parse accordingly
    const isCSV = fileName?.toLowerCase().endsWith('.csv');
    const isTXT = fileName?.toLowerCase().endsWith('.txt');
    const isXLS = fileName?.toLowerCase().endsWith('.xls') || fileName?.toLowerCase().endsWith('.xlsx');

    if (isXLS && xlsData) {
      // XLS data is already parsed on the frontend using xlsx library
      console.log(`Received ${xlsData.length} rows from XLS`);
      items = parseXLSData(xlsData);
      console.log(`Parsed ${items.length} items from XLS data`);
    } else if (isCSV || isTXT) {
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
      items = await enrichWithAI(items, fileName);
    }

    // If parsing yielded no results but we have content, try AI extraction
    if (items.length === 0 && (fileContent?.trim().length > 0 || (xlsData && xlsData.length > 0))) {
      console.log('No items parsed, trying AI extraction...');
      const contentForAI = xlsData ? JSON.stringify(xlsData) : fileContent;
      items = await extractWithAI(contentForAI);
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

// Parse XLS data that was parsed on the frontend
function parseXLSData(rows: any[][]): BPUItem[] {
  if (!rows || rows.length < 2) return [];

  const items: BPUItem[] = [];
  
  // Find header row (first row with content)
  const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
  
  // Find column indices
  const refIndex = headers.findIndex(h => 
    h.includes('ref') || h.includes('code') || h.includes('n°') || h === 'réf' || h === 'référence'
  );
  const nameIndex = headers.findIndex(h => 
    h.includes('désignation') || h.includes('libellé') || h.includes('name') || 
    h.includes('description') || h.includes('intitulé') || h.includes('prestation')
  );
  const unitIndex = headers.findIndex(h => 
    h.includes('unité') || h.includes('unit') || h === 'u' || h === 'unité'
  );
  const priceIndex = headers.findIndex(h => 
    h.includes('prix') || h.includes('tarif') || h.includes('price') || 
    h.includes('pu') || h.includes('p.u') || h.includes('montant') || h.includes('€')
  );
  const categoryIndex = headers.findIndex(h => 
    h.includes('catégorie') || h.includes('category') || h.includes('lot') || h.includes('chapitre')
  );

  console.log(`XLS parsing - columns: ref=${refIndex}, name=${nameIndex}, unit=${unitIndex}, price=${priceIndex}, category=${categoryIndex}`);

  // Parse data rows (skip header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const ref = refIndex >= 0 ? String(row[refIndex] || '').trim() : '';
    // If no name column found, use first non-empty cell
    let name = '';
    if (nameIndex >= 0) {
      name = String(row[nameIndex] || '').trim();
    } else {
      // Try to find first meaningful text cell
      for (let j = 0; j < row.length; j++) {
        const val = String(row[j] || '').trim();
        if (val && val.length > 2 && isNaN(parseFloat(val.replace(',', '.')))) {
          name = val;
          break;
        }
      }
    }
    
    const unit = unitIndex >= 0 ? String(row[unitIndex] || 'u').trim() : 'u';
    const priceVal = priceIndex >= 0 ? row[priceIndex] : null;
    const category = categoryIndex >= 0 ? String(row[categoryIndex] || '').trim() : '';

    // Parse price (handle various formats)
    let price = 0;
    if (priceVal !== null && priceVal !== undefined) {
      if (typeof priceVal === 'number') {
        price = priceVal;
      } else {
        const priceStr = String(priceVal).replace(/[^\d.,\-]/g, '').replace(',', '.');
        price = parseFloat(priceStr) || 0;
      }
    }

    // Skip rows without a name or with zero/negative price
    if (name && price > 0) {
      items.push({
        id: `bpu-${i}-${Date.now()}`,
        pricing_ref: ref || `BPU-${String(items.length + 1).padStart(3, '0')}`,
        name,
        unit: normalizeUnit(unit),
        unit_price: Math.round(price * 100) / 100,
        category
      });
    }
  }

  return items;
}

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  if (u === 'h' || u === 'heure' || u === 'heures') return 'h';
  if (u === 'j' || u === 'jour' || u === 'jours') return 'j';
  if (u === 'm²' || u === 'm2' || u === 'mètre carré') return 'm²';
  if (u === 'ml' || u === 'm' || u === 'mètre linéaire') return 'ml';
  if (u === 'forfait' || u === 'f' || u === 'ens' || u === 'ensemble') return 'forfait';
  if (u === 'u' || u === 'unité' || u === 'pce' || u === 'pièce') return 'u';
  return unit || 'u';
}

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

    if (name && price > 0) {
      items.push({
        id: `bpu-${i}-${Date.now()}`,
        pricing_ref: ref || `BPU-${String(i).padStart(3, '0')}`,
        name,
        unit: normalizeUnit(unit),
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
          unit: normalizeUnit(unit),
          unit_price: price
        });
      }
    }
  }

  return items;
}

async function enrichWithAI(items: BPUItem[], fileName?: string): Promise<BPUItem[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.log('No LOVABLE_API_KEY, skipping AI enrichment');
    return items;
  }

  try {
    const prompt = `Tu es un expert en chiffrage de projets BTP/Architecture. Voici une liste de postes BPU importés du fichier "${fileName || 'BPU'}".

Pour chaque poste:
1. Suggère une catégorie appropriée si elle n'existe pas (ex: "Études préliminaires", "Conception", "Suivi de chantier", "Maîtrise d'œuvre", "Coordination", "Frais", etc.)
2. Améliore la description si elle est vague
3. Vérifie que l'unité est cohérente

Postes:
${items.slice(0, 50).map(item => `- Réf: ${item.pricing_ref} | ${item.name} | ${item.unit_price}€/${item.unit} | Cat: ${item.category || 'non définie'}`).join('\n')}

Réponds UNIQUEMENT en JSON valide avec le format:
[{ "pricing_ref": "...", "category": "...", "description": "...", "unit": "..." }]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
      const enrichments = JSON.parse(jsonMatch[0]);
      
      return items.map(item => {
        const match = enrichments.find((c: any) => c.pricing_ref === item.pricing_ref);
        if (match) {
          return { 
            ...item, 
            category: match.category || item.category,
            description: match.description || item.description,
            unit: match.unit ? normalizeUnit(match.unit) : item.unit
          };
        }
        return item;
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
${content.substring(0, 6000)}

Réponds UNIQUEMENT en JSON valide avec le format exact:
[{
  "pricing_ref": "code ou référence du poste",
  "name": "désignation du poste",
  "description": "description détaillée si disponible",
  "unit": "unité (h, j, m², u, forfait)",
  "unit_price": nombre (prix unitaire HT),
  "category": "catégorie si identifiable"
}]

Règles:
- Ignore les lignes de totaux et sous-totaux
- Ne garde que les postes avec un prix unitaire valide > 0
- Si tu ne trouves pas de postes tarifaires valides, réponds avec un tableau vide []`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        unit: normalizeUnit(item.unit || 'u'),
        unit_price: Math.round((parseFloat(item.unit_price) || 0) * 100) / 100,
        category: item.category || ''
      })).filter((item: BPUItem) => item.name && item.unit_price > 0);
    }
  } catch (error) {
    console.error('AI extraction error:', error);
  }

  return [];
}
