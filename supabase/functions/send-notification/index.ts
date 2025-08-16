// Supabase Edge Function: send-notification (FCM HTTP v1)
// Requires Supabase secrets:
// - SERVICE_ACCOUNT_JSON: stringified Google Service Account JSON
// - PROJECT_ID: your Firebase projectId (e.g., "propmanager-7677c")
// Usage from client (supabase-js):
// const { data, error } = await supabase.functions.invoke('send-notification', {
//   body: { userId, token, title, body, data }
// });

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Payload = {
  userId?: string; // if provided, will fetch all tokens for this user from public.push_tokens
  token?: string;  // alternatively, send to single token directly
  title: string;
  body: string;
  data?: Record<string, string>;
};

// --- Helpers for OAuth (JWT) ---
function base64url(bytes: Uint8Array): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  const b64 = btoa(str);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function getAccessTokenFromServiceAccount(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const toSign = `${headerB64}.${payloadB64}`;

  // Import private key (PKCS8 PEM)
  const pem = (sa.private_key as string)
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(toSign))
  );
  const jwt = `${toSign}.${base64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to get access token');
  return json.access_token as string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const { userId, token, title, body, data }: Payload = await req.json();
    if (!title || !body || (!userId && !token)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load service account and project id
    const saRaw = Deno.env.get('SERVICE_ACCOUNT_JSON');
    const projectId = Deno.env.get('PROJECT_ID');
    if (!saRaw || !projectId) {
      return Response.json({ error: 'Missing SERVICE_ACCOUNT_JSON or PROJECT_ID' }, { status: 500 });
    }
    const serviceAccount = JSON.parse(saRaw);
    const accessToken = await getAccessTokenFromServiceAccount(serviceAccount);

    let targetTokens: string[] = [];

    if (userId) {
      // Use service role client automatically provided
      const { createClient } = await import('jsr:@supabase/supabase-js@2');
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      });

      const { data: rows, error } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      targetTokens = (rows || []).map(r => r.token);
    } else if (token) {
      targetTokens = [token];
    }

    if (targetTokens.length === 0) {
      return Response.json({ error: 'No tokens found' }, { status: 404 });
    }

    // Send one-by-one via FCM HTTP v1
    const results: any[] = [];
    for (const t of targetTokens) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          message: {
            token: t,
            notification: { title, body },
            data: data || {},
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      results.push({ status: res.status, body: json });
    }

    return Response.json({ success: true, results });
  } catch (e) {
    return Response.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
});
