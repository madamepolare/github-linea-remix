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

const COMMUNICATION_EXPERT_PROMPT = `Tu es l'EXPERT NUMÉRO UN en marchés publics de communication en France. Tu analyses les DCE d'agences de communication avec une précision PARFAITE.

## TON EXPERTISE
- 20 ans d'expérience sur les marchés de communication publique
- Expert des accords-cadres multi-attributaires
- Maîtrise totale des BPU communication (taux journaliers DA, CR, CDP...)
- Connaissance exhaustive des procédures (MAPA, AOO, AORestreint, Concours)

## TA MISSION CRITIQUE
Analyse CHAQUE LIGNE des documents DCE et extrais TOUTES les informations avec une précision de 100%.
Tu dois comprendre le CONTEXTE, les ENJEUX et les SUBTILITÉS de chaque marché.

## STRUCTURE DU MARCHÉ - EXTRACTION OBLIGATOIRE

### 1. ALLOTISSEMENT ET MULTI-ATTRIBUTAIRES
- Le marché est-il alloti? Combien de LOTS?
- Pour CHAQUE LOT, extrais:
  * Numéro et intitulé EXACT
  * Domaine: graphisme, impression, digital, événementiel, vidéo, stratégie, RP, signalétique, global
  * Montant min/max par lot si indiqué
- Le marché est-il MULTI-ATTRIBUTAIRE? (plusieurs agences sur le même lot)
- Si oui, combien d'agences seront retenues par lot?

### 2. MONTANTS DE L'ACCORD-CADRE (CRITIQUE!)
- Cherche "montant minimum" et "montant maximum" dans le RC/CCAP
- Attention: ce sont souvent des montants sur 4 ans (durée totale avec reconductions)
- Format type: "sans montant minimum et avec un montant maximum de 400 000 € HT"
- EXTRAIS les montants EXACTS en euros HT

### 3. DURÉE ET RECONDUCTIONS
- Durée INITIALE du marché (souvent 12 ou 24 mois)
- Nombre de RECONDUCTIONS possibles (souvent 1 à 3)
- Durée de chaque reconduction
- Date de notification prévisionnelle / début de mission

### 4. VALIDITÉ DES OFFRES
- Cherche "validité des offres" ou "délai de validité"
- Généralement 90, 120 ou 180 jours
- CRITIQUE pour le rappel automatique avant expiration

### 5. CAS PRATIQUE / EXERCICE CRÉATIF (EXTRACTION DÉTAILLÉE!)
Si un cas pratique est demandé, extrais TOUT:
- Le BRIEF COMPLET (recopie le texte intégral si possible)
- Les LIVRABLES ATTENDUS (ex: "recommandation stratégique 5 pages", "3 pistes créatives")
- Le FORMAT de rendu (PDF, nombre de pages, dimensions...)
- Le DÉLAI pour réaliser le cas pratique
- La PONDÉRATION dans la note finale (souvent 20-40% de la valeur technique)
- Les CONTRAINTES spécifiques

### 6. AUDITION / SOUTENANCE
- Une audition est-elle prévue?
- Date ou période envisagée
- Durée de la présentation (souvent 30-60 min)
- Format: présentiel, visio, hybride
- Qui sera présent côté MOA?

### 7. CRITÈRES DE JUGEMENT (PONDÉRATIONS EXACTES!)
CRITIQUE: Extrais CHAQUE critère avec sa pondération EXACTE
Format typique:
- Valeur technique: 60% (dont méthodologie 20%, références 20%, équipe 20%)
- Prix: 40%
OU avec cas pratique:
- Valeur technique hors cas: 40%
- Cas pratique: 20%
- Prix: 40%

### 8. ANCIENS PRESTATAIRES
Cherche dans le RC ou CCAP si mentionné:
- Titulaire(s) sortant(s)
- Ancien marché (montants, durée)
- Cette info est PRÉCIEUSE pour comprendre le contexte

### 9. ÉQUIPE ATTENDUE (PROFILS COMMUNICATION)
Profils types à identifier:
- Directeur conseil / Directeur de clientèle
- Directeur de création / Directeur artistique
- Chef de projet / Chef de publicité
- Concepteur-rédacteur
- Planneur stratégique
- Social media manager / Community manager
- Motion designer / Vidéaste
- Photographe
- Acheteur média
- RP / Relations presse / Influence

### 10. PIÈCES À REMETTRE
PHASE CANDIDATURE:
- DC1, DC2, attestations...
- Références (combien? quel montant minimum?)
- Moyens humains et techniques

PHASE OFFRE:
- Mémoire technique (nombre de pages max?)
- BPU rempli
- Cas pratique
- Planning d'intervention

### 11. DATES CRITIQUES
- Date limite de remise des CANDIDATURES
- Date limite de remise des OFFRES
- Date d'AUDITION prévue
- Date de NOTIFICATION prévisionnelle

### 12. ALERTES ET POINTS D'ATTENTION
Génère des alertes sur:
- Délais serrés pour le cas pratique
- Exigences inhabituelles (assurances élevées, CA minimum...)
- Références spécifiques demandées
- Exclusivité sectorielle
- Conflits d'intérêts potentiels

## RÈGLES D'OR
1. NE DEVINE JAMAIS - extrais UNIQUEMENT ce qui est ÉCRIT
2. Si une info n'est pas trouvée → null (pas "non précisé")
3. Pour les montants: TOUJOURS en euros HT
4. Pour les dates: TOUJOURS au format YYYY-MM-DD
5. Pour les heures: TOUJOURS au format HH:MM
6. CITE tes sources (RC page X, CCAP article Y)

## FORMAT DE SORTIE
Utilise OBLIGATOIREMENT la fonction extract_tender_info avec TOUS les champs pertinents.`;

