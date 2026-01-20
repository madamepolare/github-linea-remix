import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

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

// Helper to encode Uint8Array to base64url string
function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return base64UrlEncode(new Uint8Array(arr).buffer as ArrayBuffer);
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Generate ECDSA key pair from VAPID keys
async function importVapidKeys(publicKeyBase64: string, privateKeyBase64: string) {
  // The public key is in uncompressed format (65 bytes: 0x04 + 32 bytes x + 32 bytes y)
  const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64);
  
  // Extract x and y coordinates from uncompressed public key
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
  
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      x: x,
      y: y,
      d: privateKeyBase64,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  return privateKey;
}

// Generate VAPID JWT token
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
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKey = await importVapidKeys(publicKeyBase64, privateKeyBase64);

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature from DER to raw format (required for JWT)
  const signatureArray = new Uint8Array(signature);
  const signatureB64 = uint8ArrayToBase64Url(signatureArray);
  
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

    // Get user's push subscriptions
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

    const pushPayload = JSON.stringify({
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
        
        // Generate JWT for VAPID
        const jwt = await generateVapidJwt(
          audience, 
          'mailto:notifications@lovable.app',
          vapidPublicKey,
          vapidPrivateKey
        );
        
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Content-Type': 'text/plain;charset=UTF-8',
            'TTL': '86400',
            'Urgency': 'normal',
          },
          body: pushPayload,
        });

        if (response.ok || response.status === 201) {
          sent++;
          console.log(`Push sent successfully to subscription ${sub.id}`);
        } else {
          const errorText = await response.text();
          console.error(`Push error for ${sub.id}: ${response.status} - ${errorText}`);
          
          // If subscription is invalid, remove it
          if (response.status === 410 || response.status === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            console.log(`Removed invalid subscription ${sub.id}`);
          }
          
          errors.push(`Subscription ${sub.id}: ${response.status} ${errorText}`);
        }
      } catch (pushError: unknown) {
        const errorMsg = pushError instanceof Error ? pushError.message : String(pushError);
        console.error('Push error for subscription:', sub.id, pushError);
        errors.push(`Subscription ${sub.id}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Push notifications sent`,
        sent,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
