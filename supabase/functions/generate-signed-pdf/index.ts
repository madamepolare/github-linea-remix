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
    const { token, linkId } = await req.json();

    if (!token && !linkId) {
      return new Response(JSON.stringify({ error: 'Token or linkId required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the link with all needed data
    let query = supabase
      .from('quote_public_links')
      .select(`
        *,
        document:commercial_documents(
          *,
          client_company:crm_companies(id, name, logo_url, address, city, postal_code),
          client_contact:contacts!commercial_documents_client_contact_id_fkey(id, name, email, phone)
        )
      `);
    
    if (token) {
      query = query.eq('token', token);
    } else {
      query = query.eq('id', linkId);
    }

    const { data: link, error: linkError } = await query.single();

    if (linkError || !link) {
      console.error('Link error:', linkError);
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!link.signed_at) {
      return new Response(JSON.stringify({ error: 'Document not signed' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if PDF already generated
    if (link.signed_pdf_url) {
      return new Response(JSON.stringify({ 
        success: true,
        pdf_url: link.signed_pdf_url,
        already_exists: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const document = link.document;
    if (!document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get phases
    const { data: phases } = await supabase
      .from('commercial_document_phases')
      .select('*')
      .eq('document_id', document.id)
      .order('sort_order');

    // Filter phases based on selected options if available
    let includedPhases = phases || [];
    if (link.options_selected && Object.keys(link.options_selected).length > 0) {
      includedPhases = includedPhases.filter(phase => {
        // If phase was an option, check if it was selected
        if (phase.line_type === 'option' || !phase.is_included) {
          return link.options_selected[phase.id] === true;
        }
        return phase.is_included;
      });
    }

    // Get agency info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, logo_url')
      .eq('id', link.workspace_id)
      .single();

    const { data: agencyProfile } = await supabase
      .from('billing_profiles')
      .select('*')
      .eq('workspace_id', link.workspace_id)
      .is('company_id', null)
      .is('contact_id', null)
      .maybeSingle();

    // Generate simple PDF with signature using native approach
    const pdfContent = await generateSignedPDFContent({
      document,
      phases: includedPhases,
      agency: {
        name: workspace?.name,
        logo_url: workspace?.logo_url,
        ...agencyProfile
      },
      link,
      signatureData: link.signature_data,
      signerName: link.signer_name,
      signedAt: link.signed_at,
      finalAmount: link.final_amount || document.total_amount
    });

    // Upload to storage
    const fileName = `${document.workspace_id}/${document.document_number}-signed-${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(fileName, pdfContent, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload PDF');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('signed-documents')
      .getPublicUrl(fileName);

    // Update link with PDF URL
    await supabase
      .from('quote_public_links')
      .update({ signed_pdf_url: publicUrl })
      .eq('id', link.id);

    // Also update document with signed PDF URL
    await supabase
      .from('commercial_documents')
      .update({ signed_pdf_url: publicUrl })
      .eq('id', document.id);

    console.log('Signed PDF generated and stored:', publicUrl);

    return new Response(JSON.stringify({
      success: true,
      pdf_url: publicUrl
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating signed PDF:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Generate a simple PDF with signature block
async function generateSignedPDFContent(data: {
  document: any;
  phases: any[];
  agency: any;
  link: any;
  signatureData: string;
  signerName: string;
  signedAt: string;
  finalAmount: number;
}): Promise<Uint8Array> {
  const { document, phases, agency, signatureData, signerName, signedAt, finalAmount } = data;
  
  // Simple PDF generation using raw PDF commands
  // This creates a basic but valid PDF with the signature
  
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Build content lines
  const lines: string[] = [];
  
  // Header
  lines.push(`DEVIS ${document.document_number}`);
  lines.push(`Statut: SIGNE`);
  lines.push('');
  lines.push(`${agency?.billing_name || agency?.name || 'Agence'}`);
  if (agency?.billing_address) {
    lines.push(`${agency.billing_address}`);
    lines.push(`${agency.billing_postal_code || ''} ${agency.billing_city || ''}`);
  }
  lines.push('');
  
  // Client
  if (document.client_company) {
    lines.push(`Client: ${document.client_company.name}`);
  }
  if (document.client_contact) {
    lines.push(`Contact: ${document.client_contact.name}`);
  }
  lines.push('');
  
  // Document info
  lines.push(`Projet: ${document.title}`);
  if (document.project_address) {
    lines.push(`Adresse: ${document.project_address}, ${document.postal_code || ''} ${document.project_city || ''}`);
  }
  lines.push('');
  
  // Phases
  lines.push('--- PRESTATIONS ---');
  lines.push('');
  
  for (const phase of phases) {
    lines.push(`${phase.phase_name}: ${formatCurrency(phase.amount || 0)}`);
    if (phase.phase_description) {
      lines.push(`   ${phase.phase_description.substring(0, 100)}${phase.phase_description.length > 100 ? '...' : ''}`);
    }
  }
  lines.push('');
  
  // Totals
  lines.push('--- TOTAL ---');
  const vatRate = document.vat_rate || 20;
  const vatAmount = finalAmount * (vatRate / 100);
  const totalTTC = finalAmount + vatAmount;
  
  lines.push(`Total HT: ${formatCurrency(finalAmount)}`);
  lines.push(`TVA (${vatRate}%): ${formatCurrency(vatAmount)}`);
  lines.push(`Total TTC: ${formatCurrency(totalTTC)}`);
  lines.push('');
  
  // Signature section
  lines.push('--- SIGNATURE CLIENT ---');
  lines.push('');
  lines.push(`Signe par: ${signerName}`);
  lines.push(`Date: ${formatDate(signedAt)}`);
  lines.push(`IP: ${data.link.signer_ip || 'N/A'}`);
  lines.push('');
  lines.push('[Signature electronique enregistree]');
  
  // Create a text-based PDF (simpler but valid)
  const textContent = lines.join('\n');
  
  // Create PDF with proper structure
  const pdf = createSimplePDF(textContent, signatureData, signerName, signedAt);
  
  return pdf;
}

function createSimplePDF(textContent: string, signatureData: string, signerName: string, signedAt: string): Uint8Array {
  // PDF structure
  const objects: string[] = [];
  let objectCount = 0;
  
  const addObject = (content: string): number => {
    objectCount++;
    objects.push(content);
    return objectCount;
  };
  
  // Object 1: Catalog
  addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  
  // Object 2: Pages
  addObject('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  
  // Prepare text content with proper escaping and French characters
  const escapePDFText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/é/g, 'e')
      .replace(/è/g, 'e')
      .replace(/ê/g, 'e')
      .replace(/ë/g, 'e')
      .replace(/à/g, 'a')
      .replace(/â/g, 'a')
      .replace(/ù/g, 'u')
      .replace(/û/g, 'u')
      .replace(/ô/g, 'o')
      .replace(/î/g, 'i')
      .replace(/ï/g, 'i')
      .replace(/ç/g, 'c')
      .replace(/€/g, 'EUR');
  };
  
  const lines = textContent.split('\n');
  let y = 800;
  let streamContent = 'BT\n/F1 10 Tf\n';
  
  for (const line of lines) {
    if (y < 50) break; // Don't go off page
    const escapedLine = escapePDFText(line);
    streamContent += `1 0 0 1 50 ${y} Tm\n(${escapedLine}) Tj\n`;
    y -= 14;
  }
  
  // Add signature info
  y -= 28;
  streamContent += `1 0 0 1 50 ${y} Tm\n(Signature electronique validee) Tj\n`;
  
  streamContent += 'ET';
  
  // Object 3: Page
  const pageContent = `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] 
   /Resources << /Font << /F1 4 0 R >> >>
   /Contents 5 0 R >>
endobj`;
  addObject(pageContent);
  
  // Object 4: Font
  addObject('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  
  // Object 5: Content stream
  const streamBytes = new TextEncoder().encode(streamContent);
  addObject(`5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream\nendobj`);
  
  // Build PDF
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  
  // XRef table
  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objectCount + 1}\n`;
  pdf += '0000000000 65535 f \n';
  
  for (const offset of offsets) {
    pdf += offset.toString().padStart(10, '0') + ' 00000 n \n';
  }
  
  // Trailer
  pdf += 'trailer\n';
  pdf += `<< /Size ${objectCount + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += xrefOffset + '\n';
  pdf += '%%EOF';
  
  return new TextEncoder().encode(pdf);
}
