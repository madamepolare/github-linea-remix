import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ARCHITECTURE_EXPERT_PROMPT = `Tu es un expert senior en marchés publics français, spécialisé dans les concours d'architecture et les missions de maîtrise d'œuvre (MOE).

MISSION: Analyse en détail les documents DCE fournis et extrais TOUTES les informations pertinentes pour constituer le dossier de candidature.

EXPERTISE REQUISE:
- Connaissance approfondie du Code de la Commande Publique
- Maîtrise des procédures de concours d'architecture (restreint, ouvert, dialogue compétitif)
- Compréhension des missions MOE selon la loi MOP (ESQ, APS, APD, PRO, ACT, VISA, DET, AOR)
- Expertise en analyse des RC, CCAP, CCTP, programmes fonctionnels

DOCUMENTS À ANALYSER:
- Règlement de Consultation (RC) : critères de sélection, pondérations, pièces à fournir
- CCAP : conditions administratives, pénalités, assurances requises
- Programme fonctionnel : surfaces, organisation spatiale, contraintes techniques
- Avis de publicité : dates clés, contacts

EXTRACTION PRIORITAIRE:
1. IDENTIFICATION: Référence, titre, maître d'ouvrage (avec type: collectivité, bailleur, État...)
2. PROCÉDURE: Type (concours, MAPA, AOO), nombre de candidats admis, indemnités
3. DATES CRITIQUES: Publication, questions, remise candidature, remise offre, visite obligatoire
4. BUDGET: Montant travaux HT, enveloppe MOE si mentionnée
5. PROGRAMME: Surface, nature des travaux, contraintes techniques
6. CRITÈRES DE JUGEMENT: Extrais EXACTEMENT les critères avec leurs pondérations (en %)
7. ÉQUIPE REQUISE: Compétences exigées (architecte mandataire, BET structure, fluides, acoustique, économiste, paysagiste, etc.)
8. PIÈCES À REMETTRE: Par phase (candidature vs offre), formats exigés
9. VISITE DE SITE: Date, heure, lieu précis, contact pour inscription
10. ALERTES: Points critiques, exigences inhabituelles, risques identifiés

INSTRUCTIONS CRITIQUES POUR LES CRITÈRES:
- Dans le RC, cherche la section "critères de jugement des offres" ou "critères d'attribution"
- Les critères sont généralement au format: "Critère 1: Valeur technique (60%)", "Critère 2: Prix (40%)"
- EXTRAIT LE POURCENTAGE EXACT tel qu'écrit (ex: 60 pour 60%)
- Attention: les sous-critères sont parfois pondérés AU SEIN du critère principal
- Si tu vois "Prix: 40 points" → converti en pourcentage = 40%
- Liste aussi les sous-critères dans la description

INSTRUCTIONS CRITIQUES POUR LES DATES:
- La DATE LIMITE DE REMISE DES PLIS est dans le RC, souvent en première page ou dans l'article "Modalités de remise"
- Elle est au format "Date: JJ/MM/AAAA à HH:MM" ou "avant le JJ MOIS AAAA à HH heures"
- L'HEURE EST CRITIQUE - ne l'oublie jamais (souvent 12:00 ou 17:00)
- Convertis en format YYYY-MM-DD pour la date et HH:MM pour l'heure

INSTRUCTIONS POUR LA LOCALISATION:
- location = ADRESSE DU PROJET (où les travaux auront lieu), PAS l'adresse du maître d'ouvrage
- Inclus la rue, le code postal et la ville du projet

INSTRUCTIONS POUR LE LIEN DCE:
- Cherche l'URL vers la plateforme de dépôt (AWS, PLACE, Marchés Publics, achatpublic.com, etc.)
- Elle apparaît souvent dans "Obtention du dossier" ou "Téléchargement des pièces"

INSTRUCTIONS POUR LES VISITES:
- Si plusieurs créneaux de visite sont proposés, liste-les TOUS dans site_visit_slots
- Format: tableau avec date, heure et éventuelles notes (lieu de RDV)

RÈGLES:
- Sois EXHAUSTIF et PRÉCIS
- Cite les numéros d'articles quand pertinent
- Si une information n'est pas trouvée, indique null (pas "Non précisé")
- Pour les critères, extrait les VRAIS pourcentages du RC, pas des estimations`;

