import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEmailRequest {
  prompt: string;
  recipientName: string;
  companyName?: string;
  senderName?: string;
  context?: string;
  tone?: 'formal' | 'friendly' | 'professional';
  language?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      recipientName, 
      companyName, 
      senderName = "L'équipe",
      context,
      tone = 'professional',
      language = 'fr'
    }: GenerateEmailRequest = await req.json();

    if (!prompt || !recipientName) {
      throw new Error('Prompt and recipient name are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating email with prompt:', prompt);

    const toneDescriptions: Record<string, string> = {
      formal: 'formel et respectueux',
      friendly: 'amical et chaleureux',
      professional: 'professionnel et courtois',
    };

    const systemPrompt = `Tu es un assistant expert en rédaction d'emails professionnels pour une agence d'architecture.
Tu dois rédiger des emails clairs, concis et efficaces.

Règles:
- Langue: ${language === 'fr' ? 'Français' : 'Anglais'}
- Ton: ${toneDescriptions[tone] || toneDescriptions.professional}
- Ne pas inclure les formules de politesse génériques comme "J'espère que vous allez bien"
- Aller droit au but
- Être concis mais complet
- Adapter le vouvoiement/tutoiement selon le contexte professionnel (utiliser le vouvoiement par défaut)

Contexte disponible:
- Destinataire: ${recipientName}${companyName ? ` de ${companyName}` : ''}
- Expéditeur: ${senderName}
${context ? `- Contexte additionnel: ${context}` : ''}

Tu dois générer UNIQUEMENT le corps de l'email (sans l'objet), en commençant par une salutation appropriée et en terminant par une formule de politesse.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_email',
              description: 'Génère le contenu de l\'email et un objet approprié',
              parameters: {
                type: 'object',
                properties: {
                  subject: {
                    type: 'string',
                    description: 'L\'objet de l\'email, court et descriptif (max 60 caractères)'
                  },
                  body: {
                    type: 'string',
                    description: 'Le corps de l\'email, incluant la salutation et la formule de politesse'
                  }
                },
                required: ['subject', 'body'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_email' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Trop de requêtes, veuillez réessayer plus tard.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits épuisés, veuillez recharger votre compte.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response:', JSON.stringify(aiResponse));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_email') {
      throw new Error('Unexpected AI response format');
    }

    const emailContent = JSON.parse(toolCall.function.arguments);

    console.log('Generated email:', emailContent);

    return new Response(JSON.stringify({
      subject: emailContent.subject,
      body: emailContent.body,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating email:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
