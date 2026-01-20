import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildPushPayload } from "https://esm.sh/@block65/webcrypto-web-push@2.0.0";

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
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const vapidKeys = {
          subject: 'mailto:notifications@lovable.app',
          publicKey: vapidPublicKey,
          privateKey: vapidPrivateKey,
        };

        const payload = await buildPushPayload(
          { data: messagePayload, options: { ttl: 86400 } },
          subscription,
          vapidKeys
        );

        const response = await fetch(sub.endpoint, payload);

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
      JSON.stringify({ message: 'Push notifications sent', sent, total: subscriptions.length, errors: errors.length > 0 ? errors : undefined }),
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
