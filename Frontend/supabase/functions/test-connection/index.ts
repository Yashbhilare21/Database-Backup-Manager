import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConnectionParams {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { host, port, database, username, password, ssl_mode } = await req.json() as ConnectionParams;

    console.log(`Testing connection to ${host}:${port}/${database}`);

    // Build connection string
    const sslParam = ssl_mode === "require" ? "?sslmode=require" : "";
    const connectionString = `postgres://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}${sslParam}`;

    // Attempt to connect using Deno's postgres library
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    
    const client = new Client(connectionString);
    
    try {
      await client.connect();
      
      // Test query to verify connection works
      const result = await client.queryObject`SELECT version(), current_database(), current_user`;
      const row = result.rows[0] as { version: string; current_database: string; current_user: string };
      
      await client.end();
      
      console.log("Connection successful!");
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Connection successful",
          details: {
            version: row.version,
            database: row.current_database,
            user: row.current_user,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (connError) {
      console.error("Connection failed:", connError);
      await client.end().catch(() => {});
      throw connError;
    }
  } catch (error: unknown) {
    console.error("Error testing connection:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to connect to database";
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
