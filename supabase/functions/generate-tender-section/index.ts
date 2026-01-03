import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenderId, sectionType, prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating section ${sectionType} for tender ${tenderId}`);

    // Fetch tender data for context
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: tender } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .single();

    const { data: documents } = await supabase
      .from('tender_documents')
      .select('*')
      .eq('tender_id', tenderId)
      .eq('is_analyzed', true);

    const { data: teamMembers } = await supabase
      .from('tender_team_members')
      .select(`
        *,
        company:crm_companies(name, industry, bet_specialties),
        contact:contacts(name, role)
      `)
      .eq('tender_id', tenderId);

    // Build context from tender data
    const context = buildContext(tender, documents || [], teamMembers || []);
    const systemPrompt = getSectionSystemPrompt(sectionType);

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
            content: systemPrompt
          },
          {
            role: "user",
            content: `${context}

${prompt ? `Instructions supplémentaires: ${prompt}\n\n` : ''}Génère maintenant le contenu de la section "${sectionType}" pour ce mémoire technique.

Le contenu doit être:
- Professionnel et adapté aux marchés publics français
- Structuré avec des titres et sous-titres
- Concret et spécifique au projet
- D'environ 500-1000 mots

Réponds directement avec le contenu formaté, sans introduction ni conclusion méta.`
          }
        ],
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
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ 
      success: true,
      content,
      sectionType,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-tender-section:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildContext(tender: any, documents: any[], teamMembers: any[]): string {
  let context = `# Contexte du marché\n\n`;
  
  if (tender) {
    context += `## Informations générales
- **Référence**: ${tender.reference || 'N/A'}
- **Titre**: ${tender.title || 'N/A'}
- **Maître d'ouvrage**: ${tender.client_name || 'N/A'}
- **Localisation**: ${tender.location || 'N/A'}
- **Budget estimé**: ${tender.estimated_budget ? `${(tender.estimated_budget / 1000000).toFixed(1)}M€` : 'N/A'}
- **Surface**: ${tender.surface_area ? `${tender.surface_area} m²` : 'N/A'}
- **Type de procédure**: ${tender.procedure_type || 'N/A'}

`;
  }

  if (teamMembers && teamMembers.length > 0) {
    context += `## Équipe constituée\n`;
    teamMembers.forEach(member => {
      const companyName = member.company?.name || 'Non défini';
      const specialty = member.specialty || member.company?.industry || 'N/A';
      context += `- **${member.role}** (${specialty}): ${companyName}\n`;
    });
    context += '\n';
  }

  if (documents && documents.length > 0) {
    context += `## Données extraites des documents\n`;
    documents.forEach(doc => {
      if (doc.extracted_data && Object.keys(doc.extracted_data).length > 0) {
        context += `### ${doc.document_type.toUpperCase()}\n`;
        context += JSON.stringify(doc.extracted_data, null, 2) + '\n\n';
      }
    });
  }

  return context;
}

function getSectionSystemPrompt(sectionType: string): string {
  const basePrompt = `Tu es un expert en rédaction de mémoires techniques pour les marchés publics français, spécialisé dans les projets d'architecture et de maîtrise d'œuvre.

Tu rédiges des contenus professionnels, structurés et convaincants pour les offres de marchés publics.`;

  switch (sectionType) {
    case 'presentation':
      return `${basePrompt}

Tu rédiges actuellement la section "Présentation de l'équipe" qui doit:
- Présenter le groupement et ses membres
- Mettre en avant les complémentarités
- Démontrer la cohérence du groupement
- Valoriser les synergies entre les compétences`;

    case 'references':
      return `${basePrompt}

Tu rédiges actuellement la section "Références et expériences" qui doit:
- Présenter les projets similaires réalisés
- Démontrer la pertinence par rapport au marché
- Mettre en avant les résultats obtenus
- Illustrer la maîtrise technique`;

    case 'methodologie':
      return `${basePrompt}

Tu rédiges actuellement la section "Note méthodologique" qui doit:
- Décrire l'approche proposée
- Détailler les phases de travail
- Expliquer les outils et méthodes
- Démontrer la maîtrise du processus`;

    case 'equipe':
      return `${basePrompt}

Tu rédiges actuellement la section "Moyens humains" qui doit:
- Présenter les intervenants clés
- Détailler leurs CV et compétences
- Montrer l'organisation de l'équipe
- Préciser les rôles et responsabilités`;

    case 'planning':
      return `${basePrompt}

Tu rédiges actuellement la section "Planning prévisionnel" qui doit:
- Proposer un planning détaillé
- Identifier les jalons clés
- Montrer la cohérence temporelle
- Anticiper les points critiques`;

    case 'qualite':
      return `${basePrompt}

Tu rédiges actuellement la section "Démarche qualité" qui doit:
- Décrire le système qualité
- Expliquer les contrôles prévus
- Montrer les outils de suivi
- Démontrer l'engagement qualité`;

    case 'environnement':
      return `${basePrompt}

Tu rédiges actuellement la section "Approche environnementale" qui doit:
- Présenter la démarche environnementale
- Expliquer les certifications visées
- Détailler les solutions durables
- Montrer l'engagement écologique`;

    default:
      return basePrompt;
  }
}
