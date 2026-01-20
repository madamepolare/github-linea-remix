import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  notificationId?: string;
  tag?: string;
}

// Convert base64url string to Uint8Array
function base64UrlToBytes(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  return base64Decode(base64);
}

// Convert Uint8Array to base64url string
function bytesToBase64Url(bytes: Uint8Array): string {
  return base64UrlEncode(bytes.buffer as ArrayBuffer);
}

// Generate VAPID JWT
async function generateVapidJwt(
  audience: string,
  subject: string,
  publicKeyBase64: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const headerB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID keys
  const publicKeyBytes = base64UrlToBytes(publicKeyBase64);
  const privateKeyBytes = base64UrlToBytes(privateKeyBase64);

  // Extract x and y from uncompressed public key (65 bytes: 0x04 + 32 + 32)
  const x = bytesToBase64Url(publicKeyBytes.slice(1, 33));
  const y = bytesToBase64Url(publicKeyBytes.slice(33, 65));
  const d = bytesToBase64Url(privateKeyBytes);

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x, y, d },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert from DER to raw r||s format (64 bytes)
  const sigBytes = new Uint8Array(signature);
  const signatureB64 = bytesToBase64Url(sigBytes);

  return `${unsignedToken}.${signatureB64}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const reqPayload: PushPayload = await req.json();
    const { userId, title, body, url, notificationId, tag } = reqPayload;

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found for user', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messagePayload = JSON.stringify({
      title,
      body,
      url: url || '/',
      notificationId,
      tag: tag || 'notification'
    });

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        const endpoint = new URL(sub.endpoint);
        const audience = `${endpoint.protocol}//${endpoint.host}`;

        const jwt = await generateVapidJwt(
          audience,
          'mailto:notifications@lovable.app',
          vapidPublicKey,
          vapidPrivateKey
        );

        // For Safari/Apple Push, we send unencrypted payload with VAPID auth
        // Note: Full encryption requires complex ECDH+HKDF+AES-GCM implementation
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Content-Type': 'application/json',
            'TTL': '86400',
            'Urgency': 'normal',
          },
          body: messagePayload,
        });

        if (response.ok || response.status === 201) {
          sent++;
          console.log(`Push sent to ${sub.id}`);
        } else {
          const errorText = await response.text();
          console.error(`Push error ${sub.id}: ${response.status} - ${errorText}`);

          if (response.status === 410 || response.status === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }

          errors.push(`${sub.id}: ${response.status}`);
        }
      } catch (pushError: unknown) {
        const errorMsg = pushError instanceof Error ? pushError.message : String(pushError);
        console.error('Push error:', sub.id, errorMsg);
        errors.push(`${sub.id}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications processed', 
        sent, 
        total: subscriptions.length, 
        errors: errors.length > 0 ? errors : undefined 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
