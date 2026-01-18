import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineaRequest {
  question: string;
  workspaceId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, workspaceId }: LineaRequest = await req.json();

    if (!question || !workspaceId) {
      return new Response(
        JSON.stringify({ error: "Question and workspaceId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data based on question keywords
    const lowerQuestion = question.toLowerCase();
    
    // Determine what data to fetch based on keywords
    const dataContext: Record<string, any> = {};

    // CA / Revenue related
    if (lowerQuestion.includes("ca") || lowerQuestion.includes("chiffre") || lowerQuestion.includes("revenue") || 
        lowerQuestion.includes("factur") || lowerQuestion.includes("montant")) {
      
      // Get invoices data
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, status, created_at, client_company_id, crm_companies(name)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(100);
      
      dataContext.invoices = invoices || [];

      // Get commercial documents (quotes)
      const { data: quotes } = await supabase
        .from("commercial_documents")
        .select("id, document_number, total_amount, status, created_at, client_company_id, crm_companies:client_company_id(name)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(100);
      
      dataContext.quotes = quotes || [];
    }

    // Client / Company related
    if (lowerQuestion.includes("client") || lowerQuestion.includes("entreprise") || lowerQuestion.includes("société") ||
        lowerQuestion.includes("company") || lowerQuestion.includes("direction")) {
      
      const { data: companies } = await supabase
        .from("crm_companies")
        .select("id, name, email, category, company_type, created_at")
        .eq("workspace_id", workspaceId)
        .limit(50);
      
      dataContext.companies = companies || [];

      // Get departments if direction is mentioned
      if (lowerQuestion.includes("direction") || lowerQuestion.includes("département")) {
        const { data: departments } = await supabase
          .from("company_departments")
          .select("id, name, company_id, crm_companies(name)")
          .eq("workspace_id", workspaceId)
          .limit(50);
        
        dataContext.departments = departments || [];
      }
    }

    // Project related
    if (lowerQuestion.includes("projet") || lowerQuestion.includes("project") || lowerQuestion.includes("chantier")) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, status, budget, start_date, end_date, client")
        .eq("workspace_id", workspaceId)
        .limit(50);
      
      dataContext.projects = projects || [];
    }

    // Task related
    if (lowerQuestion.includes("tâche") || lowerQuestion.includes("task") || lowerQuestion.includes("todo")) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, estimated_hours, actual_hours")
        .eq("workspace_id", workspaceId)
        .limit(100);
      
      dataContext.tasks = tasks || [];
    }

    // Time entries (heures)
    if (lowerQuestion.includes("heure") || lowerQuestion.includes("temps") || lowerQuestion.includes("time")) {
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("id, hours, date, task_id, project_id, user_id")
        .eq("workspace_id", workspaceId)
        .limit(200);
      
      dataContext.timeEntries = timeEntries || [];
    }

    // Contacts
    if (lowerQuestion.includes("contact") || lowerQuestion.includes("interlocuteur")) {
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name, email, role, crm_company_id")
        .eq("workspace_id", workspaceId)
        .limit(50);
      
      dataContext.contacts = contacts || [];
    }

    // Always fetch some summary stats
    const { data: projectCount } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    const { data: taskCount } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    const { data: companyCount } = await supabase
      .from("crm_companies")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    dataContext.stats = {
      totalProjects: projectCount?.length || 0,
      totalTasks: taskCount?.length || 0,
      totalCompanies: companyCount?.length || 0,
    };

    // Use OpenAI to generate response
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es Linea, l'assistant IA intelligent d'un logiciel de gestion d'agence d'architecture.
Tu as accès aux données de l'espace de travail de l'utilisateur pour répondre à ses questions.
Réponds toujours en français, de manière concise et professionnelle.
Utilise les données fournies pour calculer des statistiques, faire des comparaisons, et donner des insights.
Si tu ne trouves pas les données nécessaires, dis-le clairement.
Formate ta réponse de manière lisible avec des listes à puces ou des chiffres clés mis en valeur.`;

    const userPrompt = `Question de l'utilisateur: "${question}"

Données disponibles:
${JSON.stringify(dataContext, null, 2)}

Analyse les données et réponds à la question de l'utilisateur de manière précise et utile.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI error:", error);
      throw new Error("Failed to get AI response");
    }

    const aiData = await openaiResponse.json();
    const answer = aiData.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

    return new Response(
      JSON.stringify({ 
        answer,
        dataUsed: Object.keys(dataContext),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in linea-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