const SCENOGRAPHIE_EXPERT_PROMPT = `Tu es un expert en marchés publics culturels, spécialisé dans les appels d'offres de scénographie, muséographie et expositions.

Ton rôle est d'analyser les DCE pour les marchés de scénographie d'exposition.`;

// Helper: Check if content is a URL
function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

// Helper: Download file from URL and return as base64
async function downloadAndEncode(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Upload a document to LlamaParse and return the job ID (fast operation)
async function uploadToLlamaParse(file: { name: string; type: string; content: string }, apiKey: string): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    let binaryContent: ArrayBuffer;
    
    // Check if content is a URL (from Supabase storage) or base64
    if (isUrl(file.content)) {
      console.log(`[LlamaParse] Content is URL, downloading: ${file.name}`);
      const response = await fetch(file.content);
      if (!response.ok) {
        return { success: false, error: `Download failed: ${response.status}` };
      }
      binaryContent = await response.arrayBuffer();
    } else {
      // Try to decode as base64, but handle errors gracefully
      try {
        // Clean the base64 string (remove data URL prefix if present)
        let base64Content = file.content;
        if (base64Content.includes(',')) {
          base64Content = base64Content.split(',')[1];
        }
        // Replace URL-safe chars if present
        base64Content = base64Content.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(base64Content);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
        binaryContent = bytes.buffer as ArrayBuffer;
      } catch (base64Error) {
        console.error(`[LlamaParse] Base64 decode failed for ${file.name}, skipping`);
        return { success: false, error: 'Invalid base64 encoding' };
      }
    }
    
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
    console.log(`[LlamaParse] Upload OK: ${file.name} -> job ${uploadResult.id}`);
    return { success: true, jobId: uploadResult.id };
  } catch (error) {
    console.error(`[LlamaParse] Upload error for ${file.name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Poll for a specific job result with short timeout
async function pollLlamaParseResult(jobId: string, fileName: string, apiKey: string, maxWaitMs: number = 20000): Promise<{ success: boolean; text?: string; error?: string }> {
  const pollInterval = 1500;
  let elapsed = 0;
  
  while (elapsed < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    elapsed += pollInterval;
    
    try {
      const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      
      if (!statusResponse.ok) continue;
      
      const statusResult = await statusResponse.json();
      
      if (statusResult.status === 'SUCCESS') {
        const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        
        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          const text = resultData.markdown || resultData.text || '';
          return { success: true, text };
        }
      } else if (statusResult.status === 'ERROR') {
        return { success: false, error: 'Parsing failed' };
      }
    } catch {
      // Continue polling
    }
  }
  
  return { success: false, error: 'Timeout' };
}

// Legacy function for backward compatibility
async function parseDocument(file: { name: string; type: string; content: string }, apiKey: string): Promise<{ success: boolean; text?: string; error?: string }> {
  const upload = await uploadToLlamaParse(file, apiKey);
  if (!upload.success || !upload.jobId) {
    return { success: false, error: upload.error };
  }
  return await pollLlamaParseResult(upload.jobId, file.name, apiKey, 20000);
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
    let parsingStats = { success: 0, failed: 0, skipped: 0 };
    
    // Prioritize important documents first
    const getPriority = (fileName: string): number => {
      const lowerName = fileName.toLowerCase();
      if (lowerName.match(/\brc\b/) || lowerName.includes('reglement') || lowerName.includes('règlement')) return 1;
      if (lowerName.includes('ccap') || lowerName.includes('clauses_admin')) return 2;
      if (lowerName.includes('avis') || lowerName.includes('publicite')) return 3;
      if (lowerName.includes('cctp') || lowerName.includes('clauses_tech')) return 4;
      if (lowerName.includes('programme') || lowerName.includes('brief')) return 5;
      if (lowerName.includes('bpu') || lowerName.includes('bordereau')) return 6;
      if (lowerName.includes('acte') || lowerName.includes('engagement')) return 7;
      if (lowerName.includes('charte')) return 10; // Low priority - often just reference
      if (lowerName.includes('annexe') && !lowerName.includes('bpu')) return 9; // Low priority unless BPU
      return 8;
    };
    
    // Sort files by priority
    const sortedFiles = [...files].sort((a, b) => getPriority(a.name) - getPriority(b.name));
    
    // Limit to first 5 most important documents to avoid CPU timeout
    const MAX_DOCS = 5;
    const filesToProcess = sortedFiles.slice(0, MAX_DOCS);
    
    console.log(`[DCE Analysis] Processing top ${filesToProcess.length} files (of ${files.length} total): ${filesToProcess.map((f: { name: string }) => f.name).join(', ')}`);
    if (sortedFiles.length > MAX_DOCS) {
      console.log(`[DCE Analysis] Skipped lower priority files: ${sortedFiles.slice(MAX_DOCS).map((f: { name: string }) => f.name).join(', ')}`);
    }
    
    if (LLAMA_PARSE_API_KEY) {
      console.log(`[DCE Analysis] LlamaParse API key found - processing ${filesToProcess.length} documents`);
      
      // STEP 1: Upload documents in parallel (but only the prioritized ones)
      console.log('[DCE Analysis] Step 1: Uploading documents...');
      const uploadPromises = filesToProcess.map(async (file: { name: string; type: string; content: string }) => {
        const result = await uploadToLlamaParse(file, LLAMA_PARSE_API_KEY);
        return { fileName: file.name, ...result };
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(r => r.success && r.jobId);
      console.log(`[DCE Analysis] Uploads complete: ${successfulUploads.length}/${filesToProcess.length} successful`);
      
      // Log failed uploads
      const failedUploads = uploadResults.filter(r => !r.success);
      if (failedUploads.length > 0) {
        console.log(`[DCE Analysis] Failed uploads: ${failedUploads.map(u => `${u.fileName}: ${u.error}`).join(', ')}`);
      }
      
      // STEP 2: Poll for results with shorter timeouts
      console.log('[DCE Analysis] Step 2: Retrieving parsed content...');
      const startTime = Date.now();
      const maxTotalTime = 35000; // 35 seconds max for all polling (reduced from 45)
      
      for (const upload of successfulUploads) {
        const elapsed = Date.now() - startTime;
        if (elapsed > maxTotalTime) {
          console.log(`[DCE Analysis] Time limit reached after ${parsingStats.success} documents`);
          parsingStats.skipped = successfulUploads.length - parsingStats.success - parsingStats.failed;
          break;
        }
        
        // Calculate remaining time, 6s per doc max
        const remainingTime = maxTotalTime - elapsed;
        const docsRemaining = successfulUploads.length - parsingStats.success - parsingStats.failed;
        const timePerDoc = Math.max(5000, Math.min(10000, remainingTime / docsRemaining));
        
        const result = await pollLlamaParseResult(upload.jobId!, upload.fileName, LLAMA_PARSE_API_KEY, timePerDoc);
        
        if (result.success && result.text) {
          // Limit text size per document
          const truncatedText = result.text.substring(0, 30000);
          parsedTexts.push(`\n\n=== DOCUMENT: ${upload.fileName} ===\n\n${truncatedText}`);
          parsingStats.success++;
          console.log(`[DCE Analysis] ✓ ${upload.fileName} (${truncatedText.length} chars)`);
        } else {
          console.log(`[DCE Analysis] ✗ ${upload.fileName}: ${result.error}`);
          parsingStats.failed++;
        }
      }
      
      console.log(`[DCE Analysis] Parsing complete: ${parsingStats.success} success, ${parsingStats.failed} failed, ${parsingStats.skipped} skipped`);
    } else {
      console.log('[DCE Analysis] No LlamaParse API key - falling back to filename analysis');
    }
    
    // Get the appropriate expert prompt
    const expertPrompt = getExpertPrompt(discipline_slug);
    
    // Build the content for AI analysis
    let analysisContent: string;
    
    if (parsedTexts.length > 0) {
      // Build discipline-specific instructions
      const disciplineInstructions = discipline_slug === 'communication' 
        ? `
## INSTRUCTIONS SPÉCIFIQUES COMMUNICATION

Tu analyses un marché public de COMMUNICATION. Cherche et extrais avec précision:

1. **STRUCTURE DU MARCHÉ**
   - Recherche "allotissement", "lot n°", "nombre de lots"
   - Recherche "multi-attributaire", "nombre d'attributaires maximum"
   - Pour chaque lot: numéro, intitulé, domaine (graphisme/digital/événementiel...)

2. **MONTANTS ACCORD-CADRE**
   - Recherche "montant minimum", "montant maximum", "montant estimatif"
   - Attention: souvent exprimé sur la durée totale (4 ans)
   - Format fréquent: "sans minimum et avec un maximum de XXX € HT"

3. **CAS PRATIQUE - TRÈS IMPORTANT**
   - Recherche "cas pratique", "exercice", "mise en situation", "épreuve créative"
   - EXTRAIS LE BRIEF COMPLET mot pour mot
   - Note les livrables attendus (combien de pistes? format?)
   - Délai de réalisation
   - Pondération dans la note

4. **AUDITION**
   - Recherche "audition", "soutenance", "présentation orale", "jury"
   - Date, durée, format (visio/présentiel)

5. **ANCIENS TITULAIRES**
   - Recherche "sortant", "titulaire actuel", "marché précédent"
   - Nom de l'agence si mentionné

6. **CRITÈRES DE NOTATION**
   - Recherche "critères de jugement", "notation", "pondération"
   - EXTRAIT chaque critère avec son % EXACT
`
        : `
## INSTRUCTIONS POUR L'ANALYSE

Analyse ces documents DCE d'architecture et extrais:
- Toutes les dates critiques
- Le budget travaux
- Les critères de jugement avec pondérations
- L'équipe MOE requise
- Les pièces à remettre
`;

      analysisContent = `${disciplineInstructions}

## CONTENU DES DOCUMENTS DCE

${parsedTexts.join('\n\n')}

---

FICHIERS ANALYSÉS: ${files.map((f: { name: string }) => f.name).join(', ')}

## INSTRUCTIONS FINALES

1. Lis ATTENTIVEMENT chaque document
2. Extrais TOUTES les informations demandées
3. Pour chaque champ, cite la SOURCE (document + page/article si possible)
4. N'invente RIEN - si une info n'est pas trouvée, mets null
5. Utilise la fonction extract_tender_info pour retourner les données structurées`;
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

    // Normalize communication-specific data for frontend compatibility
    if (discipline_slug === 'communication') {
      // Convert anciens_prestataires from objects to strings if needed
      if (Array.isArray(extractedData.anciens_prestataires)) {
        extractedData.anciens_prestataires = (extractedData.anciens_prestataires as Array<unknown>).map((p: unknown) => {
          if (typeof p === 'string') return p;
          if (p && typeof p === 'object' && 'nom' in p) {
            const presta = p as { nom: string; lot?: string; periode?: string };
            let result = presta.nom;
            if (presta.lot) result += ` (Lot: ${presta.lot})`;
            if (presta.periode) result += ` - ${presta.periode}`;
            return result;
          }
          return String(p);
        });
      }

      // Ensure cas_pratique has the right structure
      if (extractedData.cas_pratique && typeof extractedData.cas_pratique === 'object') {
        const cp = extractedData.cas_pratique as Record<string, unknown>;
        if (cp.requis === undefined) {
          cp.requis = !!(cp.brief || cp.livrables);
        }
      }

      // Convert cibles from string to array if needed
      if (typeof extractedData.cibles === 'string') {
        extractedData.cibles = extractedData.cibles.split(',').map((c: string) => c.trim()).filter((c: string) => c);
      }

      console.log("[DCE Analysis] Communication data normalized", {
        lots: Array.isArray(extractedData.lots) ? extractedData.lots.length : 0,
        cas_pratique_requis: (extractedData.cas_pratique as Record<string, unknown>)?.requis,
        anciens_prestataires: Array.isArray(extractedData.anciens_prestataires) ? extractedData.anciens_prestataires.length : 0
      });
    }

    // Count what was extracted for feedback
    const extractionStats = {
      files_analyzed: parsingStats.success > 0 ? parsingStats.success : files.length,
      files_skipped: parsingStats.failed,
      criteria_found: Array.isArray(extractedData.criteria) ? extractedData.criteria.length : 0,
      team_requirements: Array.isArray(extractedData.required_team) ? extractedData.required_team.length : 0,
      alerts_found: Array.isArray(extractedData.critical_alerts) ? extractedData.critical_alerts.length : 0,
      lots_found: Array.isArray(extractedData.lots) ? extractedData.lots.length : 0,
      cas_pratique_found: !!(extractedData.cas_pratique && (extractedData.cas_pratique as Record<string, unknown>).requis),
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
