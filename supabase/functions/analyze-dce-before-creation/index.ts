import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    console.log(`Analyzing ${files.length} files before tender creation`);

    // Build detailed file analysis for the AI
    const fileAnalyses = files.map((f: { name: string; type: string; content: string }) => {
      const docType = detectDocumentType(f.name);
      const fileInfo = parseFileName(f.name);
      
      return {
        fileName: f.name,
        detectedType: docType,
        detectedReference: fileInfo.reference,
        detectedKeywords: fileInfo.keywords,
        mimeType: f.type
      };
    });

    console.log("File analyses:", JSON.stringify(fileAnalyses, null, 2));

    // Create a structured prompt based on filename analysis
    const fileAnalysisText = fileAnalyses.map((f: { fileName: string; detectedType: string; detectedReference: string | null; detectedKeywords: string[] }) => {
      let analysis = `📄 Fichier: "${f.fileName}"
   - Type de document: ${formatDocType(f.detectedType)}
   - Référence détectée: ${f.detectedReference || "non détectée"}
   - Mots-clés: ${f.detectedKeywords.join(', ') || "aucun"}`;
      return analysis;
    }).join('\n\n');

    // Extract all references found in filenames
    const allReferences = fileAnalyses
      .map((f: { detectedReference: string | null }) => f.detectedReference)
      .filter((ref: string | null): ref is string => ref !== null);
    
    const uniqueReferences = [...new Set(allReferences)];
    
    // Extract all keywords for better context
    const allKeywords = fileAnalyses
      .flatMap((f: { detectedKeywords: string[] }) => f.detectedKeywords);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en marchés publics français, spécialisé dans l'analyse des DCE (Dossiers de Consultation des Entreprises) pour les concours d'architecture.

RÈGLES IMPORTANTES:
1. Analyse UNIQUEMENT les noms de fichiers fournis - ce sont ta seule source d'information
2. Les noms de fichiers contiennent souvent:
   - La RÉFÉRENCE du marché (ex: "AWS-MPI-1678323", "MAPA-2024-015", "2024-AOO-123")
   - Le TYPE de document (RC = Règlement de Consultation, CCAP, CCTP, etc.)
   - Des indices sur le PROJET (école, hôpital, logements, etc.)
   - Parfois le NOM du maître d'ouvrage

3. Pour le TITRE: Déduis l'objet du marché à partir des mots-clés dans les noms de fichiers. 
   - Exemple: "RC_Construction_Ecole_Primaire.pdf" → "Construction d'une école primaire"
   - Si tu ne peux pas déterminer l'objet précis, utilise un titre générique basé sur le type de projet

4. Pour la RÉFÉRENCE: Extrais le code/numéro de consultation visible dans les noms de fichiers
   - Cherche des patterns comme: XXX-XXX-XXXXXX, MAPA-XXXX-XX, 20XX-XXX-XX, etc.

