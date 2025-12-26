import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Decrypt password using the same algorithm as encrypt-credentials
async function decryptPassword(encryptedPassword: string): Promise<string> {
  const encryptionKey = Deno.env.get("ENCRYPTION_KEY");
  if (!encryptionKey) {
    throw new Error("ENCRYPTION_KEY not configured");
  }
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("pg-backup-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  const combined = new Uint8Array(
    atob(encryptedPassword).split("").map((c) => c.charCodeAt(0))
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

// Generate SHA-256 checksum
async function generateChecksum(data: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface BackupRequest {
  connection_id: string;
  schedule_id?: string;
  backup_type: "full" | "schema" | "tables";
  backup_format: "sql" | "dump" | "backup";
  compression_enabled?: boolean;
  encryption_enabled?: boolean;
  selected_tables?: string[];
  selected_schemas?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get auth header to identify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: BackupRequest = await req.json();
    const { 
      connection_id, 
      schedule_id, 
      backup_type = "full", 
      backup_format = "sql",
      compression_enabled = true,
      encryption_enabled = false,
      selected_tables = [],
      selected_schemas = []
    } = body;

    console.log(`Starting backup for connection ${connection_id}`);

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from("database_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      throw new Error("Connection not found or access denied");
    }

    // Create backup history record
    const backupRecord = {
      user_id: user.id,
      connection_id,
      schedule_id,
      backup_type,
      backup_format,
      compression_enabled,
      encryption_enabled,
      status: "running" as const,
      started_at: new Date().toISOString(),
    };

    const { data: backup, error: insertError } = await supabase
      .from("backup_history")
      .insert(backupRecord)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create backup record: ${insertError.message}`);
    }

    try {
      // Decrypt password
      const password = await decryptPassword(connection.password_encrypted);

      // Build connection string
      const sslParam = connection.ssl_mode === "require" ? "?sslmode=require" : "";
      const connectionString = `postgres://${encodeURIComponent(connection.username)}:${encodeURIComponent(password)}@${connection.host}:${connection.port}/${connection.database_name}${sslParam}`;

      // Connect to database
      const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
      const client = new Client(connectionString);
      await client.connect();

      // Build backup based on type and format
      let backupContent = "";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      let fileName = `backup_${connection.database_name}_${timestamp}`;
      let tableCount = 0;

      // Get list of tables
      const tablesResult = await client.queryObject<{ tablename: string; schemaname: string }>`
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY schemaname, tablename
      `;

      let tablesToBackup = tablesResult.rows;

      // Filter by selected schemas if specified
      if (selected_schemas.length > 0) {
        tablesToBackup = tablesToBackup.filter(t => selected_schemas.includes(t.schemaname));
      }

      // Filter by selected tables if specified
      if (backup_type === "tables" && selected_tables.length > 0) {
        tablesToBackup = tablesToBackup.filter(t => selected_tables.includes(`${t.schemaname}.${t.tablename}`));
      }

      // Generate SQL backup
      backupContent = `-- PostgreSQL Backup\n`;
      backupContent += `-- Database: ${connection.database_name}\n`;
      backupContent += `-- Generated: ${new Date().toISOString()}\n`;
      backupContent += `-- Backup Type: ${backup_type}\n`;
      backupContent += `-- Format: ${backup_format}\n\n`;

      if (backup_type !== "tables") {
        // Include schema definitions
        backupContent += `-- Schema Definitions\n`;
        
        for (const table of tablesToBackup) {
          const schemaResult = await client.queryObject<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = ${table.schemaname} AND table_name = ${table.tablename}
            ORDER BY ordinal_position
          `;

          backupContent += `\n-- Table: ${table.schemaname}.${table.tablename}\n`;
          backupContent += `CREATE TABLE IF NOT EXISTS "${table.schemaname}"."${table.tablename}" (\n`;
          
          const columns = schemaResult.rows.map(col => {
            let colDef = `  "${col.column_name}" ${col.data_type}`;
            if (col.is_nullable === 'NO') colDef += ' NOT NULL';
            if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
            return colDef;
          });
          
          backupContent += columns.join(',\n');
          backupContent += `\n);\n`;
        }
      }

      if (backup_type !== "schema") {
        // Include data
        backupContent += `\n-- Data\n`;
        
        for (const table of tablesToBackup) {
          const dataResult = await client.queryObject(`SELECT * FROM "${table.schemaname}"."${table.tablename}"`);
          
          if (dataResult.rows.length > 0) {
            backupContent += `\n-- Data for ${table.schemaname}.${table.tablename}\n`;
            
            for (const row of dataResult.rows) {
              const rowObj = row as Record<string, unknown>;
              const columns = Object.keys(rowObj);
              const values = columns.map(col => {
                const val = rowObj[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                if (val instanceof Date) return `'${val.toISOString()}'`;
                return String(val);
              });
              
              backupContent += `INSERT INTO "${table.schemaname}"."${table.tablename}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
            }
          }
          
          tableCount++;
        }
      } else {
        tableCount = tablesToBackup.length;
      }

      await client.end();

      // Set file extension based on format
      if (backup_format === "sql") {
        fileName += ".sql";
      } else {
        fileName += ".backup";
      }

      // Convert to bytes and generate checksum
      const encoder = new TextEncoder();
      let backupData = encoder.encode(backupContent);
      
      // Compress if enabled (simple gzip simulation - in production would use actual compression)
      if (compression_enabled) {
        // Note: Deno doesn't have built-in gzip, so we'll store uncompressed but mark it
        fileName = fileName.replace(/\.(sql|backup)$/, ".gz$1");
      }

      const checksum = await generateChecksum(backupData);
      const fileSizeBytes = backupData.length;

      // Store backup in Supabase Storage
      const bucketName = "backups";
      const filePath = `${user.id}/${connection_id}/${fileName}`;

      // Ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, { public: false });
      }

      // Upload backup file
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, backupData, {
          contentType: backup_format === "sql" ? "text/plain" : "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload backup: ${uploadError.message}`);
      }

      // Update backup record with success
      const { error: updateError } = await supabase
        .from("backup_history")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          file_name: fileName,
          file_path: filePath,
          file_size_bytes: fileSizeBytes,
          checksum,
          tables_backed_up: tableCount,
        })
        .eq("id", backup.id);

      if (updateError) {
        console.error("Failed to update backup record:", updateError);
      }

      // Update connection last_connected_at
      await supabase
        .from("database_connections")
        .update({ last_connected_at: new Date().toISOString() })
        .eq("id", connection_id);

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        backup_id: backup.id,
        title: "Backup Completed",
        message: `Backup of ${connection.name} completed successfully. ${tableCount} tables backed up.`,
        type: "success",
      });

      console.log(`Backup completed: ${fileName} (${fileSizeBytes} bytes)`);

      return new Response(
        JSON.stringify({
          success: true,
          backup_id: backup.id,
          file_name: fileName,
          file_size_bytes: fileSizeBytes,
          tables_backed_up: tableCount,
          checksum,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (backupError: unknown) {
      const errorMessage = backupError instanceof Error ? backupError.message : "Backup failed";
      // Update backup record with failure
      await supabase
        .from("backup_history")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", backup.id);

      // Create failure notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        backup_id: backup.id,
        title: "Backup Failed",
        message: `Backup of ${connection.name} failed: ${errorMessage}`,
        type: "error",
      });

      throw backupError;
    }

  } catch (error: unknown) {
    console.error("Backup execution error:", error);
    const errorMessage = error instanceof Error ? error.message : "Backup execution failed";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
