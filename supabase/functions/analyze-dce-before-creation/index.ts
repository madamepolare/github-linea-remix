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

const COMMUNICATION_EXPERT_PROMPT = `Tu es un expert senior en marchés publics de communication, spécialisé dans les appels d'offres d'agences de communication, RP, publicité et événementiel.

MISSION: Analyse en détail les documents DCE fournis et extrais TOUTES les informations pertinentes pour constituer le dossier de candidature d'une agence de communication.

EXPERTISE REQUISE:
- Connaissance des marchés de communication publique (accords-cadres, compétitions d'agences)
- Maîtrise des prestations de communication : conseil, création, production, média, digital, RP
- Compréhension des BPU (Bordereau de Prix Unitaires) avec taux journaliers
- Expertise en analyse des RC, CCAP, cahiers des charges de communication

SPÉCIFICITÉS MARCHÉS COMMUNICATION:
1. STRUCTURE DU MARCHÉ:
   - Mono ou multi-attributaires (1 à N agences retenues)
   - Nombre de LOTS et périmètre de chaque lot
   - Pour chaque lot: domaine (graphisme, impression, digital, événementiel, RP, vidéo...)
   
2. MONTANTS:
   - Montant MINIMUM et MAXIMUM de l'accord-cadre (pas de budget travaux!)
   - Budget par lot si allotissement
   - Durée de l'accord-cadre et reconductions

3. CAS PRATIQUE:
   - Y a-t-il un cas pratique / exercice créatif demandé?
   - Quel est le brief exact?
   - Quels sont les livrables attendus pour le cas pratique?
   - Délai de réalisation du cas pratique

4. CRITÈRES DE JUGEMENT:
   - Attention: souvent Valeur technique 60-70%, Prix 30-40%
   - Sous-critères fréquents: compréhension du besoin, recommandation stratégique, créativité, méthodologie, équipe dédiée
   - Le cas pratique est souvent noté séparément ou intégré dans la valeur technique

5. ANCIENS PRESTATAIRES:
   - Le titulaire actuel est-il mentionné?
   - Y a-t-il des informations sur les marchés précédents?

6. ÉQUIPE ATTENDUE:
   - Profils types: Directeur conseil, DA, Chef de projet, Concepteur-rédacteur, Planneur
   - Attentes en termes de séniorité

7. PHASES:
   - Phase candidature: quand? quelles pièces?
   - Phase offre: quand? quelles pièces?
   - Audition/soutenance prévue?

EXTRACTION PRIORITAIRE:
1. IDENTIFICATION: Référence, titre, annonceur/MOA
2. STRUCTURE: Mono/multi-attributaire, nombre de lots, domaine par lot
3. MONTANTS: Min/max accord-cadre, budget/lot, durée
4. DATES: Candidature, offre, audition, début de mission
5. CRITÈRES: Avec pondérations EXACTES
6. CAS PRATIQUE: Brief détaillé, livrables, délai
7. ÉQUIPE: Profils demandés avec niveau
8. ANCIENS PRESTATAIRES: Si mentionnés
9. LIVRABLES: Par phase (candidature vs offre)
10. ALERTES: Points critiques, exigences inhabituelles

NE PAS CHERCHER: Surface en m², budget travaux, phases MOE (ESQ, APS...) car ce ne sont PAS des marchés d'architecture.

RÈGLES:
- Sois EXHAUSTIF et PRÉCIS
- Cite les sources (RC article X, CCAP page Y)
- Si une information n'est pas trouvée, indique null
- Pour les critères, extrait les VRAIS pourcentages`;

const SCENOGRAPHIE_EXPERT_PROMPT = `Tu es un expert en marchés publics culturels, spécialisé dans les appels d'offres de scénographie, muséographie et expositions.

Ton rôle est d'analyser les DCE pour les marchés de scénographie d'exposition.`;

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

function getExpertPrompt(disciplineSlug: string): string {
  switch (disciplineSlug) {
    case 'communication':
      return COMMUNICATION_EXPERT_PROMPT;
    case 'scenographie':
      return SCENOGRAPHIE_EXPERT_PROMPT;
    case 'architecture':
    default:
      return ARCHITECTURE_EXPERT_PROMPT;
  }
}

