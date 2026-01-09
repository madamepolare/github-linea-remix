import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ARCHITECTURE_EXPERT_PROMPT = `Tu es un expert senior en marchés publics français, spécialisé dans les concours d'architecture et les missions de maîtrise d'œuvre (MOE).

MISSION: Analyse en détail les documents DCE fournis (PDF) et extrais TOUTES les informations pertinentes pour constituer le dossier de candidature.

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

RÈGLES:
- Sois EXHAUSTIF et PRÉCIS
- Cite les numéros d'articles quand pertinent
- Si une information n'est pas trouvée, indique "Non précisé dans le DCE"
- Pour les critères, extrait les VRAIS pourcentages du RC, pas des estimations`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, tender_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    console.log(`[DCE Analysis] Starting real content analysis of ${files.length} files`);

    // Filter and prepare files for multimodal analysis
    const supportedFiles = files.filter((f: { name: string; type: string; content: string }) => {
      const isSupported = f.type === 'application/pdf' || 
                          f.type.includes('image') ||
                          f.name.toLowerCase().endsWith('.pdf');
      if (!isSupported) {
        console.log(`[DCE Analysis] Skipping unsupported file: ${f.name} (${f.type})`);
      }
      return isSupported;
    });

    // Check file sizes (limit to ~10MB per file for API constraints)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in base64 is ~13.3MB
    const validFiles = supportedFiles.filter((f: { name: string; content: string }) => {
      const sizeBytes = (f.content.length * 3) / 4; // Approximate base64 to bytes
      if (sizeBytes > MAX_FILE_SIZE) {
        console.log(`[DCE Analysis] File too large, skipping: ${f.name}`);
        return false;
      }
      return true;
    });

    console.log(`[DCE Analysis] Processing ${validFiles.length} valid files out of ${files.length}`);

    // Build multimodal message parts with actual file content
    const fileParts: Array<{ type: string; text?: string; inline_data?: { mime_type: string; data: string } }> = [];
    
    // Add instruction text
    fileParts.push({
      type: "text",
      text: `Analyse ces ${validFiles.length} documents DCE et extrais TOUTES les informations pour créer le dossier de concours.

TYPE DE MARCHÉ: ${tender_type || 'architecture'}

FICHIERS FOURNIS:
${validFiles.map((f: { name: string }, i: number) => `${i + 1}. ${f.name}`).join('\n')}

INSTRUCTIONS:
1. Lis ATTENTIVEMENT chaque document PDF
2. Extrais les informations EXACTES (pas d'approximations)
3. Pour les critères de jugement, copie les pondérations EXACTES du RC
4. Pour l'équipe requise, distingue les compétences OBLIGATOIRES des optionnelles
5. Identifie les pièces à remettre pour chaque phase (candidature / offre)
6. Note les points critiques et alertes

Utilise la fonction extract_tender_info pour retourner les données structurées.`
    });

    // Add each file as inline data for Gemini to read
    for (const file of validFiles) {
      // Determine correct MIME type
      let mimeType = file.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          mimeType = 'application/pdf';
        }
      }

      fileParts.push({
        type: "image_url",
        // @ts-ignore - Gemini accepts inline_data in this format
        image_url: {
          url: `data:${mimeType};base64,${file.content}`
        }
      });
      
      console.log(`[DCE Analysis] Added file for analysis: ${file.name} (${mimeType})`);
    }

    // Call Gemini with multimodal content
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
            content: fileParts
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
                    description: "Adresse ou commune du projet" 
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
                  
                  // Dates
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
                    description: "Heure limite candidatures (HH:MM)"
                  },
                  submission_deadline: { 
                    type: "string", 
                    description: "Date limite de remise des offres (YYYY-MM-DD)" 
                  },
                  submission_time: {
                    type: "string",
                    description: "Heure limite offres (HH:MM)"
                  },
                  jury_date: {
                    type: "string",
                    description: "Date prévisionnelle du jury (YYYY-MM-DD)"
                  },
                  
                  // Site visit
                  site_visit_required: { 
                    type: "boolean", 
                    description: "Visite de site obligatoire" 
                  },
                  site_visit_date: { 
                    type: "string", 
                    description: "Date de visite (YYYY-MM-DD)" 
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
                  
                  // Judgment criteria - CRITICAL
                  criteria: {
                    type: "array",
                    description: "Liste des critères de jugement avec leurs pondérations EXACTES extraites du RC",
                    items: {
                      type: "object",
                      properties: {
                        name: { 
                          type: "string", 
                          description: "Nom du critère tel qu'il apparaît dans le RC" 
                        },
                        criterion_type: { 
                          type: "string", 
                          enum: ["technique", "prix", "delai", "qualite", "environnement", "social", "autre"],
                          description: "Type de critère" 
                        },
                        weight: { 
                          type: "number", 
                          description: "Pondération en pourcentage (ex: 40 pour 40%)" 
                        },
                        description: { 
                          type: "string", 
                          description: "Description ou sous-critères" 
                        }
                      },
                      required: ["name", "criterion_type", "weight"]
                    }
                  },
                  
                  // Required team
                  required_team: {
                    type: "array",
                    description: "Compétences MOE requises dans l'équipe",
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
                        }
                      },
                      required: ["specialty", "is_mandatory"]
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
                  
                  // Alerts and critical points
                  critical_alerts: {
                    type: "array",
                    description: "Points critiques et alertes identifiés dans le DCE",
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
                        }
                      },
                      required: ["type", "message", "severity"]
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
        console.log("[DCE Analysis] Extracted data:", JSON.stringify(extractedData, null, 2));
      } catch (e) {
        console.error("[DCE Analysis] Failed to parse tool call arguments:", e);
      }
    }

    // Ensure detected_documents includes all processed files
    if (!extractedData.detected_documents) {
      extractedData.detected_documents = validFiles.map((f: { name: string; type: string }) => ({
        filename: f.name,
        type: detectDocumentType(f.name)
      }));
    }

    // Count what was extracted for feedback
    const extractionStats = {
      files_analyzed: validFiles.length,
      files_skipped: files.length - validFiles.length,
      criteria_found: Array.isArray(extractedData.criteria) ? extractedData.criteria.length : 0,
      team_requirements: Array.isArray(extractedData.required_team) ? extractedData.required_team.length : 0,
      alerts_found: Array.isArray(extractedData.critical_alerts) ? extractedData.critical_alerts.length : 0,
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
