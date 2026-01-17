import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type QuoteLineLike = {
  id: string;
  phase_code?: string;
  phase_name: string;
  phase_description?: string;
  line_type: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  amount?: number;
  is_included?: boolean;
  is_optional?: boolean;
  group_id?: string;
  sort_order?: number;
};

interface RequestBody {
  instruction: string;
  lines: QuoteLineLike[];
  projectType?: string;
  projectDescription?: string;
}

function safeNumber(n: unknown, fallback = 0) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instruction, lines, projectType, projectDescription } =
      (await req.json()) as RequestBody;

    if (!instruction || typeof instruction !== "string") {
      return new Response(JSON.stringify({ error: "Missing instruction" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return new Response(JSON.stringify({ error: "Missing lines" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const editableLines = lines
      .filter((l) => l && l.line_type !== "group")
      .map((l) => ({
        id: l.id,
        line_type: l.line_type,
        phase_code: l.phase_code,
        phase_name: l.phase_name,
        phase_description: l.phase_description,
        quantity: safeNumber(l.quantity, 1),
        unit: l.unit || "forfait",
        unit_price: safeNumber(l.unit_price, 0),
        is_included: l.is_included !== false,
        is_optional: !!l.is_optional,
      }));

    console.log("[edit-quote-lines] request", {
      projectType,
      linesCount: editableLines.length,
    });

    const systemPrompt = `Tu es un assistant expert en rédaction et structuration de devis.
Tu reçois une liste de lignes de devis avec des IDs. Tu dois MODIFIER les lignes selon l'instruction.

Contraintes:
- Tu DOIS conserver EXACTEMENT les mêmes IDs.
- Tu ne dois pas supprimer de lignes.
- Tu peux ajuster: phase_name, phase_description, quantity, unit, unit_price.
- Tu dois répondre UNIQUEMENT avec un JSON valide.
- Format attendu: {"lines": [{"id": "...", "phase_name": "...", "phase_description": "...", "quantity": 1, "unit": "forfait", "unit_price": 123.45}]}.
- Les champs non fournis seront conservés côté client.`;

    const userPrompt = `Type de projet: ${projectType || "(non précisé)"}
Contexte: ${projectDescription || "(non précisé)"}

Instruction: ${instruction}

Lignes à modifier (IDs obligatoires):
${JSON.stringify({ lines: editableLines }, null, 2)}

Réponds uniquement avec le JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[edit-quote-lines] AI gateway error", response.status, errorText);
      throw new Error("Erreur du service IA");
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "";

    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: { lines: Array<Record<string, unknown>> };
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("[edit-quote-lines] Failed to parse AI response", clean);
      throw new Error("Réponse IA invalide");
    }

    if (!parsed?.lines || !Array.isArray(parsed.lines)) {
      throw new Error("Format IA inattendu");
    }

    const allowedIds = new Set(editableLines.map((l) => l.id));
    const normalized = parsed.lines
      .filter((l) => typeof l.id === "string" && allowedIds.has(l.id as string))
      .map((l) => ({
        id: l.id as string,
        phase_name: typeof l.phase_name === "string" ? (l.phase_name as string) : undefined,
        phase_description:
          typeof l.phase_description === "string" ? (l.phase_description as string) : undefined,
        quantity: l.quantity === undefined ? undefined : safeNumber(l.quantity, 1),
        unit: typeof l.unit === "string" ? (l.unit as string) : undefined,
        unit_price: l.unit_price === undefined ? undefined : safeNumber(l.unit_price, 0),
      }));

    console.log("[edit-quote-lines] success", { updatedCount: normalized.length });

    return new Response(JSON.stringify({ lines: normalized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[edit-quote-lines] error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
