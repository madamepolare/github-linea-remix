import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const payload: PushPayload = await req.json();
    const { userId, title, body, url, notificationId, tag } = payload;

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
        // Use web-push library via dynamic import
        const webPush = await import("https://esm.sh/web-push@3.6.6");
        
        webPush.setVapidDetails(
          'mailto:notifications@lovable.app',
          vapidPublicKey,
          vapidPrivateKey
        );

        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          pushPayload
        );
        
        sent++;
      } catch (pushError: any) {
        console.error('Push error for subscription:', sub.id, pushError);
        
        // If subscription is invalid, remove it
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        
        errors.push(`Subscription ${sub.id}: ${pushError.message}`);
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