function getToolParameters(disciplineSlug: string) {
  // Base parameters for all disciplines
  const baseParams = {
    title: { 
      type: "string", 
      description: "Titre/Objet exact du marché tel qu'il apparaît dans le RC ou l'avis de publicité" 
    },
    reference: { 
      type: "string", 
      description: "Référence/Numéro de consultation" 
    },
    client_name: { 
      type: "string", 
      description: "Nom complet du maître d'ouvrage/annonceur" 
    },
    client_type: { 
      type: "string", 
      enum: ["collectivite", "bailleur_social", "etat", "hopital", "universite", "etablissement_public", "prive", "association", "federation", "entreprise_publique"],
      description: "Type de maître d'ouvrage" 
    },
    moa_contact_name: {
      type: "string",
      description: "Nom du contact MOA"
    },
    moa_contact_email: {
      type: "string",
      description: "Email de contact"
    },
    submission_deadline: { 
      type: "string", 
      description: "DATE LIMITE DE REMISE - Format: YYYY-MM-DD" 
    },
    submission_time: {
      type: "string",
      description: "HEURE LIMITE - Format: HH:MM"
    },
    candidature_deadline: {
      type: "string",
      description: "Date limite candidatures si différente (YYYY-MM-DD)"
    },
    candidature_time: {
      type: "string",
      description: "Heure limite candidatures (HH:MM)"
    },
    procedure_type: { 
      type: "string", 
      description: "Type de procédure" 
    },
    submission_type: {
      type: "string",
      enum: ["candidature", "offre", "candidature_offre"],
      description: "Type de remise"
    },
    dce_url: {
      type: "string",
      description: "URL vers la plateforme de téléchargement du DCE"
    },
    criteria: {
      type: "array",
      description: "Critères de jugement avec pondérations EXACTES",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          criterion_type: { type: "string" },
          weight: { type: "number" },
          description: { type: "string" }
        },
        required: ["name", "criterion_type", "weight"]
      }
    },
    critical_alerts: {
      type: "array",
      description: "Points critiques et alertes",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["deadline", "requirement", "risk", "unusual", "opportunity"] },
          message: { type: "string" },
          severity: { type: "string", enum: ["info", "warning", "critical"] },
          source: { type: "string" }
        },
        required: ["type", "message", "severity"]
      }
    },
    ai_summary: {
      type: "string",
      description: "Résumé synthétique de la mission en 2-3 phrases"
    },
    detected_documents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          filename: { type: "string" },
          type: { type: "string" }
        }
      }
    }
  };

  // Communication-specific parameters
  if (disciplineSlug === 'communication') {
    return {
      ...baseParams,
      // Structure du marché
      is_multi_attributaire: {
        type: "boolean",
        description: "Le marché est-il multi-attributaires (plusieurs agences retenues)?"
      },
      nb_attributaires: {
        type: "number",
        description: "Nombre d'agences qui seront retenues (si multi-attributaire)"
      },
      // Lots
      lots: {
        type: "array",
        description: "Liste des lots du marché avec leurs caractéristiques",
        items: {
          type: "object",
          properties: {
            numero: { type: "number", description: "Numéro du lot" },
            intitule: { type: "string", description: "Intitulé du lot" },
            domaine: { 
              type: "string", 
              enum: ["graphisme", "impression", "digital", "evenementiel", "video", "strategie", "rp", "signaletique", "global"],
              description: "Domaine du lot" 
            },
            budget_min: { type: "number", description: "Budget minimum du lot en € HT" },
            budget_max: { type: "number", description: "Budget maximum du lot en € HT" },
            description: { type: "string" }
          },
          required: ["numero", "intitule", "domaine"]
        }
      },
      // Montants accord-cadre
      montant_minimum: {
        type: "number",
        description: "Montant MINIMUM de l'accord-cadre en € HT"
      },
      montant_maximum: {
        type: "number",
        description: "Montant MAXIMUM de l'accord-cadre en € HT"
      },
      // Durée
      duree_initiale_mois: {
        type: "number",
        description: "Durée initiale du marché en mois"
      },
      nb_reconductions: {
        type: "number",
        description: "Nombre de reconductions possibles"
      },
      duree_reconduction_mois: {
        type: "number",
        description: "Durée de chaque reconduction en mois"
      },
      date_debut_mission: {
        type: "string",
        description: "Date prévue de début de mission (YYYY-MM-DD)"
      },
      validite_offre_jours: {
        type: "number",
        description: "Durée de validité des offres en jours (souvent 90 ou 180)"
      },
      // Cas pratique
      cas_pratique: {
        type: "object",
        description: "Détails du cas pratique si requis",
        properties: {
          requis: { type: "boolean", description: "Un cas pratique est-il demandé?" },
          brief: { type: "string", description: "Brief détaillé du cas pratique" },
          livrables: { 
            type: "array", 
            items: { type: "string" },
            description: "Liste des livrables attendus pour le cas pratique" 
          },
          format: { type: "string", description: "Format de rendu (nb de pages, support...)" },
          delai_jours: { type: "number", description: "Délai de réalisation du cas pratique en jours" },
          ponderation: { type: "number", description: "Pondération du cas pratique dans la note (%)" }
        }
      },
      // Audition
      audition: {
        type: "object",
        description: "Informations sur l'audition/soutenance",
        properties: {
          prevue: { type: "boolean" },
          date: { type: "string", description: "Date prévue (YYYY-MM-DD)" },
          duree_minutes: { type: "number" },
          format: { type: "string", description: "Format de l'audition (présentiel, visio...)" }
        }
      },
      // Anciens prestataires
      anciens_prestataires: {
        type: "array",
        description: "Anciens titulaires du marché si mentionnés",
        items: {
          type: "object",
          properties: {
            nom: { type: "string" },
            lot: { type: "string" },
            periode: { type: "string" }
          }
        }
      },
      // Équipe communication
      required_team: {
        type: "array",
        description: "Profils d'équipe attendus",
        items: {
          type: "object",
          properties: {
            specialty: { 
              type: "string",
              enum: ["directeur_conseil", "directeur_creation", "directeur_artistique", "chef_de_projet", "concepteur_redacteur", "graphiste", "planneur_strategique", "social_media_manager", "community_manager", "motion_designer", "photographe", "realisateur", "acheteur_media", "rp_influence", "autre"]
            },
            is_mandatory: { type: "boolean" },
            notes: { type: "string" },
            source: { type: "string" }
          },
          required: ["specialty", "is_mandatory"]
        }
      },
      // Type de campagne
      type_campagne: {
        type: "string",
        enum: ["evenementielle", "corporate", "institutionnelle", "digitale", "produit", "recrutement", "global"],
        description: "Type principal de communication"
      },
      cibles: {
        type: "string",
        description: "Cibles de communication mentionnées"
      },
      // Livrables attendus
      deliverables_candidature: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            format: { type: "string" },
            is_mandatory: { type: "boolean" }
          }
        }
      },
      deliverables_offre: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            format: { type: "string" },
            is_mandatory: { type: "boolean" }
          }
        }
      }
    };
  }

  // Architecture-specific parameters
  return {
    ...baseParams,
    location: { 
      type: "string", 
      description: "ADRESSE COMPLÈTE DU PROJET" 
    },
    department: {
      type: "string",
      description: "Département"
    },
    surface_area: { 
      type: "number", 
      description: "Surface totale en m²" 
    },
    project_description: { 
      type: "string", 
      description: "Description détaillée du projet" 
    },
    estimated_budget: { 
      type: "number", 
      description: "Budget travaux estimé en euros HT" 
    },
    site_visit_required: { 
      type: "boolean" 
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
      type: "string"
    },
    site_visit_contact_name: {
      type: "string"
    },
    site_visit_contact_email: {
      type: "string"
    },
    site_visit_slots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          time: { type: "string" },
          notes: { type: "string" }
        },
        required: ["date", "time"]
      }
    },
    required_team: {
      type: "array",
      items: {
        type: "object",
        properties: {
          specialty: { type: "string" },
          is_mandatory: { type: "boolean" },
          notes: { type: "string" },
          source: { type: "string" }
        },
        required: ["specialty", "is_mandatory"]
      }
    },
    moe_phases: {
      type: "array",
      items: {
        type: "string",
        enum: ["ESQ", "DIAG", "APS", "APD", "PRO", "ACT", "VISA", "DET", "AOR", "EXE", "OPC", "SSI"]
      }
    },
    deliverables_candidature: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          format: { type: "string" },
          is_mandatory: { type: "boolean" }
        }
      }
    },
    deliverables_offre: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          format: { type: "string" },
          is_mandatory: { type: "boolean" }
        }
      }
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, discipline_slug = 'architecture' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const LLAMA_PARSE_API_KEY = Deno.env.get('LLAMA_PARSE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!files || files.length === 0) {
      throw new Error("No files provided");
    }

    console.log(`[DCE Analysis] Starting analysis of ${files.length} files for discipline: ${discipline_slug}`);
    
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
    
    // Get the appropriate expert prompt
    const expertPrompt = getExpertPrompt(discipline_slug);
    
    // Build the content for AI analysis
    let analysisContent: string;
    
    if (parsedTexts.length > 0) {
      analysisContent = `CONTENU DES DOCUMENTS DCE:
${parsedTexts.join('\n\n')}

FICHIERS ANALYSÉS: ${files.map((f: { name: string }) => f.name).join(', ')}

Analyse ces documents DCE et extrais TOUTES les informations pour créer le dossier.
Utilise la fonction extract_tender_info pour retourner les données structurées.`;
    } else {
      const fileAnalyses = files.map((f: { name: string; type: string }) => {
        const docType = detectDocumentType(f.name);
        return `- ${f.name} (${formatDocType(docType)})`;
      }).join('\n');
      
      analysisContent = `LISTE DES FICHIERS DCE (contenu non accessible):
${fileAnalyses}

DISCIPLINE: ${discipline_slug}

Déduis les informations possibles à partir des NOMS DE FICHIERS.
Utilise la fonction extract_tender_info pour retourner les données structurées.`;
    }

    // Get tool parameters based on discipline
    const toolParams = getToolParameters(discipline_slug);

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
            content: expertPrompt
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
                properties: toolParams,
                required: ["title", "client_name"]
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

    // Add discipline to extracted data
    extractedData.discipline_slug = discipline_slug;

    // Count what was extracted for feedback
    const extractionStats = {
      files_analyzed: parsingStats.success > 0 ? parsingStats.success : files.length,
      files_skipped: parsingStats.failed,
      criteria_found: Array.isArray(extractedData.criteria) ? extractedData.criteria.length : 0,
      team_requirements: Array.isArray(extractedData.required_team) ? extractedData.required_team.length : 0,
      alerts_found: Array.isArray(extractedData.critical_alerts) ? extractedData.critical_alerts.length : 0,
      lots_found: Array.isArray(extractedData.lots) ? extractedData.lots.length : 0,
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
  if (lowerName.includes('programme') || lowerName.includes('note_programme') || lowerName.includes('brief')) {
    return 'programme';
  }
  if (lowerName.includes('avis') || lowerName.includes('publicite') || lowerName.includes('boamp')) {
    return 'avis_publicite';
  }
  if (lowerName.includes('bpu') || lowerName.includes('bordereau') || lowerName.includes('prix')) {
    return 'bpu';
  }
  if (lowerName.includes('dqe')) {
    return 'dqe';
  }
  if (lowerName.includes('cas_pratique') || lowerName.includes('cas pratique') || lowerName.includes('exercice')) {
    return 'cas_pratique';
  }
  if (lowerName.includes('visite') || lowerName.includes('attestation')) {
    return 'attestation_visite';
  }
  if (lowerName.match(/\bae\b/) || lowerName.includes('acte') || lowerName.includes('engagement')) {
    return 'acte_engagement';
  }
  if (lowerName.includes('dpgf')) {
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
    'programme': 'Programme / Brief',
    'avis_publicite': 'Avis de Publicité',
    'bpu': 'BPU - Bordereau de Prix Unitaires',
    'dqe': 'DQE - Détail Quantitatif Estimatif',
    'cas_pratique': 'Cas Pratique',
    'attestation_visite': 'Attestation de Visite',
    'acte_engagement': 'Acte d\'Engagement',
    'dpgf': 'DPGF - Bordereau des Prix',
    'plans': 'Plans',
    'autre': 'Autre document'
  };
  return labels[type] || type;
}
