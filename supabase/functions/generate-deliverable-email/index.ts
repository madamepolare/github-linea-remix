import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateEmailRequest {
  deliverableName: string;
  phaseName?: string;
  projectName: string;
  description?: string;
  dueDate?: string;
  recipientName?: string;
  dropboxLink?: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      deliverableName,
      phaseName,
      projectName,
      description,
      dueDate,
      recipientName,
      dropboxLink,
      language = "fr",
    }: GenerateEmailRequest = await req.json();

    if (!deliverableName || !projectName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: deliverableName and projectName" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const systemPrompt = `Tu es un assistant professionnel spécialisé dans la rédaction d'emails pour une agence d'architecture et de design.
Tu génères des emails professionnels, courtois et concis pour l'envoi de livrables de projet.

Règles:
- Ton professionnel mais chaleureux
- Email concis (max 150 mots pour le corps)
- Mentionner clairement le livrable et le projet
- Si un lien de téléchargement est fourni, l'inclure de manière visible
- Terminer par une formule de politesse appropriée
- Langue: ${language === "fr" ? "français" : "anglais"}

Réponds UNIQUEMENT en JSON avec cette structure exacte:
{
  "subject": "Objet de l'email",
  "body": "Corps de l'email en texte simple (avec sauts de ligne \\n)"
}`;

    const userPrompt = `Génère un email professionnel pour l'envoi du livrable suivant:

Projet: ${projectName}
Livrable: ${deliverableName}
${phaseName ? `Phase: ${phaseName}` : ""}
${description ? `Description: ${description}` : ""}
${dueDate ? `Date d'échéance: ${dueDate}` : ""}
${recipientName ? `Destinataire: ${recipientName}` : ""}
${dropboxLink ? `Lien de téléchargement: ${dropboxLink}` : "Le lien de téléchargement sera ajouté par l'expéditeur."}

Génère un email professionnel et courtois.`;

    console.log("Calling Lovable AI for email generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate email content" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("AI response content:", content);

    // Parse JSON response
    let emailContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback: generate a simple email
      emailContent = {
        subject: `Livrable: ${deliverableName} - ${projectName}`,
        body: `Bonjour,\n\nVeuillez trouver ci-joint le livrable "${deliverableName}" pour le projet "${projectName}".\n\n${dropboxLink ? `Lien de téléchargement: ${dropboxLink}\n\n` : ""}Cordialement,\nL'équipe projet`,
      };
    }

    console.log("Generated email content:", emailContent);

    return new Response(JSON.stringify(emailContent), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in generate-deliverable-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
