import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expert system prompt for architecture public procurement
const ARCHITECTURE_EXPERT_PROMPT = `Tu es un expert en marchés publics français spécialisé dans l'analyse des DCE (Dossiers de Consultation des Entreprises) pour les concours d'architecture et les marchés de maîtrise d'œuvre.

## EXPERTISE MÉTIER

Tu maîtrises parfaitement :
- Le Code de la Commande Publique et ses procédures (MAPA, concours, appel d'offres ouvert/restreint, dialogue compétitif)
- Les missions de maîtrise d'œuvre selon la loi MOP : ESQ, DIAG, APS, APD, PRO, DCE, ACT, VISA, DET, AOR, OPC
- Les acteurs de la MOE : architecte mandataire, architectes associés, BET (structure, fluides, HQE, acoustique, VRD, économiste, paysagiste, OPC, SSI, etc.)
- Les documents du DCE : RC, CCAP, CCTP, AE, DC1-DC4, programme, plans, diagnostics
- Les critères de jugement : valeur technique (mémoire, méthodologie, équipe, références), prix, délais, environnement, insertion
- Les formes de groupement : conjoint, solidaire, mandataire désigné

## EXTRACTION INTELLIGENTE

Quand tu analyses un document, tu dois :
1. IDENTIFIER le type de document (RC, CCAP, programme, lettre de consultation, etc.)
2. EXTRAIRE avec précision les informations demandées
3. DÉDUIRE les informations implicites (ex: si "concours restreint" → procédure = "restreint")
4. ALERTER sur les points importants (visite obligatoire, conditions particulières, exigences fortes)

## POINTS CRITIQUES À REPÉRER

- Budget affiché ou non (et montant si affiché)
- Visite de site obligatoire (date, lieu, contact)
- Critères de jugement avec pondérations exactes
- Compétences obligatoires vs recommandées
- Références exigées (nombre, ancienneté, montant minimum, types de projets)
- Conditions de groupement (forme imposée, solidarité)
- Délais d'exécution par phase
- Pénalités de retard
- Assurances requises et montants minimum
- Phases de mission MOE demandées

Réponds UNIQUEMENT avec les données structurées demandées via l'outil de fonction fourni.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentUrl, documentType, tenderId, fileName, documentContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing document for tender ${tenderId}, type: ${documentType}, file: ${fileName}`);

    // Build the analysis prompt based on document type
    const extractionPrompt = getExtractionPrompt(documentType);
    
    // Build user message with available content
    let userMessage = `Analyse ce document DCE de type "${documentType}" (fichier: ${fileName}).\n\n${extractionPrompt}`;
    
    if (documentContent) {
      userMessage += `\n\n--- CONTENU DU DOCUMENT ---\n${documentContent.substring(0, 50000)}`;
    } else if (documentUrl) {
      userMessage += `\n\nDocument disponible à l'URL: ${documentUrl}\n\nNote: Si tu ne peux pas accéder directement au contenu, analyse au mieux en fonction du nom de fichier et du type de document.`;
    }

    userMessage += `\n\nExtrais TOUTES les informations pertinentes de manière exhaustive.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Use pro model for complex document analysis
        messages: [
          {
            role: "system",
            content: ARCHITECTURE_EXPERT_PROMPT
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_data",
              description: "Extrait les données structurées d'un document de consultation DCE pour un concours d'architecture ou marché de maîtrise d'œuvre",
              parameters: {
                type: "object",
                properties: {
                  // Identification du marché
                  consultation: {
                    type: "object",
                    description: "Informations d'identification du marché",
                    properties: {
                      number: { type: "string", description: "Numéro de consultation" },
                      reference: { type: "string", description: "Référence du marché" },
                      group_code: { type: "string", description: "Code groupe/opération" },
                      object: { type: "string", description: "Objet complet du marché" },
                      lot_number: { type: "string", description: "Numéro de lot si applicable" }
                    }
                  },
                  
                  // Maître d'ouvrage
                  client: {
                    type: "object",
                    description: "Informations sur le maître d'ouvrage",
                    properties: {
                      name: { type: "string", description: "Nom du maître d'ouvrage" },
                      type: { type: "string", enum: ["bailleur_social", "collectivite", "etat", "hopital", "universite", "etablissement_public", "prive"], description: "Type de maître d'ouvrage" },
                      direction: { type: "string", description: "Direction ou service" },
                      address: { type: "string", description: "Adresse complète" },
                      contact_name: { type: "string", description: "Nom du contact" },
                      contact_phone: { type: "string", description: "Téléphone" },
                      contact_email: { type: "string", description: "Email" }
                    }
                  },
                  
                  // Projet
                  project: {
                    type: "object",
                    description: "Informations sur le projet",
                    properties: {
                      location: { type: "string", description: "Adresse du projet" },
                      city: { type: "string", description: "Ville" },
                      department: { type: "string", description: "Département" },
                      region: { type: "string", description: "Région" },
                      surface: { type: "number", description: "Surface en m²" },
                      description: { type: "string", description: "Description détaillée du projet" },
                      work_nature: { 
                        type: "array", 
                        items: { type: "string" }, 
                        description: "Nature des travaux: neuf, rehabilitation, extension, renovation, restructuration, demolition, amenagement, restauration" 
                      },
                      program_summary: { type: "string", description: "Résumé du programme fonctionnel" }
                    }
                  },
                  
                  // Budget
                  budget: {
                    type: "object",
                    description: "Informations budgétaires",
                    properties: {
                      amount: { type: "number", description: "Montant estimé en euros HT" },
                      disclosed: { type: "boolean", description: "Budget affiché publiquement" },
                      amount_type: { type: "string", enum: ["travaux", "honoraires", "global"], description: "Type de montant" },
                      notes: { type: "string", description: "Notes sur le budget (enveloppe indicative, etc.)" }
                    }
                  },
                  
                  // Procédure
                  procedure: {
                    type: "object",
                    description: "Type de procédure et conditions",
                    properties: {
                      type: { type: "string", enum: ["ouvert", "restreint", "adapte", "mapa", "concours", "dialogue", "partenariat", "negociee"], description: "Type de procédure" },
                      allows_variants: { type: "boolean", description: "Variantes autorisées" },
                      allows_joint_venture: { type: "boolean", description: "Groupement autorisé" },
                      joint_venture_type: { type: "string", enum: ["conjoint", "solidaire", "libre"], description: "Type de groupement" },
                      mandataire_solidary: { type: "boolean", description: "Mandataire solidaire obligatoire" },
                      mandataire_must_be_architect: { type: "boolean", description: "Le mandataire doit être architecte" },
                      negotiation: { type: "boolean", description: "Négociation prévue" },
                      negotiation_candidates: { type: "number", description: "Nombre de candidats pour négociation" },
                      offer_validity_days: { type: "number", description: "Durée de validité des offres en jours" },
                      candidates_count: { type: "number", description: "Nombre de candidats admis (concours restreint)" }
                    }
                  },
                  
                  // Dates
                  deadlines: {
                    type: "object",
                    description: "Dates clés",
                    properties: {
                      submission: { type: "string", description: "Date limite de dépôt (format ISO 8601: YYYY-MM-DD)" },
                      submission_time: { type: "string", description: "Heure limite de dépôt (HH:MM)" },
                      questions_deadline: { type: "string", description: "Date limite pour poser des questions" },
                      questions_days_before: { type: "number", description: "Jours avant deadline pour questions" },
                      jury: { type: "string", description: "Date du jury/commission (ISO 8601)" },
                      results: { type: "string", description: "Date estimée des résultats (ISO 8601)" },
                      contract_duration_months: { type: "number", description: "Durée du marché en mois" }
                    }
                  },
                  
                  // Visite de site
                  site_visit: {
                    type: "object",
                    description: "Informations sur la visite de site",
                    properties: {
                      required: { type: "boolean", description: "Visite obligatoire" },
                      date: { type: "string", description: "Date de visite (ISO 8601)" },
                      time: { type: "string", description: "Heure de la visite (HH:MM)" },
                      location: { type: "string", description: "Lieu de rendez-vous" },
                      contact_name: { type: "string", description: "Nom du contact pour la visite" },
                      contact_phone: { type: "string", description: "Téléphone du contact" },
                      contact_email: { type: "string", description: "Email du contact" },
                      notes: { type: "string", description: "Instructions particulières" }
                    }
                  },
                  
                  // Critères de jugement
                  selection_criteria: {
                    type: "array",
                    description: "Critères de jugement des offres avec pondérations",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom du critère" },
                        weight: { type: "number", description: "Pondération en %" },
                        type: { type: "string", enum: ["price", "technical", "delay", "environmental", "social", "innovation", "references"], description: "Type de critère" },
                        description: { type: "string", description: "Description ou attendus du critère" },
                        sub_criteria: {
                          type: "array",
                          description: "Sous-critères si mentionnés",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              weight: { type: "number" },
                              description: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  },
                  
                  // Équipe requise
                  required_competencies: {
                    type: "array",
                    description: "Compétences requises dans l'équipe de maîtrise d'œuvre",
                    items: {
                      type: "object",
                      properties: {
                        specialty: { 
                          type: "string", 
                          enum: ["architecte", "architecte_associe", "bet_structure", "bet_fluides", "bet_electricite", "thermicien", "economiste", "acousticien", "paysagiste", "vrd", "opc", "ssi", "bim", "hqe", "urbaniste", "scenographe", "eclairagiste", "signalétique"],
                          description: "Spécialité technique" 
                        },
                        mandatory: { type: "boolean", description: "Compétence obligatoire" },
                        requirements: { type: "string", description: "Exigences spécifiques (qualifications, expérience)" },
                        min_references: { type: "number", description: "Nombre minimum de références demandées" }
                      }
                    }
                  },
                  
                  // Documents à remettre
                  required_documents: {
                    type: "array",
                    description: "Pièces à remettre pour la candidature et l'offre",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["candidature", "offre"], description: "Phase de remise" },
                        type: { type: "string", description: "Type: dc1, dc2, dc4, ae, memoire_technique, attestation_assurance, kbis, references, moyens, planning, dpgf, bpu, note_intention, esquisses, etc." },
                        name: { type: "string", description: "Nom complet de la pièce" },
                        mandatory: { type: "boolean", description: "Pièce obligatoire" },
                        description: { type: "string", description: "Précisions, format attendu" },
                        max_pages: { type: "number", description: "Nombre maximum de pages si limité" }
                      }
                    }
                  },
                  
                  // Exigences de références
                  reference_requirements: {
                    type: "object",
                    description: "Exigences sur les références à fournir",
                    properties: {
                      count: { type: "number", description: "Nombre de références demandées" },
                      min_budget: { type: "number", description: "Budget minimum des références" },
                      max_age_years: { type: "number", description: "Ancienneté maximum (années)" },
                      specific_types: { type: "array", items: { type: "string" }, description: "Types de projets demandés (équipement public, logement, etc.)" },
                      specific_phases: { type: "array", items: { type: "string" }, description: "Phases MOE exigées dans les références" },
                      notes: { type: "string", description: "Autres précisions" }
                    }
                  },
                  
                  // Assurances requises
                  insurance_requirements: {
                    type: "array",
                    description: "Exigences d'assurance",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", description: "RC Pro, Décennale, etc." },
                        minimum_amount: { type: "number", description: "Montant minimum en euros" }
                      }
                    }
                  },
                  
                  // Phases MOE
                  moe_phases: {
                    type: "array",
                    description: "Phases de mission de maîtrise d'œuvre demandées",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", enum: ["DIAG", "ESQ", "APS", "APD", "PRO", "DCE", "ACT", "VISA", "DET", "AOR", "OPC", "EXE"], description: "Code de la phase" },
                        name: { type: "string", description: "Nom complet" },
                        included: { type: "boolean", description: "Phase incluse dans la mission" },
                        duration_weeks: { type: "number", description: "Durée estimée en semaines" }
                      }
                    }
                  },
                  
                  // Livrables spécifiques attendus
                  deliverables: {
                    type: "array",
                    description: "Livrables spécifiques attendus au concours",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom du livrable" },
                        format: { type: "string", description: "Format attendu (A1, A3, PDF, maquette, etc.)" },
                        quantity: { type: "number", description: "Nombre d'exemplaires" },
                        max_pages: { type: "number", description: "Limite de pages" },
                        description: { type: "string", description: "Description du contenu attendu" }
                      }
                    }
                  },
                  
                  // Indemnités et prime
                  compensation: {
                    type: "object",
                    description: "Indemnités de concours",
                    properties: {
                      amount: { type: "number", description: "Montant de l'indemnité par candidat (€ HT)" },
                      conditions: { type: "string", description: "Conditions d'attribution" },
                      winner_deduction: { type: "boolean", description: "Indemnité déduite des honoraires du lauréat" }
                    }
                  },
                  
                  // Alertes et points importants
                  important_notes: {
                    type: "array",
                    description: "Points importants, alertes, conditions particulières",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["warning", "info", "requirement", "deadline"], description: "Type d'alerte" },
                        title: { type: "string", description: "Titre court" },
                        description: { type: "string", description: "Description détaillée" }
                      }
                    }
                  },
                  
                  // Pénalités
                  penalties: {
                    type: "object",
                    description: "Pénalités de retard",
                    properties: {
                      daily_rate: { type: "number", description: "Taux journalier en euros ou fraction du marché" },
                      is_percentage: { type: "boolean", description: "Taux exprimé en pourcentage" },
                      max_amount: { type: "number", description: "Plafond des pénalités" },
                      notes: { type: "string", description: "Autres pénalités" }
                    }
                  }
                },
                required: []
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_tender_data" } }
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
    let extractedData = {};
    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        extractedData = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        console.log("Extracted data:", JSON.stringify(extractedData, null, 2));
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      extractedData,
      documentType,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-tender-documents:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getExtractionPrompt(documentType: string): string {
  switch (documentType) {
    case 'rc':
      return `Ce document est un Règlement de Consultation (RC).
