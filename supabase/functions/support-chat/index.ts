import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es l'assistant de support intégré à une application de gestion de projets pour architectes et designers d'intérieur.

Tu dois aider les utilisateurs à comprendre et utiliser l'application. Voici les modules disponibles:

**Modules principaux:**
- **CRM**: Gestion des contacts, entreprises, leads et opportunités commerciales
- **Projets**: Suivi des projets d'architecture et design avec phases, tâches et documents
- **Devis**: Création et gestion des devis commerciaux avec phases et honoraires
- **Factures**: Facturation et suivi des paiements
- **Documents**: Gestion documentaire avec signatures électroniques
- **Planning**: Calendrier et planification des ressources
- **Équipe**: Gestion des membres, absences et alternants
- **Theothèque**: Bibliothèque d'objets et mobilier design
- **Appels d'offres**: Suivi des consultations et marchés publics

**Fonctionnalités clés:**
- Chaque module est accessible depuis la barre latérale
- Les paramètres permettent de personnaliser les types, statuts et catégories
- L'IA peut générer des suggestions de phases, descriptions et plannings
- Export PDF disponible pour devis et factures

**Règles:**
- Réponds toujours en français
- Sois concis et pratique
- Si l'utilisateur demande quelque chose que tu ne sais pas, propose de le mettre en contact avec le support humain
- Pour les bugs ou demandes complexes, suggère de contacter le support via WhatsApp (fonctionnalité à venir)
- Utilise des emojis avec modération pour rendre les réponses plus engageantes`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
