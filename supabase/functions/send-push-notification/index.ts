import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  userId: string;
  workspaceId?: string;
  title: string;
  body: string;
  url?: string;
  notificationId?: string;
  tag?: string;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function base64UrlToBytes(input: string): Uint8Array {
  // Accept both base64url and base64
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const out = base64Decode(normalized + padding);
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return base64UrlEncode(toArrayBuffer(bytes));
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function derToJoseEcdsa256(derSig: Uint8Array): Uint8Array {
  // DER: 0x30 len 0x02 rLen r 0x02 sLen s
  // Convert to raw 64 bytes: r(32) || s(32)
  if (derSig.length < 8 || derSig[0] !== 0x30) {
    throw new Error("Invalid DER signature");
  }

  let offset = 2;
  if (derSig[1] & 0x80) {
    const n = derSig[1] & 0x7f;
    offset = 2 + n;
  }

  if (derSig[offset] !== 0x02) throw new Error("Invalid DER signature (r)");
  const rLen = derSig[offset + 1];
  const r = derSig.slice(offset + 2, offset + 2 + rLen);
  offset = offset + 2 + rLen;

  if (derSig[offset] !== 0x02) throw new Error("Invalid DER signature (s)");
  const sLen = derSig[offset + 1];
  const s = derSig.slice(offset + 2, offset + 2 + sLen);

  const rOut = new Uint8Array(32);
  const sOut = new Uint8Array(32);

  const rTrim = r[0] === 0x00 && r.length > 32 ? r.slice(1) : r;
  const sTrim = s[0] === 0x00 && s.length > 32 ? s.slice(1) : s;

  rOut.set(rTrim.slice(Math.max(0, rTrim.length - 32)), 32 - Math.min(32, rTrim.length));
  sOut.set(sTrim.slice(Math.max(0, sTrim.length - 32)), 32 - Math.min(32, sTrim.length));

  return concatBytes(rOut, sOut);
}

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, toArrayBuffer(data));
  return new Uint8Array(sig);
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  return await hmacSha256(salt, ikm);
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const blocks: Uint8Array[] = [];
  let prev: Uint8Array = new Uint8Array(0);
  let counter = 1;

  const haveLen = () => blocks.reduce((s, b) => s + b.length, 0);

  while (haveLen() < length) {
    const input = concatBytes(prev, info, new Uint8Array([counter]));
    prev = (await hmacSha256(prk, input)) as unknown as Uint8Array;
    blocks.push(prev);
    counter++;
  }

  return concatBytes(...blocks).slice(0, length);
}

function writeUint16BE(value: number): Uint8Array {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff]);
}

async function generateVapidJwt(
  audience: string,
  subject: string,
  publicKeyBase64: string,
  privateKeyBase64: string,
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const headerB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const publicKeyBytes = base64UrlToBytes(publicKeyBase64);
  const privateKeyBytes = base64UrlToBytes(privateKeyBase64);

  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error("Invalid VAPID public key format");
  }

  const x = bytesToBase64Url(publicKeyBytes.slice(1, 33));
  const y = bytesToBase64Url(publicKeyBytes.slice(33, 65));
  const d = bytesToBase64Url(privateKeyBytes);

  const jwk = { kty: "EC", crv: "P-256", x, y, d } as JsonWebKey;

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const derSignature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      new TextEncoder().encode(unsignedToken),
    ),
  );

  const joseSig = derToJoseEcdsa256(derSignature);
  const signatureB64 = bytesToBase64Url(joseSig);
  return `${unsignedToken}.${signatureB64}`;
}

async function encryptWebPushPayloadAes128gcm(params: {
  payload: Uint8Array;
  userPublicKey: Uint8Array; // p256dh
  userAuthSecret: Uint8Array; // auth
}): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const { payload, userPublicKey, userAuthSecret } = params;

  const userPubKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(userPublicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userPubKey },
      serverKeyPair.privateKey,
      256,
    ),
  );

  // PRK_key = HKDF-Extract(authSecret, sharedSecret)
  const prkKey = await hkdfExtract(userAuthSecret, sharedSecret);

  // salt for message
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdfExtract(salt, prkKey);

  const serverPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeyPair.publicKey));

  const encLabel = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceLabel = new TextEncoder().encode("Content-Encoding: nonce\0");
  const p256Label = new TextEncoder().encode("P-256\0");

  const cekInfo = concatBytes(
    encLabel,
    p256Label,
    writeUint16BE(userPublicKey.length),
    userPublicKey,
    writeUint16BE(serverPublicKey.length),
    serverPublicKey,
  );

  const nonceInfo = concatBytes(
    nonceLabel,
    p256Label,
    writeUint16BE(userPublicKey.length),
    userPublicKey,
    writeUint16BE(serverPublicKey.length),
    serverPublicKey,
  );

  const cek = await hkdfExpand(prk, cekInfo, 16);
  const nonce = await hkdfExpand(prk, nonceInfo, 12);

  const cekKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(cek),
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const plaintext = concatBytes(new Uint8Array([0x02]), payload);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: toArrayBuffer(nonce) },
      cekKey,
      toArrayBuffer(plaintext),
    ),
  );

  return { ciphertext, salt, serverPublicKey };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const reqPayload: PushPayload = await req.json();
    const { userId, workspaceId, title, body, url, notificationId, tag } = reqPayload;

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, title" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let q = supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (workspaceId) {
      q = q.eq("workspace_id", workspaceId);
    }

    const { data: subscriptions, error: subError } = await q;
    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found for user", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const messagePayload = JSON.stringify({
      title,
      body,
      url: url || "/",
      notificationId,
      tag: tag || "notification",
    });

    const payloadBytes = new TextEncoder().encode(messagePayload);

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        const jwt = await generateVapidJwt(
          audience,
          "mailto:notifications@lovable.app",
          vapidPublicKey,
          vapidPrivateKey,
        );

        const userPublicKey = base64UrlToBytes(sub.p256dh);
        const userAuthSecret = base64UrlToBytes(sub.auth);

        const { ciphertext, salt, serverPublicKey } = await encryptWebPushPayloadAes128gcm({
          payload: payloadBytes,
          userPublicKey,
          userAuthSecret,
        });

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
            TTL: "86400",
            Urgency: "normal",
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            Encryption: `salt=${bytesToBase64Url(salt)}`,
            "Crypto-Key": `dh=${bytesToBase64Url(serverPublicKey)}; p256ecdsa=${vapidPublicKey}`,
          },
          body: ciphertext as unknown as BodyInit,
        });

        if (response.ok || response.status === 201) {
          sent++;
        } else {
          const errorText = await response.text();
          console.error(`Push error ${sub.id}: ${response.status} - ${errorText}`);

          if (response.status === 410 || response.status === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }

          errors.push(`${sub.id}: ${response.status} ${errorText}`);
        }
      } catch (pushError: unknown) {
        const errorMsg = pushError instanceof Error ? pushError.message : String(pushError);
        console.error("Push error:", sub.id, errorMsg);
        errors.push(`${sub.id}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Push notifications processed",
        sent,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
