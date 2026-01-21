import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SchoolPeriod {
  start_date: string;
  end_date: string;
  type: "school" | "company";
  label?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { file_path, workspace_id, user_id } = await req.json();

    if (!file_path || !workspace_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download the PDF file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("apprentice-calendars")
      .download(file_path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use Lovable AI to analyze the calendar
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.lovable.dev/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this apprentice school calendar PDF and extract ALL periods.

For each period, identify:
1. Start date (format: YYYY-MM-DD)
2. End date (format: YYYY-MM-DD)  
3. Type: "school" if the apprentice is at school/formation, "company" if at the company
4. Label: optional description (e.g., "Semaine école", "Vacances", "Entreprise")

Common patterns to look for:
- Alternating weeks (1 week school, 1 week company)
- Block periods (2 weeks school, 2 weeks company)
- Specific dates marked for école/formation vs entreprise
- Calendar grids with colored days
- Legend indicating school vs company days

Return ONLY a valid JSON array of periods, no other text:
[
  {"start_date": "2024-09-02", "end_date": "2024-09-06", "type": "school", "label": "Semaine 1"},
  {"start_date": "2024-09-09", "end_date": "2024-09-13", "type": "company", "label": "Entreprise"}
]

Important:
- Extract ALL periods for the entire calendar year
- Include vacation periods if visible
- Be precise with dates
- If uncertain about a period, still include it with best guess`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI response error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response
    let periods: SchoolPeriod[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        periods = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("AI content:", content);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse calendar data",
          raw_response: content 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter only school periods and extract dates
    const schoolDates: string[] = [];
    const schoolPeriods: SchoolPeriod[] = periods.filter(p => p.type === "school");

    // Generate individual dates from periods
    for (const period of schoolPeriods) {
      const start = new Date(period.start_date);
      const end = new Date(period.end_date);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          schoolDates.push(d.toISOString().split("T")[0]);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        periods,
        school_periods: schoolPeriods,
        school_dates: schoolDates,
        total_school_days: schoolDates.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
