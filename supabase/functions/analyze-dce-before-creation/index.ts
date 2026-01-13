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

const SCENOGRAPHIE_EXPERT_PROMPT = `Tu es l'EXPERT NUMÉRO UN en marchés publics de scénographie, muséographie et aménagement d'expositions en France. 
Tu analyses les DCE avec une précision PARFAITE pour les agences de scénographie et design d'exposition.

## TON EXPERTISE
- 20 ans d'expérience sur les marchés culturels (musées, centres d'art, monuments historiques)
- Expert des missions de scénographie d'exposition (temporaire, permanente, itinérante)
- Maîtrise des contraintes muséographiques (conservation préventive, éclairage, accessibilité)
- Connaissance approfondie des acteurs culturels (DRAC, Ministère de la Culture, collectivités)

## TA MISSION CRITIQUE
Analyse CHAQUE LIGNE des documents DCE et extrais TOUTES les informations avec une précision de 100%.
Comprends le CONTEXTE CULTUREL, les ENJEUX ARTISTIQUES et les CONTRAINTES TECHNIQUES.

## STRUCTURE DU MARCHÉ - EXTRACTION OBLIGATOIRE

### 1. TYPE D'EXPOSITION
- **Nature**: Permanente, temporaire, itinérante
- **Thématique**: Art contemporain, histoire, sciences, patrimoine, ethnographie, etc.
- **Commissariat**: Commissaire(s) d'exposition mentionné(s)
- **Institution**: Musée, centre d'art, monument historique, espace culturel

### 2. SURFACES ET ESPACES
- Surface d'exposition en m² (CRITIQUE!)
- Nombre de salles ou d'espaces
- Hauteur sous plafond
- Contraintes spatiales (colonnes, vitrines existantes, accès)
- Espaces annexes (réserves, ateliers, accueil)

### 3. DURÉE ET CALENDRIER
- Durée de l'exposition (mois/années)
- Date de vernissage/ouverture au public
- Délai de montage prévu
- Délai de conception (études préalables)
- Planning des phases (APS, APD, PRO, EXE, montage)

### 4. PROGRAMME MUSÉOGRAPHIQUE
- Nombre d'œuvres ou objets à présenter (estimation)
- Types d'œuvres: peintures, sculptures, objets, archives, audiovisuel
- Contraintes de conservation: température, hygrométrie, éclairage (lux)
- Dispositifs multimédia demandés (vidéo, interactif, son)
- Parcours de visite: libre, chronologique, thématique

### 5. ITINÉRANCE (si applicable)
- L'exposition est-elle prévue pour itinérer?
- Lieux d'itinérance mentionnés
- Contraintes de transport et démontabilité
- Adaptabilité à différents espaces

### 6. BUDGET ET ENVELOPPE
- Budget travaux scénographie en € HT
- Budget complémentaire (graphisme, multimédia, éclairage)
- Enveloppe globale de l'exposition
- Part régie / marché

### 7. ÉQUIPE ATTENDUE (PROFILS SCÉNOGRAPHIE)
Profils types à identifier:
- Scénographe / Architecte d'intérieur
- Graphiste d'exposition / Signalétique
- Éclairagiste / Concepteur lumière
- Designer multimédia / Audiovisuel
- Conservateur consultant
- Muséographe
- Économiste de la construction
- BET structure (pour éléments porteurs)
- Artisan (ébéniste, métallier, socleur)

### 8. CRITÈRES DE JUGEMENT
CRITIQUE: Extrais CHAQUE critère avec sa pondération EXACTE
Format typique pour marchés culturels:
- Qualité artistique et créative: 40-50%
- Méthodologie et organisation: 20-30%
- Prix: 20-30%
Attention aux sous-critères fréquents:
- Compréhension du programme
- Références similaires
- Moyens humains et techniques

### 9. CONTRAINTES TECHNIQUES SPÉCIFIQUES
- Accessibilité PMR (obligatoire)
- Sécurité incendie (ERP catégorie)
- Conservation préventive (conditions climatiques)
- Réversibilité des aménagements
- Protection des sols et murs patrimoniaux
- Normes d'éclairage muséographique (50 lux dessins, 150 lux peintures, etc.)

### 10. PIÈCES À REMETTRE
PHASE CANDIDATURE:
- DC1, DC2, attestations
- Références muséographiques (combien? quels critères?)
- Moyens humains et matériels
- Chiffre d'affaires spécifique culturel

PHASE OFFRE:
- Note méthodologique
- Parti scénographique / esquisse
- Planning d'exécution
- Cadre de décomposition des prix / DPGF

### 11. DATES CRITIQUES
- Date limite de remise des CANDIDATURES
- Date limite de remise des OFFRES
- Date de JURY prévisionnelle
- Date de NOTIFICATION prévisionnelle
- Date de VERNISSAGE (objectif final!)

### 12. ALERTES ET POINTS D'ATTENTION
Génère des alertes sur:
- Délais très courts (fréquents dans le culturel)
- Contraintes patrimoniales (monuments classés)
- Exigences de conservation strictes
- Budget limité vs ambition du programme
- Références très spécifiques demandées
- Visite de site OBLIGATOIRE

## RÈGLES D'OR
1. NE DEVINE JAMAIS - extrais UNIQUEMENT ce qui est ÉCRIT
2. Si une info n'est pas trouvée → null (pas "non précisé")
3. Pour les montants: TOUJOURS en euros HT
4. Pour les dates: TOUJOURS au format YYYY-MM-DD
5. Pour les surfaces: TOUJOURS en m²
6. CITE tes sources (RC page X, CCTP article Y, programme section Z)

## FORMAT DE SORTIE
Utilise OBLIGATOIREMENT la fonction extract_tender_info avec TOUS les champs pertinents.`;

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
      enum: ["mapa", "ouvert", "restreint", "concours", "concours_restreint", "concours_ouvert", "dialogue_competitif", "negociee", "partenariat_innovation", "appel_offres_ouvert", "appel_offres_restreint", "adapte", "autre"],
      description: "Type de procédure de passation. Cherche dans le RC ou l'avis les mentions: MAPA (marché à procédure adaptée), concours restreint, concours ouvert, appel d'offres ouvert (AOO), appel d'offres restreint (AOR), procédure négociée, dialogue compétitif, etc." 
    },
    submission_type: {
      type: "string",
      enum: ["candidature", "offre", "candidature_offre"],
      description: "Type de remise: 'candidature' si phase de sélection puis offre séparée, 'offre' si offre directe, 'candidature_offre' si simultané"
    },
    dce_url: {
      type: "string",
      description: "URL vers la plateforme de téléchargement du DCE (AWS, PLACE, marches-publics.gouv.fr, achatpublic.com, etc.)"
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
      // Localisation (adresse du projet/mission si mentionnée)
      location: {
        type: "string",
        description: "Adresse ou localisation géographique du projet/mission si mentionnée (ville, département, adresse de l'annonceur)"
      },
      // Structure du marché
      is_multi_attributaire: {
        type: "boolean",
        description: "Le marché global est-il multi-attributaires? (ATTENTION: peut aussi être par lot)"
      },
      nb_attributaires: {
        type: "number",
        description: "Nombre total d'agences qui seront retenues (si multi-attributaire global)"
      },
      // Lots - ENRICHIS avec multi-attributaire et budgets par lot
      lots: {
        type: "array",
        description: "Liste EXHAUSTIVE des lots du marché avec TOUTES leurs caractéristiques",
        items: {
          type: "object",
          properties: {
            numero: { type: "number", description: "Numéro du lot (1, 2, 3...)" },
            intitule: { type: "string", description: "Intitulé EXACT du lot tel qu'il apparaît dans le RC" },
            domaine: { 
              type: "string", 
              enum: ["graphisme", "impression", "digital", "evenementiel", "video", "strategie", "rp", "signaletique", "global", "conseil", "creation", "production", "autre"],
              description: "Domaine principal du lot" 
            },
            description: { type: "string", description: "Description des prestations attendues pour ce lot" },
            // BUDGETS PAR LOT
            budget_min: { type: "number", description: "Montant MINIMUM du lot en € HT (si indiqué séparément)" },
            budget_max: { type: "number", description: "Montant MAXIMUM du lot en € HT (si indiqué séparément)" },
            // MULTI-ATTRIBUTAIRE PAR LOT
            is_multi_attributaire: { type: "boolean", description: "CE LOT est-il multi-attributaires? (plusieurs agences sur ce lot)" },
            nb_attributaires: { type: "number", description: "Nombre d'attributaires pour CE LOT spécifique" },
            // Durée spécifique au lot si différente
            duree_mois: { type: "number", description: "Durée spécifique du lot en mois (si différente du marché global)" },
            nb_reconductions: { type: "number", description: "Nombre de reconductions pour ce lot (si différent)" }
          },
          required: ["numero", "intitule", "domaine"]
        }
      },
      // Montants accord-cadre GLOBAL (si pas par lot)
      montant_minimum: {
        type: "number",
        description: "Montant MINIMUM GLOBAL de l'accord-cadre en € HT (tous lots confondus)"
      },
      montant_maximum: {
        type: "number",
        description: "Montant MAXIMUM GLOBAL de l'accord-cadre en € HT (tous lots confondus)"
      },
      // Budget estimé (souvent dans les marchés de com)
      estimated_budget: {
        type: "number",
        description: "Budget estimé ou enveloppe prévisionnelle si mentionné en € HT"
      },
      // Durée
      duree_initiale_mois: {
        type: "number",
        description: "Durée initiale du marché en mois (souvent 12 ou 24)"
      },
      nb_reconductions: {
        type: "number",
        description: "Nombre de reconductions possibles (souvent 1 à 3)"
      },
      duree_reconduction_mois: {
        type: "number",
        description: "Durée de chaque reconduction en mois"
      },
      date_debut_mission: {
        type: "string",
        description: "Date prévue de début de mission/notification (YYYY-MM-DD)"
      },
      validite_offre_jours: {
        type: "number",
        description: "Durée de validité des offres en jours (cherche 'validité des offres' - souvent 90 ou 180)"
      },
      // Cas pratique
      cas_pratique: {
        type: "object",
        description: "Détails COMPLETS du cas pratique si requis. EXTRAIS LE BRIEF EN ENTIER!",
        properties: {
          requis: { type: "boolean", description: "Un cas pratique/exercice créatif est-il demandé?" },
          brief: { type: "string", description: "TEXTE COMPLET du brief du cas pratique - recopie le verbatim" },
          livrables: { 
            type: "array", 
            items: { type: "string" },
            description: "Liste des livrables attendus (ex: '3 pistes créatives', 'recommandation 5 pages', etc.)" 
          },
          format: { type: "string", description: "Format de rendu exigé (PDF, nombre de pages max, dimensions...)" },
          delai_jours: { type: "number", description: "Délai de réalisation du cas pratique en jours" },
          ponderation: { type: "number", description: "Pondération du cas pratique dans la note technique (%)" }
        }
      },
      // Audition
      audition: {
        type: "object",
        description: "Informations sur l'audition/soutenance orale",
        properties: {
          prevue: { type: "boolean", description: "Une audition est-elle prévue?" },
          date: { type: "string", description: "Date prévue de l'audition (YYYY-MM-DD) ou période" },
          duree_minutes: { type: "number", description: "Durée de la présentation en minutes" },
          format: { type: "string", description: "Format: présentiel, visio, ou les deux possibles" },
          lieu: { type: "string", description: "Lieu de l'audition si présentiel" }
        }
      },
      // Anciens prestataires
      anciens_prestataires: {
        type: "array",
        description: "Prestataires sortants/titulaires actuels du marché si mentionnés",
        items: {
          type: "object",
          properties: {
            nom: { type: "string", description: "Nom de l'agence/entreprise" },
            lot: { type: "string", description: "Lot concerné" },
            periode: { type: "string", description: "Période du marché précédent" }
          },
          required: ["nom"]
        }
      },
      // Équipe communication - profils métiers
      required_team: {
        type: "array",
        description: "Compétences/profils d'équipe mentionnés dans le marché",
        items: {
          type: "object",
          properties: {
            specialty: { 
              type: "string",
              enum: ["directeur_conseil", "directeur_creation", "directeur_clientele", "directeur_artistique", "chef_de_projet", "concepteur_redacteur", "graphiste", "integrateur_web", "motion_designer", "planneur_strategique", "social_media_manager", "community_manager", "photographe", "realisateur", "acheteur_media", "rp_influence", "autre"],
              description: "Type de profil métier"
            },
            is_mandatory: { type: "boolean", description: "Ce profil est-il obligatoire/exigé?" },
            notes: { type: "string", description: "Précisions sur le profil demandé" },
            source: { type: "string", description: "Source dans le DCE (RC article X, CCTP...)" }
          },
          required: ["specialty", "is_mandatory"]
        }
      },
      // Type de campagne/communication
      type_campagne: {
        type: "string",
        enum: ["evenementielle", "corporate", "institutionnelle", "digitale", "produit", "recrutement", "global", "360"],
        description: "Type principal de communication demandée"
      },
      cibles: {
        type: "string",
        description: "Cibles de communication mentionnées (habitants, salariés, touristes, jeunes, etc.)"
      },
      // Livrables attendus par phase
      deliverables_candidature: {
        type: "array",
        description: "Pièces à remettre en phase CANDIDATURE",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nom du document" },
            format: { type: "string", description: "Format exigé (PDF, nombre de pages...)" },
            is_mandatory: { type: "boolean" }
          }
        }
      },
      deliverables_offre: {
        type: "array",
        description: "Pièces à remettre en phase OFFRE",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nom du document" },
            format: { type: "string", description: "Format exigé" },
            is_mandatory: { type: "boolean" }
          }
        }
      }
    };
  }

  // Scenographie-specific parameters
  if (disciplineSlug === 'scenographie') {
    return {
      ...baseParams,
      // Exposition
      type_exposition: {
        type: "string",
        enum: ["permanente", "temporaire", "itinerante", "semi_permanente"],
        description: "Type d'exposition: permanente, temporaire, itinérante"
      },
      thematique_exposition: {
        type: "string",
        description: "Thématique de l'exposition (art contemporain, histoire, sciences, patrimoine...)"
      },
      commissaire_exposition: {
        type: "string",
        description: "Nom du commissaire d'exposition si mentionné"
      },
      lieu_exposition: {
        type: "string",
        description: "Nom et adresse du lieu d'exposition (musée, centre d'art...)"
      },
      // Surfaces
      surface_exposition: {
        type: "number",
        description: "Surface d'exposition en m² (CRITIQUE!)"
      },
      nombre_salles: {
        type: "number",
        description: "Nombre de salles ou d'espaces"
      },
      hauteur_sous_plafond: {
        type: "number",
        description: "Hauteur sous plafond en mètres"
      },
      // Durée
      duree_exposition_mois: {
        type: "number",
        description: "Durée de l'exposition en mois"
      },
      date_vernissage: {
        type: "string",
        description: "Date de vernissage/ouverture (YYYY-MM-DD)"
      },
      delai_montage_jours: {
        type: "number",
        description: "Délai de montage prévu en jours"
      },
      // Programme muséographique
      oeuvres_estimees: {
        type: "number",
        description: "Nombre d'œuvres ou objets à présenter"
      },
      types_oeuvres: {
        type: "array",
        items: { type: "string" },
        description: "Types d'œuvres: peintures, sculptures, archives, audiovisuel..."
      },
      dispositifs_multimedia: {
        type: "array",
        items: { type: "string" },
        description: "Dispositifs multimédia demandés: vidéo, interactif, sonore..."
      },
      parcours_type: {
        type: "string",
        enum: ["libre", "chronologique", "thematique", "mixte"],
        description: "Type de parcours de visite"
      },
      // Contraintes conservation
      contraintes_conservation: {
        type: "string",
        description: "Contraintes de conservation préventive (température, hygrométrie, lux...)"
      },
      eclairage_max_lux: {
        type: "number",
        description: "Niveau d'éclairage maximum autorisé en lux"
      },
      accessibilite_requise: {
        type: "boolean",
        description: "Accessibilité PMR requise"
      },
      contraintes_patrimoniales: {
        type: "string",
        description: "Contraintes liées au bâtiment (monument classé, réversibilité...)"
      },
      // Itinérance
      itinerance: {
        type: "boolean",
        description: "L'exposition est-elle prévue pour itinérer?"
      },
      lieux_itinerance: {
        type: "array",
        items: {
          type: "object",
          properties: {
            nom: { type: "string" },
            ville: { type: "string" },
            dates: { type: "string" }
          }
        },
        description: "Lieux d'itinérance prévus"
      },
      // Budget
      estimated_budget: {
        type: "number",
        description: "Budget scénographie en € HT"
      },
      budget_multimedia: {
        type: "number",
        description: "Budget complémentaire multimédia en € HT"
      },
      budget_graphisme: {
        type: "number",
        description: "Budget graphisme/signalétique en € HT"
      },
      // Équipe scénographie
      required_team: {
        type: "array",
        items: {
          type: "object",
          properties: {
            specialty: {
              type: "string",
              enum: ["scenographe", "architecte_interieur", "graphiste_exposition", "eclairagiste", "designer_multimedia", "museographe", "economiste", "bet_structure", "artisan_ebeniste", "artisan_metallier", "socleur", "restaurateur", "autre"]
            },
            is_mandatory: { type: "boolean" },
            notes: { type: "string" },
            source: { type: "string" }
          },
          required: ["specialty", "is_mandatory"]
        }
      },
      // Visite de site
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
      site_visit_contact_name: {
        type: "string"
      },
      // Livrables
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

Tu analyses un marché public de COMMUNICATION. Cherche et extrais avec PRÉCISION MAXIMALE:

### 1. IDENTIFICATION DU MARCHÉ
- **reference** = Numéro/référence de la consultation (cherche "référence", "n° marché", "n° consultation")
- **location** = Adresse ou ville du projet/annonceur (cherche l'adresse dans l'en-tête ou "siège social")
- **client_name** = Nom COMPLET de l'annonceur/MOA

### 2. DATE LIMITE - CRITIQUE!
- **submission_deadline** = Cherche "date limite", "remise des plis", "limite de réception"
- Format typique: "avant le [date] à [heure]" ou "[date] 12h00"
- N'OUBLIE PAS L'HEURE (souvent 12:00 ou 17:00)
- **submission_time** = Heure au format HH:MM

### 3. STRUCTURE DU MARCHÉ ET LOTS
- Le marché est-il ALLOTI? Combien de lots?
- POUR CHAQUE LOT, extrais:
  * numero: numéro du lot (1, 2, 3...)
  * intitule: titre EXACT
  * domaine: graphisme, impression, digital, événementiel, vidéo, stratégie, RP, signalétique, global
  * **is_multi_attributaire**: CE LOT est-il multi-attributaires?
  * **nb_attributaires**: combien d'agences retenues sur CE LOT?
  * **budget_min / budget_max**: montants min/max pour CE LOT si indiqués

### 4. MONTANTS ACCORD-CADRE
- **montant_minimum** = Montant minimum en € HT (global si pas par lot)
- **montant_maximum** = Montant maximum en € HT (global si pas par lot)
- Attention: souvent sur durée totale (4 ans avec reconductions)

### 5. DURÉE ET RECONDUCTIONS
- **duree_initiale_mois** = Durée initiale (souvent 12 ou 24 mois)
- **nb_reconductions** = Nombre de reconductions possibles
- **duree_reconduction_mois** = Durée de chaque reconduction
- **validite_offre_jours** = Validité des offres (cherche "validité" - souvent 90 ou 180 jours)

### 6. CAS PRATIQUE - TRÈS IMPORTANT!
Si un exercice créatif est demandé:
- **cas_pratique.requis** = true
- **cas_pratique.brief** = TEXTE COMPLET du brief (recopie verbatim!)
- **cas_pratique.livrables** = liste des livrables ("3 pistes créatives", "recommandation 10 pages"...)
- **cas_pratique.format** = format exigé (PDF, nombre de pages...)
- **cas_pratique.delai_jours** = délai de réalisation
- **cas_pratique.ponderation** = % dans la note finale

### 7. AUDITION/SOUTENANCE
- **audition.prevue** = une audition est-elle prévue?
- **audition.date** = date/période prévue
- **audition.duree_minutes** = durée (souvent 30-60 min)
- **audition.format** = présentiel, visio ou hybride

### 8. CRITÈRES DE JUGEMENT
Extrais CHAQUE critère avec sa pondération EXACTE:
- Cherche "critères de jugement", "critères d'attribution", "notation"
- Format typique: "Valeur technique: 60%" ou "Prix: 40 points"
- Attention aux sous-critères

### 9. ANCIENS PRESTATAIRES
Cherche "sortant", "titulaire actuel", "ancien marché", "prestataire actuel"

### 10. ALERTES ET POINTS D'ATTENTION
Génère des alertes (critical_alerts) pour:
- Délais très courts
- Documents PDF images non lisibles
- Informations manquantes critiques (montants, critères...)
- Exigences inhabituelles
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