C'est le document PRINCIPAL du DCE qui contient TOUTES les règles de la consultation.

EXTRAIS IMPÉRATIVEMENT :

1. IDENTIFICATION
   - Numéro de consultation
   - Référence du marché
   - Objet précis du marché
   - Nombre de lots

2. MAÎTRE D'OUVRAGE
   - Nom complet
   - Type (bailleur, collectivité, État...)
   - Adresse
   - Contact (nom, téléphone, email)

3. PROCÉDURE
   - Type exact (concours restreint, MAPA, AO ouvert/restreint)
   - Nombre de candidats admis
   - Groupement (autorisé? forme imposée? mandataire solidaire?)
   - Variantes autorisées?
   - Négociation prévue?

4. DATES CLÉS
   - Date ET heure limite de dépôt (CRITIQUE)
   - Date limite questions
   - Date visite de site
   - Date jury estimée
   - Date résultats estimée

5. VISITE DE SITE
   - Obligatoire ou facultative?
   - Date et heure
   - Lieu de RDV
   - Contact (nom, téléphone, email)

6. CRITÈRES DE JUGEMENT (TRÈS IMPORTANT)
   - Chaque critère avec sa pondération EXACTE en %
   - Sous-critères si mentionnés
   - Description de ce qui est évalué

7. ÉQUIPE REQUISE
   - Compétences obligatoires (architecte, BET...)
   - Compétences recommandées
   - Exigences de qualification