// Parse a single document using LlamaParse
async function parseDocument(file: { name: string; type: string; content: string }, apiKey: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    console.log(`[LlamaParse] Parsing: ${file.name}`);
    
    // Convert base64 to binary
    const binaryContent = Uint8Array.from(atob(file.content), c => c.charCodeAt(0));
    
    // Create form data for LlamaParse
    const formData = new FormData();
    const blob = new Blob([binaryContent], { type: file.type || 'application/octet-stream' });
    formData.append('file', blob, file.name);
    
    // Upload to LlamaParse
    const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[LlamaParse] Upload failed for ${file.name}:`, errorText);
      return { success: false, error: `Upload failed: ${uploadResponse.status}` };
    }
    
    const uploadResult = await uploadResponse.json();
    const jobId = uploadResult.id;
    
    console.log(`[LlamaParse] Job started: ${jobId} for ${file.name}`);
    
    // Poll for completion (max 60 seconds)
    const maxWait = 60000;
    const pollInterval = 2000;
    let elapsed = 0;
    
    while (elapsed < maxWait) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsed += pollInterval;
      
      const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!statusResponse.ok) {
        continue;
      }
      
      const statusResult = await statusResponse.json();
      
      if (statusResult.status === 'SUCCESS') {
        // Get the result
        const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        
        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          const text = resultData.markdown || resultData.text || '';
          console.log(`[LlamaParse] Successfully parsed ${file.name}: ${text.length} chars`);
          return { success: true, text };
        }
      } else if (statusResult.status === 'ERROR') {
        console.error(`[LlamaParse] Parsing failed for ${file.name}`);
        return { success: false, error: 'Parsing failed' };
      }
      
      console.log(`[LlamaParse] Status for ${file.name}: ${statusResult.status}, elapsed: ${elapsed}ms`);
    }
    
    return { success: false, error: 'Timeout waiting for parsing' };
  } catch (error) {
    console.error(`[LlamaParse] Error parsing ${file.name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, tender_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const LLAMA_PARSE_API_KEY = Deno.env.get('LLAMA_PARSE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    console.log(`[DCE Analysis] Starting analysis of ${files.length} files`);
    
    // Parse documents with LlamaParse if available
    let parsedTexts: string[] = [];
    let parsingStats = { success: 0, failed: 0 };
    
    if (LLAMA_PARSE_API_KEY) {
      console.log('[DCE Analysis] LlamaParse API key found - using multi-format parsing');
      
      // Parse all documents in parallel (with limit)
      const parsePromises = files.slice(0, 10).map(async (file: { name: string; type: string; content: string }) => {
        const result = await parseDocument(file, LLAMA_PARSE_API_KEY);
        return { file: file.name, ...result };
      });
      
      const parseResults = await Promise.all(parsePromises);
      
      for (const result of parseResults) {
        if (result.success && result.text) {
          parsedTexts.push(`\n\n=== DOCUMENT: ${result.file} ===\n\n${result.text}`);
          parsingStats.success++;
        } else {
          console.log(`[DCE Analysis] Failed to parse ${result.file}: ${result.error}`);
          parsingStats.failed++;
        }
      }
      
      console.log(`[DCE Analysis] Parsing complete: ${parsingStats.success} success, ${parsingStats.failed} failed`);
    } else {
      console.log('[DCE Analysis] No LlamaParse API key - falling back to filename analysis');
    }
    
    // Build the content for AI analysis
    let analysisContent: string;
    
    if (parsedTexts.length > 0) {
      // We have parsed document content
      analysisContent = `CONTENU DES DOCUMENTS DCE:
${parsedTexts.join('\n\n')}

FICHIERS ANALYSÉS: ${files.map((f: { name: string }) => f.name).join(', ')}

Analyse ces documents DCE et extrais TOUTES les informations pour créer le dossier de concours.
Utilise la fonction extract_tender_info pour retourner les données structurées.`;
    } else {
      // Fallback to filename analysis
      const fileAnalyses = files.map((f: { name: string; type: string }) => {
        const docType = detectDocumentType(f.name);
        return `- ${f.name} (${formatDocType(docType)})`;
      }).join('\n');
      
      analysisContent = `LISTE DES FICHIERS DCE (contenu non accessible):
${fileAnalyses}

TYPE DE MARCHÉ: ${tender_type || 'architecture'}

Déduis les informations possibles à partir des NOMS DE FICHIERS.
Utilise la fonction extract_tender_info pour retourner les données structurées.`;
    }

    // Call AI for structured extraction
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
            content: ARCHITECTURE_EXPERT_PROMPT
          },
          {
            role: "user",
            content: analysisContent
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_info",
              description: "Extrait les informations complètes d'un appel d'offres à partir des documents DCE",
              parameters: {
                type: "object",
                properties: {
                  // Basic info
                  title: { 
                    type: "string", 
                    description: "Titre/Objet exact du marché tel qu'il apparaît dans le RC ou l'avis de publicité" 
                  },
                  reference: { 
                    type: "string", 
                    description: "Référence/Numéro de consultation (ex: MAPA-2024-015, AOO-2024-01)" 
                  },
                  
                  // Client/MOA
                  client_name: { 
                    type: "string", 
                    description: "Nom complet du maître d'ouvrage" 
                  },
                  client_type: { 
                    type: "string", 
                    enum: ["collectivite", "bailleur_social", "etat", "hopital", "universite", "etablissement_public", "prive"],
                    description: "Type de maître d'ouvrage" 
                  },
                  moa_contact_name: {
                    type: "string",
                    description: "Nom du contact MOA ou du conducteur d'opération"
                  },
                  moa_contact_email: {
                    type: "string",
                    description: "Email de contact pour les questions"
                  },
                  moa_contact_phone: {
                    type: "string",
                    description: "Téléphone de contact"
                  },
                  
                  // Location & Project
                  location: { 
                    type: "string", 
                    description: "ADRESSE COMPLÈTE DU PROJET où les travaux auront lieu (rue, code postal, ville) - PAS l'adresse du maître d'ouvrage" 
                  },
                  department: {
                    type: "string",
                    description: "Département (numéro ou nom)"
                  },
                  surface_area: { 
                    type: "number", 
                    description: "Surface totale en m² (SDP ou SHON)" 
                  },
                  project_description: { 
                    type: "string", 
                    description: "Description détaillée du projet et du programme" 
                  },
                  work_nature: {
                    type: "array",
                    items: { type: "string" },
                    description: "Nature des travaux: construction_neuve, rehabilitation, extension, renovation, demolition, etc."
                  },
                  
                  // Budget
                  estimated_budget: { 
                    type: "number", 
                    description: "Budget travaux estimé en euros HT" 
                  },
                  moe_fee_percentage: {
                    type: "number",
                    description: "Taux d'honoraires MOE si mentionné (%)"
                  },
                  competition_indemnity: {
                    type: "number",
                    description: "Montant de l'indemnité de concours en euros"
                  },
                  
                  // Procedure
                  procedure_type: { 
                    type: "string", 
                    enum: ["ouvert", "restreint", "adapte", "mapa", "concours", "dialogue", "partenariat"],
                    description: "Type de procédure" 
                  },
                  submission_type: {
                    type: "string",
                    enum: ["candidature", "offre", "candidature_offre"],
                    description: "Type de remise: candidature seule, offre seule, ou les deux phases"
                  },
                  max_candidates: {
                    type: "number",
                    description: "Nombre maximum de candidats admis à concourir"
                  },
                  
                  // Dates - CRITIQUES
                  publication_date: {
                    type: "string",
                    description: "Date de publication de l'avis (YYYY-MM-DD)"
                  },
                  questions_deadline: {
                    type: "string",
                    description: "Date limite pour poser des questions (YYYY-MM-DD)"
                  },
                  candidature_deadline: {
                    type: "string",
                    description: "Date limite de remise des candidatures (YYYY-MM-DD)"
                  },
                  candidature_time: {
                    type: "string",
                    description: "Heure limite candidatures (HH:MM, ex: 12:00)"
                  },
                  submission_deadline: { 
                    type: "string", 
                    description: "DATE LIMITE DE REMISE DES PLIS/OFFRES - chercher dans le RC les termes 'date limite', 'remise des plis', 'avant le' - Format: YYYY-MM-DD" 
                  },
                  submission_time: {
                    type: "string",
                    description: "HEURE LIMITE DE REMISE - CRITIQUE - souvent 12:00 ou 17:00 - Format: HH:MM (ex: 12:00)"
                  },
                  jury_date: {
                    type: "string",
                    description: "Date prévisionnelle du jury (YYYY-MM-DD)"
                  },
                  
                  // Site visit
                  site_visit_required: { 
                    type: "boolean", 
                    description: "Visite de site obligatoire ou facultative" 
                  },
                  site_visit_date: { 
                    type: "string", 
                    description: "Date de visite unique (YYYY-MM-DD) - si un seul créneau" 
                  },
                  site_visit_time: {
                    type: "string",
                    description: "Heure de visite (HH:MM)"
                  },
                  site_visit_location: {
                    type: "string",
                    description: "Lieu de rendez-vous pour la visite"
                  },
                  site_visit_contact_name: {
                    type: "string",
                    description: "Nom du contact pour inscription à la visite"
                  },
                  site_visit_contact_email: {
                    type: "string",
                    description: "Email pour inscription à la visite"
                  },
                  site_visit_contact_phone: {
                    type: "string",
                    description: "Téléphone pour inscription à la visite"
                  },
                  site_visit_slots: {
                    type: "array",
                    description: "Si plusieurs créneaux de visite sont proposés, liste-les ici",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "Date du créneau YYYY-MM-DD" },
                        time: { type: "string", description: "Heure du créneau HH:MM" },
                        notes: { type: "string", description: "Précisions (lieu RDV, groupe, etc.)" }
                      },
                      required: ["date", "time"]
                    }
                  },
                  
                  // DCE Link
                  dce_url: {
                    type: "string",
                    description: "URL vers la plateforme de téléchargement du DCE (AWS, PLACE, achatpublic.com, e-marchespublics, etc.)"
                  },
                  
                  // Judgment criteria - EXTRACTION EXACTE OBLIGATOIRE
                  criteria: {
                    type: "array",
                    description: "CRITIQUE: Extrait les critères de jugement EXACTEMENT tels qu'ils apparaissent dans le RC avec leurs pondérations PRÉCISES en pourcentage",
                    items: {
                      type: "object",
                      properties: {
                        name: { 
                          type: "string", 
                          description: "Nom EXACT du critère tel qu'il apparaît dans le RC (ex: 'Valeur technique de l'offre', 'Prix des prestations')" 
                        },
                        criterion_type: { 
                          type: "string", 
                          enum: ["technique", "prix", "delai", "qualite", "environnement", "social", "autre"],
                          description: "Type de critère: 'technique' pour tout ce qui est qualité/méthodologie/références, 'prix' pour coût/honoraires" 
                        },
                        weight: { 
                          type: "number", 
                          description: "Pondération EXACTE en pourcentage entier (ex: 60 pour 60%). Si points convertir en %. IMPORTANT: la somme doit faire 100%" 
                        },
                        description: { 
                          type: "string", 
                          description: "Sous-critères et leur pondération si présents (ex: 'Compréhension du programme: 20pts, Méthodologie: 15pts')" 
                        }
                      },
                      required: ["name", "criterion_type", "weight"]
                    }
                  },
                  
                  // Required team - WITH SOURCE REFERENCE
                  required_team: {
                    type: "array",
                    description: "Compétences MOE requises dans l'équipe - TOUJOURS indiquer où tu as trouvé cette exigence",
                    items: {
                      type: "object",
                      properties: {
                        specialty: { 
                          type: "string", 
                          description: "Spécialité: architecte, bet_structure, bet_fluides, bet_electricite, economiste, paysagiste, acousticien, bet_vrd, opc, etc." 
                        },
                        is_mandatory: { 
                          type: "boolean", 
                          description: "Compétence obligatoire ou facultative" 
                        },
                        notes: { 
                          type: "string", 
                          description: "Exigences particulières (qualifications, références, etc.)" 
                        },
                        source: {
                          type: "string",
                          description: "OBLIGATOIRE: Document et section où cette exigence est mentionnée (ex: 'RC article 4.2', 'CCAP page 8', 'Avis de publicité')"
                        }
                      },
                      required: ["specialty", "is_mandatory", "source"]
                    }
                  },
                  
                  // MOE Phases
                  moe_phases: {
                    type: "array",
                    description: "Phases de mission MOE demandées",
                    items: {
                      type: "string",
                      enum: ["ESQ", "DIAG", "APS", "APD", "PRO", "ACT", "VISA", "DET", "AOR", "EXE", "OPC", "SSI"]
                    }
                  },
                  
                  // Deliverables
                  deliverables_candidature: {
                    type: "array",
                    description: "Pièces à remettre pour la candidature",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom du document" },
                        format: { type: "string", description: "Format requis (PDF, A3, maquette, etc.)" },
                        is_mandatory: { type: "boolean" }
                      },
                      required: ["name"]
                    }
                  },
                  deliverables_offre: {
                    type: "array",
                    description: "Pièces à remettre pour l'offre (phase concours)",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom du document" },
                        format: { type: "string", description: "Format requis (PDF, A3, maquette, etc.)" },
                        is_mandatory: { type: "boolean" }
                      },
                      required: ["name"]
                    }
                  },
                  
                  // Insurance requirements
                  insurance_requirements: {
                    type: "object",
                    properties: {
                      rc_professionnelle: { type: "number", description: "Montant RC pro minimum en euros" },
                      decennale: { type: "boolean", description: "Assurance décennale requise" },
                      notes: { type: "string" }
                    }
                  },
                  
                  // References requirements
                  reference_requirements: {
                    type: "object",
                    properties: {
                      min_references: { type: "number", description: "Nombre minimum de références demandées" },
                      min_budget: { type: "number", description: "Budget minimum des références" },
                      similar_program: { type: "boolean", description: "Références de programme similaire exigées" },
                      years_back: { type: "number", description: "Références sur les X dernières années" },
                      notes: { type: "string" }
                    }
                  },
                  
                  // AI summary
                  ai_summary: {
                    type: "string",
                    description: "Résumé synthétique de la mission en 2-3 phrases"
                  },
                  
                  // Alerts and critical points - WITH SOURCE REFERENCE
                  critical_alerts: {
                    type: "array",
                    description: "Points critiques et alertes identifiés dans le DCE - TOUJOURS citer la source",
                    items: {
                      type: "object",
                      properties: {
                        type: { 
                          type: "string", 
                          enum: ["deadline", "requirement", "risk", "unusual", "opportunity"],
                          description: "Type d'alerte"
                        },
                        message: { type: "string", description: "Description de l'alerte" },
                        severity: { 
                          type: "string", 
                          enum: ["info", "warning", "critical"] 
                        },
                        source: {
                          type: "string",
                          description: "OBLIGATOIRE: Document et localisation de cette information (ex: 'RC page 3', 'CCAP article 7', 'Programme p.12')"
                        }
                      },
                      required: ["type", "message", "severity", "source"]
                    }
                  },
                  
                  // Detected documents
                  detected_documents: {
                    type: "array",
                    description: "Documents identifiés dans le DCE",
                    items: {
                      type: "object",
                      properties: {
                        filename: { type: "string" },
                        type: { 
                          type: "string", 
                          enum: ["rc", "ccap", "cctp", "programme", "avis_publicite", "attestation_visite", "acte_engagement", "dpgf", "plans", "autre"]
                        },
                        pages: { type: "number" }
                      },
                      required: ["filename", "type"]
                    }
                  }
                },
                required: ["title", "client_name", "criteria", "required_team"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tender_info" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("[DCE Analysis] Rate limited");
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("[DCE Analysis] Payment required");
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("[DCE Analysis] AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[DCE Analysis] AI response received successfully");

    // Extract the function call result
    let extractedData: Record<string, unknown> = {};
    
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const parsed = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        extractedData = parsed;
        console.log("[DCE Analysis] Extracted data keys:", Object.keys(extractedData));
      } catch (e) {
        console.error("[DCE Analysis] Failed to parse tool call arguments:", e);
      }
    }

    // Ensure detected_documents includes all processed files
    if (!extractedData.detected_documents) {
      extractedData.detected_documents = files.map((f: { name: string; type: string }) => ({
        filename: f.name,
        type: detectDocumentType(f.name)
      }));
    }

    // Count what was extracted for feedback
    const extractionStats = {
      files_analyzed: parsingStats.success > 0 ? parsingStats.success : files.length,
      files_skipped: parsingStats.failed,
      criteria_found: Array.isArray(extractedData.criteria) ? extractedData.criteria.length : 0,
      team_requirements: Array.isArray(extractedData.required_team) ? extractedData.required_team.length : 0,
      alerts_found: Array.isArray(extractedData.critical_alerts) ? extractedData.critical_alerts.length : 0,
      parsing_method: LLAMA_PARSE_API_KEY ? 'llamaparse' : 'filename_only',
    };

    console.log("[DCE Analysis] Extraction stats:", extractionStats);

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
      stats: extractionStats,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[DCE Analysis] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur inconnue" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Detect document type from filename
function detectDocumentType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.match(/\brc\b/) || lowerName.includes('reglement') || lowerName.includes('règlement')) {
    return 'rc';
  }
  if (lowerName.includes('ccap') || lowerName.includes('clauses_admin')) {
    return 'ccap';
  }
  if (lowerName.includes('cctp') || lowerName.includes('clauses_tech')) {
    return 'cctp';
  }
  if (lowerName.includes('programme') || lowerName.includes('note_programme')) {
    return 'programme';
  }
  if (lowerName.includes('avis') || lowerName.includes('publicite') || lowerName.includes('boamp')) {
    return 'avis_publicite';
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
    'avis_publicite': 'Avis de Publicité',
    'attestation_visite': 'Attestation de Visite',
    'acte_engagement': 'Acte d\'Engagement',
    'dpgf': 'DPGF - Bordereau des Prix',
    'plans': 'Plans',
    'autre': 'Autre document'
  };
  return labels[type] || type;
}
