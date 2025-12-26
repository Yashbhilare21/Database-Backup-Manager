import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { backup_id } = await req.json();

    // Get backup record
    const { data: backup, error: backupError } = await supabase
      .from("backup_history")
      .select("*")
      .eq("id", backup_id)
      .eq("user_id", user.id)
      .single();

    if (backupError || !backup) {
      throw new Error("Backup not found or access denied");
    }

    if (!backup.file_path) {
      throw new Error("Backup file path not found");
    }

    // Generate signed URL for download (valid for 1 hour)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from("backups")
      .createSignedUrl(backup.file_path, 3600);

    if (urlError) {
      throw new Error(`Failed to generate download URL: ${urlError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        download_url: signedUrl.signedUrl,
        file_name: backup.file_name,
        expires_in: 3600,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Download error:", error);
    const errorMessage = error instanceof Error ? error.message : "Download failed";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
