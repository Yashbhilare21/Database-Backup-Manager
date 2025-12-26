import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-GCM encryption using Web Crypto API
async function getKey(): Promise<CryptoKey> {
  const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
  if (!encryptionKey) {
    throw new Error("ENCRYPTION_KEY not configured");
  }
  
  // Create a proper 256-bit key from the secret
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("pg-backup-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  
  // Decode base64 and split IV from data
  const combined = new Uint8Array(
    atob(ciphertext).split("").map((c) => c.charCodeAt(0))
  );
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    if (action === "encrypt") {
      const encrypted = await encrypt(data);
      return new Response(
        JSON.stringify({ success: true, result: encrypted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "decrypt") {
      const decrypted = await decrypt(data);
      return new Response(
        JSON.stringify({ success: true, result: decrypted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error("Invalid action. Use 'encrypt' or 'decrypt'");
    }
  } catch (error: unknown) {
    console.error("Encryption error:", error);
    const errorMessage = error instanceof Error ? error.message : "Encryption operation failed";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
