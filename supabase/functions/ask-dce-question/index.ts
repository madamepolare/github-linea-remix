import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPERT_PROMPT = `Tu es un expert en marchés publics français. Tu analyses les documents DCE pour répondre aux questions des utilisateurs.

RÈGLES:
1. Réponds UNIQUEMENT avec les informations trouvées dans les documents
2. Cite tes sources (nom du document)
3. Si tu ne trouves pas l'information, dis-le clairement
4. Sois précis et concis
5. Formatte bien ta réponse (listes, numéros)`;

// Download and parse a document from Supabase Storage
async function getDocumentContent(fileUrl: string, fileName: string): Promise<string> {
  const LLAMA_PARSE_API_KEY = Deno.env.get('LLAMA_PARSE_API_KEY');
  
  if (!LLAMA_PARSE_API_KEY) {
    console.log("[Ask DCE] No LlamaParse API key, cannot parse document");
    return "";
  }

  try {
    console.log(`[Ask DCE] Downloading: ${fileName}`);
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    
    const fileBlob = await response.blob();
    
    // Upload to LlamaParse
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    
    const uploadResponse = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}` },
      body: formData,
    });
    
    if (!uploadResponse.ok) throw new Error('LlamaParse upload failed');
    
    const { id: jobId } = await uploadResponse.json();
    console.log(`[Ask DCE] LlamaParse job: ${jobId}`);
    
    // Poll for completion (max 30s)
    let attempts = 0;
    while (attempts < 20) {
      await new Promise(r => setTimeout(r, 1500));
      attempts++;
      
      const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
        headers: { 'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}` },
      });
      
      if (!statusResponse.ok) continue;
      
      const { status } = await statusResponse.json();
      
      if (status === 'SUCCESS') {
        const resultResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
          headers: { 'Authorization': `Bearer ${LLAMA_PARSE_API_KEY}` },
        });
        
        if (resultResponse.ok) {
          const { markdown } = await resultResponse.json();
          console.log(`[Ask DCE] Parsed ${fileName}: ${markdown?.length || 0} chars`);
          return markdown || "";
        }
      } else if (status === 'ERROR') {
        throw new Error('Parsing failed');
      }
    }
    
    return "";
  } catch (error) {
    console.error(`[Ask DCE] Error parsing ${fileName}:`, error);
    return "";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenderId, question, documentIds } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!question) {
      throw new Error("Question is required");
    }

    console.log(`[Ask DCE] Question for tender ${tenderId}: "${question}"`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch documents for this tender
    const { data: documents, error: docError } = await supabase
      .from('tender_documents')
      .select('id, file_name, file_url, document_type, extracted_data')
      .eq('tender_id', tenderId);

    if (docError) {
      console.error('[Ask DCE] Error fetching documents:', docError);
      throw new Error('Failed to fetch tender documents');
    }

    if (!documents || documents.length === 0) {
      return new Response(JSON.stringify({
        answer: "Aucun document n'a été téléchargé pour ce marché. Veuillez d'abord ajouter des documents dans l'onglet DCE.",
        sources: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Ask DCE] Found ${documents.length} documents`);

    // Build context from documents - prioritize important ones
    const priorityOrder = ['rc', 'ccap', 'cctp', 'note_programme', 'avis', 'autre'];
    const sortedDocs = [...documents].sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.document_type || 'autre');
      const bIdx = priorityOrder.indexOf(b.document_type || 'autre');
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

    // Get content from documents (max 3 to avoid timeout)
    const documentsToAnalyze = sortedDocs.slice(0, 3);
    const documentContents: string[] = [];
    const usedSources: string[] = [];

    for (const doc of documentsToAnalyze) {
      // First check if we have extracted_data
      if (doc.extracted_data && typeof doc.extracted_data === 'object') {
        const dataStr = JSON.stringify(doc.extracted_data, null, 2);
        if (dataStr.length > 100) {
          documentContents.push(`\n=== ${doc.file_name} (données extraites) ===\n${dataStr.substring(0, 15000)}`);
          usedSources.push(doc.file_name);
          continue;
        }
      }
      
      // Otherwise, parse the document
      if (doc.file_url) {
        const content = await getDocumentContent(doc.file_url, doc.file_name);
        if (content) {
          documentContents.push(`\n=== ${doc.file_name} ===\n${content.substring(0, 20000)}`);
          usedSources.push(doc.file_name);
        }
      }
    }

    if (documentContents.length === 0) {
      return new Response(JSON.stringify({
        answer: "Je n'ai pas pu lire le contenu des documents. Essayez de relancer l'analyse DCE.",
        sources: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Ask DCE] Analyzing ${documentContents.length} documents`);

    // Call AI to answer the question
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
            content: EXPERT_PROMPT
          },
          {
            role: "user",
            content: `Question de l'utilisateur: "${question}"

DOCUMENTS DCE:
${documentContents.join('\n\n')}

Réponds à la question de manière précise en citant les documents sources.`
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ask DCE] AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "Je n'ai pas pu trouver de réponse.";

    console.log(`[Ask DCE] Answer generated (${answer.length} chars)`);

    return new Response(JSON.stringify({
      answer,
      sources: usedSources,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Ask DCE] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      answer: "Une erreur s'est produite lors de l'analyse. Veuillez réessayer.",
      sources: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
