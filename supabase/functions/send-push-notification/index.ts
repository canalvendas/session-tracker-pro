import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push signature generation
async function generateVAPIDSignature(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const urlObject = new URL(endpoint);
  const audience = `${urlObject.protocol}//${urlObject.host}`;
  
  // Create JWT header and payload
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: 'mailto:contato@teraday.app',
  };

  // Base64url encode
  const base64url = (data: string) => {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBuffer = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64url(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { userId, title, body: notificationBody, url, tag } = body;

    console.log('Sending push notification to user:', userId);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all subscriptions for this user
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user:', userId);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No subscriptions found',
        sent: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${subscriptions.length} subscriptions for user`);

    const payload = JSON.stringify({
      title: title || 'TeraDay',
      body: notificationBody || 'Você tem uma nova notificação',
      url: url || '/',
      tag: tag || 'teraday-notification',
    });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Send to each subscription
    for (const subscription of subscriptions) {
      try {
        const { authorization, cryptoKey } = await generateVAPIDSignature(
          subscription.endpoint,
          vapidPublicKey,
          vapidPrivateKey
        );

        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
            'Authorization': authorization,
            'Crypto-Key': `p256ecdsa=${cryptoKey}`,
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`Push sent successfully to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired or invalid, remove it
          console.log(`Removing invalid subscription: ${subscription.endpoint.substring(0, 50)}...`);
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
          failCount++;
        } else {
          const errorText = await response.text();
          console.error(`Push failed for endpoint: ${response.status} - ${errorText}`);
          errors.push(`${response.status}: ${errorText}`);
          failCount++;
        }
      } catch (error) {
        console.error(`Error sending to subscription:`, error);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        failCount++;
      }
    }

    console.log(`Push notifications sent: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      failed: failCount,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