8. PIÈCES À REMETTRE
   - Candidature : DC1, DC2, DC4, références, moyens...
   - Offre : mémoire technique, planning, DPGF...
   - Format imposé, limites de pages

9. RÉFÉRENCES EXIGÉES
   - Nombre demandé
   - Budget minimum
   - Ancienneté maximum
   - Types de projets similaires demandés

10. INDEMNITÉS
    - Montant par candidat
    - Conditions d'attribution`;

    case 'lettre_consultation':
      return `Ce document est une Lettre de Consultation (généralement pour MAPA ou consultation simplifiée).

EXTRAIS :
- Objet du marché
- Maître d'ouvrage et contacts
- Date limite de remise
- Critères si mentionnés
- Pièces demandées
- Conditions particulières`;

    case 'note_programme':
    case 'programme':
      return `Ce document est un Programme ou Note de Programme.
Il décrit les besoins fonctionnels du projet.

EXTRAIS :
- Description détaillée du projet
- Surfaces par type d'espace
- Exigences fonctionnelles
- Contraintes techniques
- Performance énergétique attendue
- Budget si mentionné
- Planning prévisionnel du projet`;

    case 'attestation_visite':
      return `Ce document est une Attestation de Visite de site.

EXTRAIS :
- Date et heure de la visite
- Lieu de RDV
- Contact organisateur (nom, téléphone, email)
- Instructions pratiques`;
    
    case 'ccap':
      return `Ce document est un CCAP (Cahier des Clauses Administratives Particulières).

EXTRAIS :
- Durée du marché
- Délais d'exécution par phase
- Pénalités de retard (taux, plafond)
- Conditions de paiement
- Retenue de garantie
- Assurances exigées (types et montants)
- Conditions de groupement
- Conditions de sous-traitance
- Révision des prix`;
    
    case 'cctp':
      return `Ce document est un CCTP (Cahier des Clauses Techniques Particulières).

EXTRAIS :
- Description technique du projet
- Surfaces par destination
- Exigences techniques (normes, performances)
- Matériaux ou solutions imposés
- Contraintes de site`;

    case 'contrat':
    case 'ae':
      return `Ce document est un Acte d'Engagement ou Contrat.

EXTRAIS :
- Montant du marché
- Décomposition par phases MOE si présente
- Délais d'exécution
- Conditions particulières`;

    case 'diagnostic':
    case 'audit_technique':
      return `Ce document est un Diagnostic ou Audit technique.

EXTRAIS :
- Description du bâtiment existant
- État des lieux
- Contraintes identifiées
- Préconisations
- Estimations de travaux`;
    
    case 'plans':
      return `Ce document contient des Plans.

EXTRAIS :
- Type de plans (masse, niveaux, façades)
- Échelle
- Surface si cotée
- Informations techniques visibles`;

    default:
      return `Analyse ce document et extrais TOUTES les informations pertinentes pour répondre à ce concours d'architecture :

- Identification du marché (numéro, objet, référence)
- Maître d'ouvrage (nom, type, contacts)
- Projet (localisation, surface, programme, budget)
- Procédure (type, conditions de groupement)
- Dates clés (dépôt, visite, jury)
- Visite de site (obligatoire?, contacts)
- Critères de sélection avec pondérations
- Équipe requise (compétences obligatoires/recommandées)
- Pièces à remettre (candidature et offre)
- Exigences de références
- Phases MOE demandées
- Points importants / alertes`;
  }
}
