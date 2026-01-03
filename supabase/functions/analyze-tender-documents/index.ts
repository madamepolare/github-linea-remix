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
    const { documentUrl, documentType, tenderId, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Analyzing document for tender ${tenderId}, type: ${documentType}, file: ${fileName}`);

    // Define extraction schema based on document type
    const extractionPrompt = getExtractionPrompt(documentType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en marchés publics français spécialisé dans l'analyse des DCE (Dossiers de Consultation des Entreprises).
            
Tu analyses les documents de consultation pour en extraire les informations clés de manière structurée.
Tu es particulièrement attentif aux :
- Informations d'identification (numéro de consultation, code groupe, objet)
- Dates clés (dépôt, visite, jury, résultats)
- Critères de jugement et pondérations
- Exigences de compétences (architecte, BET, etc.)
- Pièces à remettre pour candidature et offre
- Contacts du maître d'ouvrage et pour la visite de site
- Conditions de groupement et variantes

Réponds UNIQUEMENT avec les données structurées demandées.`
          },
          {
            role: "user",
            content: `Analyse ce document DCE de type "${documentType}" (fichier: ${fileName}).

${extractionPrompt}

Document disponible à l'URL: ${documentUrl}

Extrais toutes les informations pertinentes.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tender_data",
              description: "Extrait les données structurées d'un document de consultation DCE",
              parameters: {
                type: "object",
                properties: {
                  consultation: {
                    type: "object",
                    description: "Informations d'identification du marché",
                    properties: {
                      number: { type: "string", description: "Numéro de consultation" },
                      reference: { type: "string", description: "Référence du marché" },
                      group_code: { type: "string", description: "Code groupe/opération" },
                      object: { type: "string", description: "Objet complet du marché" }
                    }
                  },
                  client: {
                    type: "object",
                    description: "Informations sur le maître d'ouvrage",
                    properties: {
                      name: { type: "string", description: "Nom du maître d'ouvrage" },
                      type: { type: "string", description: "Type: bailleur_social, collectivite, etat, hopital, universite, etablissement_public, prive" },
                      direction: { type: "string", description: "Direction spécifique" },
                      address: { type: "string", description: "Adresse complète" },
                      contact_name: { type: "string", description: "Nom du contact" },
                      contact_phone: { type: "string", description: "Téléphone" },
                      contact_email: { type: "string", description: "Email" }
                    }
                  },
                  project: {
                    type: "object",
                    description: "Informations sur le projet",
                    properties: {
                      location: { type: "string", description: "Adresse du projet" },
                      region: { type: "string", description: "Région" },
                      surface: { type: "number", description: "Surface en m²" },
                      description: { type: "string", description: "Description du projet" },
                      work_nature: { type: "array", items: { type: "string" }, description: "Nature des travaux" }
                    }
                  },
                  budget: {
                    type: "object",
                    description: "Informations budgétaires",
                    properties: {
                      amount: { type: "number", description: "Montant estimé en euros HT" },
                      disclosed: { type: "boolean", description: "Budget affiché ou non" },
                      notes: { type: "string", description: "Notes sur le budget" }
                    }
                  },
                  procedure: {
                    type: "object",
                    description: "Type de procédure et conditions",
                    properties: {
                      type: { type: "string", description: "ouvert, restreint, adapte, mapa, concours, dialogue, partenariat" },
                      allows_variants: { type: "boolean", description: "Variantes autorisées" },
                      allows_joint_venture: { type: "boolean", description: "Groupement autorisé" },
                      joint_venture_type: { type: "string", description: "conjoint ou solidaire" },
                      mandataire_solidary: { type: "boolean", description: "Mandataire solidaire obligatoire" },
                      negotiation: { type: "boolean", description: "Négociation prévue" },
                      negotiation_candidates: { type: "number", description: "Nombre de candidats pour négociation" },
                      offer_validity_days: { type: "number", description: "Durée de validité des offres en jours" }
                    }
                  },
                  deadlines: {
                    type: "object",
                    description: "Dates clés",
                    properties: {
                      submission: { type: "string", description: "Date limite de dépôt (format ISO)" },
                      submission_time: { type: "string", description: "Heure limite de dépôt" },
                      questions_days_before: { type: "number", description: "Jours avant deadline pour poser des questions" },
                      jury: { type: "string", description: "Date du jury/commission" },
                      results: { type: "string", description: "Date des résultats" }
                    }
                  },
                  site_visit: {
                    type: "object",
                    description: "Informations sur la visite de site",
                    properties: {
                      required: { type: "boolean", description: "Visite obligatoire" },
                      date: { type: "string", description: "Date de visite (format ISO)" },
                      location: { type: "string", description: "Lieu de RDV" },
                      contact_name: { type: "string", description: "Nom du contact pour la visite" },
                      contact_phone: { type: "string", description: "Téléphone du contact" },
                      contact_email: { type: "string", description: "Email du contact" }
                    }
                  },
                  selection_criteria: {
                    type: "array",
                    description: "Critères de jugement des offres",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom du critère" },
                        weight: { type: "number", description: "Pondération en %" },
                        type: { type: "string", description: "price, technical, delay, environmental, social" },
                        sub_criteria: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              weight: { type: "number" }
                            }
                          }
                        }
                      }
                    }
                  },
                  required_competencies: {
                    type: "array",
                    description: "Compétences requises dans l'équipe",
                    items: {
                      type: "object",
                      properties: {
                        specialty: { type: "string", description: "architecte, bet_structure, bet_fluides, bet_electricite, thermicien, economiste, acousticien, paysagiste, vrd, opc, ssi" },
                        mandatory: { type: "boolean", description: "Compétence obligatoire" },
                        requirements: { type: "string", description: "Exigences spécifiques" }
                      }
                    }
                  },
                  required_documents: {
                    type: "array",
                    description: "Pièces à remettre",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", description: "candidature ou offre" },
                        type: { type: "string", description: "dc1, dc2, dc4, ae, memoire_technique, attestation_assurance, references, etc." },
                        name: { type: "string", description: "Nom de la pièce" },
                        mandatory: { type: "boolean", description: "Pièce obligatoire" },
                        description: { type: "string", description: "Précisions" }
                      }
                    }
                  },
                  reference_requirements: {
                    type: "object",
                    description: "Exigences sur les références",
                    properties: {
                      count: { type: "number", description: "Nombre de références demandées" },
                      min_budget: { type: "number", description: "Budget minimum des références" },
                      max_age_years: { type: "number", description: "Ancienneté maximum (années)" },
                      specific_types: { type: "array", items: { type: "string" }, description: "Types de projets demandés" }
                    }
                  },
                  insurance_requirements: {
                    type: "array",
                    description: "Exigences d'assurance",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", description: "Type d'assurance (RC Pro, Décennale, etc.)" },
                        minimum_amount: { type: "number", description: "Montant minimum" }
                      }
                    }
                  },
                  moe_phases: {
                    type: "array",
                    description: "Phases de mission MOE demandées",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "ESQ, APS, APD, PRO, DCE, ACT, VISA, DET, AOR, OPC" },
                        name: { type: "string", description: "Nom complet de la phase" },
                        included: { type: "boolean", description: "Phase incluse dans la mission" }
                      }
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
C'est le document principal du DCE. Extrais TOUTES les informations suivantes:

1. IDENTIFICATION: Numéro de consultation, référence, code groupe/opération, objet du marché
2. MAÎTRE D'OUVRAGE: Nom, type, direction, adresse, contacts
3. PROCÉDURE: Type, groupement autorisé (type), variantes, négociation
4. DATES: Deadline dépôt (date ET heure), délai questions, visite site, jury, résultats
5. VISITE DE SITE: Obligatoire?, date, lieu RDV, contacts
6. CRITÈRES DE JUGEMENT: Nom, pondération %, sous-critères avec détails
7. COMPÉTENCES REQUISES: Spécialités (architecte, BET, etc.), obligatoires ou non
8. PIÈCES À REMETTRE: Candidature et offre séparément, obligatoires ou non
9. EXIGENCES RÉFÉRENCES: Nombre, budget min, ancienneté max, types de projets`;
    
    case 'lettre_consultation':
      return `Ce document est une Lettre de Consultation (généralement pour MAPA).
Extrais les informations principales:

1. IDENTIFICATION: Numéro, objet, référence
2. MAÎTRE D'OUVRAGE: Nom, direction, contacts
3. PROCÉDURE: Type (probablement MAPA/adapté)
4. DATES: Deadline dépôt, visite si mentionnée
5. CONTENU ATTENDU: Pièces à remettre`;

    case 'note_programme':
      return `Ce document est une Note de Programme ou Programme.
Extrais les informations projet:

1. PROJET: Description détaillée, objectifs, contraintes
2. SURFACE: m² par type d'espace si disponible
3. BUDGET: Enveloppe prévisionnelle
4. PHASES MOE: Missions demandées
5. EXIGENCES: Techniques, environnementales, fonctionnelles`;

    case 'attestation_visite':
      return `Ce document est une Attestation de Visite de site.
Extrais:

1. VISITE: Date, lieu, heure
2. CONTACTS: Nom et coordonnées de la personne responsable
3. CONDITIONS: Modalités pratiques`;
    
    case 'ccap':
      return `Ce document est un CCAP (Cahier des Clauses Administratives Particulières).
Extrais:

1. DÉLAIS: D'exécution par phase, pénalités
2. PAIEMENT: Conditions, acomptes, retenue de garantie
3. ASSURANCES: Types et montants minimums requis
4. GROUPEMENT: Conditions si mentionné
5. SOUS-TRAITANCE: Conditions`;
    
    case 'cctp':
      return `Ce document est un CCTP (Cahier des Clauses Techniques Particulières).
Extrais:

1. PROJET: Description technique détaillée
2. SURFACES: Par destination
3. EXIGENCES: Normes, performances, matériaux
4. PHASES MOE: Si mentionnées`;

    case 'contrat':
      return `Ce document est un Contrat ou Acte d'Engagement.
Extrais:

1. MONTANT: Prix global ou décomposition
2. DÉLAIS: D'exécution
3. PÉNALITÉS: Montants et conditions
4. CONDITIONS: Particulières`;

    case 'audit_technique':
      return `Ce document est un Audit ou Diagnostic technique.
Extrais:

1. BÂTIMENT: Description, année, surface
2. ÉTAT: Diagnostics réalisés
3. TRAVAUX: Préconisations, estimations`;
    
    default:
      return `Extrais toutes les informations pertinentes pour répondre à cet appel d'offres:
- Identification du marché
- Maître d'ouvrage et contacts
- Projet (localisation, surface, budget)
- Procédure et conditions
- Dates clés
- Critères de sélection
- Compétences requises
- Pièces à remettre`;
  }
}
