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
    const { name, brand, designer, description } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Product name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build search query from product info
    const searchTerms = [name];
    if (brand) searchTerms.push(brand);
    if (designer) searchTerms.push(designer);
    const searchQuery = searchTerms.join(' ') + ' product image';

    console.log('Searching for product image:', searchQuery);

    // Use AI to generate a search-optimized query and analyze results
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a product image search assistant. Given product information, generate the best Google Image search URL to find a high-quality product photo. Return ONLY a JSON object with:
- "searchUrl": the Google Images search URL
- "suggestedKeywords": array of 3-5 keywords that would help find this product
- "productType": the category of product (furniture, lighting, accessory, etc.)

Example response:
{"searchUrl": "https://www.google.com/search?q=eames+lounge+chair&tbm=isch", "suggestedKeywords": ["eames", "lounge chair", "herman miller"], "productType": "furniture"}`
          },
          {
            role: 'user',
            content: `Find product image for:
Name: ${name}
Brand: ${brand || 'Unknown'}
Designer: ${designer || 'Unknown'}
Description: ${description || 'No description'}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_image_search_info',
              description: 'Get optimized search information for finding product images',
              parameters: {
                type: 'object',
                properties: {
                  searchUrl: { type: 'string', description: 'Google Images search URL' },
                  suggestedKeywords: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Keywords to find this product'
                  },
                  productType: { type: 'string', description: 'Category of product' },
                  searchQuery: { type: 'string', description: 'Optimized search query for image APIs' }
                },
                required: ['searchUrl', 'suggestedKeywords', 'productType', 'searchQuery'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'get_image_search_info' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to get AI response');
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    let searchInfo;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        searchInfo = JSON.parse(toolCall.function.arguments);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    // Return the search info so the frontend can use it
    // For now, we'll provide a placeholder image URL and the search URL for manual search
    const response = {
      success: true,
      searchUrl: searchInfo?.searchUrl || `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`,
      suggestedKeywords: searchInfo?.suggestedKeywords || searchTerms,
      productType: searchInfo?.productType || 'product',
      optimizedQuery: searchInfo?.searchQuery || searchQuery,
      // Placeholder high-quality product image based on product type
      placeholderImage: getPlaceholderImage(searchInfo?.productType || 'product')
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-source-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getPlaceholderImage(productType: string): string {
  // Return appropriate placeholder based on product type
  const placeholders: Record<string, string> = {
    furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    lighting: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    accessory: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    textile: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400',
    kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    outdoor: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
    product: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
  };
  return placeholders[productType.toLowerCase()] || placeholders.product;
}