5. Pour le CLIENT (maître d'ouvrage): Cherche des noms d'organisations dans les fichiers
   - Collectivités: Ville de..., Commune de..., Département, Région, Métropole
   - Bailleurs: OPH, OPAC, offices HLM
   - État: Ministère, Préfecture
   
6. Ne laisse AUCUN champ vide si tu peux raisonnablement le déduire
7. Utilise les formats exacts demandés pour les dates (YYYY-MM-DD) et les types énumérés`
          },
          {
            role: "user",
            content: `Analyse ces ${files.length} documents DCE et extrais toutes les informations pour créer la fiche du concours.

ANALYSE DES FICHIERS:
${fileAnalysisText}

${uniqueReferences.length > 0 ? `\n📌 RÉFÉRENCES DÉTECTÉES: ${uniqueReferences.join(', ')}` : ''}
${allKeywords.length > 0 ? `\n🔑 MOTS-CLÉS GLOBAUX: ${[...new Set(allKeywords)].join(', ')}` : ''}

À partir de ces informations, remplis au maximum les champs du concours.
IMPORTANT: Utilise la référence "${uniqueReferences[0] || ''}" si elle a été détectée.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_info",
              description: "Extrait les informations d'un appel d'offres à partir des noms de documents DCE",
              parameters: {
                type: "object",
                properties: {
                  title: { 
                    type: "string", 
                    description: "Titre/Objet du marché déduit des noms de fichiers. Doit être descriptif (ex: 'Construction d'un groupe scolaire', 'Réhabilitation de logements sociaux'). NE PAS utiliser le nom de fichier brut." 
                  },
                  reference: { 
                    type: "string", 
                    description: "Référence/Numéro de consultation extrait des noms de fichiers (ex: 'AWS-MPI-1678323', 'MAPA-2024-015')" 
                  },
                  client_name: { 
                    type: "string", 
                    description: "Nom du maître d'ouvrage si identifiable (Ville de..., Département de..., etc.)" 
                  },
                  client_type: { 
                    type: "string", 
                    enum: ["collectivite", "bailleur_social", "etat", "hopital", "universite", "etablissement_public", "prive"],
                    description: "Type de client déduit du contexte" 
                  },
                  location: { 
                    type: "string", 
                    description: "Lieu/Ville du projet si identifiable" 
                  },
                  estimated_budget: { 
                    type: "number", 
                    description: "Budget estimé en euros HT si mentionné" 
                  },
                  procedure_type: { 
                    type: "string", 
                    enum: ["ouvert", "restreint", "adapte", "mapa", "concours", "dialogue", "partenariat"],
                    description: "Type de procédure déduit (MAPA si adapté, concours si architecture, etc.)" 
                  },
                  submission_deadline: { 
                    type: "string", 
                    description: "Date limite de dépôt format YYYY-MM-DD" 
                  },
                  site_visit_date: { 
                    type: "string", 
                    description: "Date de visite de site format YYYY-MM-DD" 
                  },
                  site_visit_required: { 
                    type: "boolean", 
                    description: "Visite de site obligatoire (true si attestation_visite détectée)" 
                  },
                  project_description: { 
                    type: "string", 
                    description: "Description du projet basée sur l'analyse des noms de fichiers" 
                  },
                  surface_area: { 
                    type: "number", 
                    description: "Surface en m² si mentionnée" 
                  },
                  detected_documents: {
                    type: "array",
                    description: "Liste des types de documents détectés",
                    items: {
                      type: "object",
                      properties: {
                        filename: { type: "string" },
                        type: { 
                          type: "string", 
                          enum: ["rc", "ccap", "cctp", "programme", "lettre_consultation", "attestation_visite", "acte_engagement", "dpgf", "plans", "autre"]
                        }
                      },
                      required: ["filename", "type"]
                    }
                  }
                },
                required: ["title", "reference"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tender_info" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the function call result
    let extractedData: Record<string, unknown> = { 
      title: "Nouveau concours",
      reference: uniqueReferences[0] || "",
      detected_documents: fileAnalyses.map((f: { fileName: string; detectedType: string }) => ({
        filename: f.fileName,
        type: f.detectedType
      }))
    };
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const parsed = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        extractedData = { ...extractedData, ...parsed };
        console.log("Extracted tender info:", JSON.stringify(extractedData, null, 2));
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Ensure we have the reference from filename analysis if AI missed it
    if (!extractedData.reference && uniqueReferences.length > 0) {
      extractedData.reference = uniqueReferences[0];
    }

    // Check for site visit requirement based on documents
    const hasVisitAttestation = fileAnalyses.some((f: { detectedType: string }) => f.detectedType === 'attestation_visite');
    if (hasVisitAttestation && extractedData.site_visit_required === undefined) {
      extractedData.site_visit_required = true;
    }

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-dce-before-creation:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Parse filename to extract reference and keywords
function parseFileName(fileName: string): { reference: string | null; keywords: string[] } {
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  
  // Common reference patterns in French public tenders
  const referencePatterns = [
    /([A-Z]{2,4}-[A-Z]{2,4}-\d{5,})/i,  // AWS-MPI-1678323
    /(\d{4}-[A-Z]{2,4}-\d{2,})/i,        // 2024-AOO-15
    /(MAPA[-_]?\d{4}[-_]?\d{2,})/i,      // MAPA-2024-015
    /(AOO[-_]?\d{4}[-_]?\d{2,})/i,       // AOO-2024-01
    /([A-Z]{2,}\d{6,})/i,                 // MPI1678323
    /(M\d{2}[-_]\d{3,})/i,               // M24-123
  ];

  let reference: string | null = null;
  for (const pattern of referencePatterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      reference = match[1].toUpperCase();
      break;
    }
  }

  // Extract meaningful keywords
  const keywords: string[] = [];
  const keywordPatterns: Record<string, string[]> = {
    'école': ['ecole', 'scolaire', 'college', 'lycee', 'maternelle', 'primaire', 'groupe_scolaire'],
    'logement': ['logement', 'residence', 'habitat', 'hlm', 'social'],
    'hôpital': ['hopital', 'clinique', 'ehpad', 'sante', 'medical'],
    'sport': ['sport', 'gymnase', 'stade', 'piscine', 'tennis'],
    'culture': ['culture', 'mediatheque', 'bibliotheque', 'musee', 'theatre'],
    'bureau': ['bureau', 'tertiaire', 'administratif'],
    'réhabilitation': ['rehabilitation', 'renovation', 'restructuration', 'extension'],
    'construction': ['construction', 'neuf', 'creation'],
  };

  const lowerName = nameWithoutExt.toLowerCase();
  for (const [keyword, patterns] of Object.entries(keywordPatterns)) {
    if (patterns.some(p => lowerName.includes(p))) {
      keywords.push(keyword);
    }
  }

  return { reference, keywords };
}

function detectDocumentType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  
  // Order matters - more specific patterns first
  if (lowerName.match(/\brc\b/) || lowerName.includes('reglement') || lowerName.includes('règlement')) {
    return 'rc';
  }
  if (lowerName.includes('ccap') || lowerName.includes('clauses_admin') || lowerName.includes('clauses admin')) {
    return 'ccap';
  }
  if (lowerName.includes('cctp') || lowerName.includes('clauses_tech') || lowerName.includes('clauses tech')) {
    return 'cctp';
  }
  if (lowerName.includes('programme') || lowerName.includes('note_programme')) {
    return 'programme';
  }
  if (lowerName.includes('lettre') || lowerName.match(/\bconsultation\b/)) {
    return 'lettre_consultation';
  }
  if (lowerName.includes('visite') || lowerName.includes('attestation')) {
    return 'attestation_visite';
  }
  if (lowerName.match(/\bae\b/) || lowerName.includes('acte') || lowerName.includes('engagement')) {
    return 'acte_engagement';
  }
  if (lowerName.includes('dpgf') || lowerName.match(/\bprix\b/) || lowerName.includes('bordereau')) {
    return 'dpgf';
  }
  if (lowerName.includes('plan') || lowerName.endsWith('.dwg') || lowerName.endsWith('.dxf')) {
    return 'plans';
  }
  
  return 'autre';
}

function formatDocType(type: string): string {
  const labels: Record<string, string> = {
    'rc': 'Règlement de Consultation',
    'ccap': 'CCAP - Clauses Administratives',
    'cctp': 'CCTP - Clauses Techniques',
    'programme': 'Programme',
    'lettre_consultation': 'Lettre de Consultation',
    'attestation_visite': 'Attestation de Visite',
    'acte_engagement': 'Acte d\'Engagement',
    'dpgf': 'DPGF - Bordereau des Prix',
    'plans': 'Plans',
    'autre': 'Autre document'
  };
  return labels[type] || type;
}
