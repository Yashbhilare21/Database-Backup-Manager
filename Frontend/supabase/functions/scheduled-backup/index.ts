import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate next run time based on frequency
function calculateNextRun(frequency: string, cronExpression?: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case "hourly":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "daily":
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0); // Default 2 AM
      return tomorrow;
    case "weekly":
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(2, 0, 0, 0);
      return nextWeek;
    case "monthly":
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(2, 0, 0, 0);
      return nextMonth;
    default:
      // For custom cron, default to 24 hours
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Running scheduled backup check...");

    // Find all active schedules that are due
    const now = new Date();
    
    const { data: schedules, error: schedulesError } = await supabase
      .from("backup_schedules")
      .select(`
        *,
        database_connections (
          id,
          name,
          host,
          port,
          database_name,
          username,
          password_encrypted,
          ssl_mode,
          user_id
        )
      `)
      .eq("is_active", true)
      .lte("next_run_at", now.toISOString());

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    console.log(`Found ${schedules?.length || 0} schedules to execute`);

    const results = [];

    for (const schedule of schedules || []) {
      console.log(`Processing schedule: ${schedule.name} (${schedule.id})`);

      try {
        // Call execute-backup function
        const { data, error } = await supabase.functions.invoke("execute-backup", {
          body: {
            connection_id: schedule.connection_id,
            schedule_id: schedule.id,
            backup_type: schedule.backup_type,
            backup_format: schedule.backup_format,
            compression_enabled: schedule.compression_enabled,
            encryption_enabled: schedule.encryption_enabled,
            selected_tables: schedule.selected_tables,
            selected_schemas: schedule.selected_schemas,
          },
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        });

        if (error) {
          throw error;
        }

        // Update schedule with last run and next run
        const nextRunAt = calculateNextRun(schedule.frequency, schedule.cron_expression);
        
        await supabase
          .from("backup_schedules")
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRunAt.toISOString(),
          })
          .eq("id", schedule.id);

        // Apply retention policy - delete old backups if exceeding max_backups
        if (schedule.max_backups) {
          const { data: oldBackups } = await supabase
            .from("backup_history")
            .select("id, file_path")
            .eq("schedule_id", schedule.id)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .range(schedule.max_backups, 9999);

          if (oldBackups && oldBackups.length > 0) {
            for (const oldBackup of oldBackups) {
              // Delete from storage
              if (oldBackup.file_path) {
                await supabase.storage.from("backups").remove([oldBackup.file_path]);
              }
              // Delete record
              await supabase.from("backup_history").delete().eq("id", oldBackup.id);
            }
            console.log(`Deleted ${oldBackups.length} old backups for retention policy`);
          }
        }

        // Apply retention_days policy
        if (schedule.retention_days) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - schedule.retention_days);
          
          const { data: expiredBackups } = await supabase
            .from("backup_history")
            .select("id, file_path")
            .eq("schedule_id", schedule.id)
            .lt("created_at", cutoffDate.toISOString());

          if (expiredBackups && expiredBackups.length > 0) {
            for (const expired of expiredBackups) {
              if (expired.file_path) {
                await supabase.storage.from("backups").remove([expired.file_path]);
              }
              await supabase.from("backup_history").delete().eq("id", expired.id);
            }
            console.log(`Deleted ${expiredBackups.length} expired backups`);
          }
        }

        results.push({
          schedule_id: schedule.id,
          name: schedule.name,
          success: true,
          backup_data: data,
        });

      } catch (scheduleError: unknown) {
        console.error(`Failed to execute schedule ${schedule.id}:`, scheduleError);
        const errorMessage = scheduleError instanceof Error ? scheduleError.message : "Schedule execution failed";
        
        results.push({
          schedule_id: schedule.id,
          name: schedule.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Scheduled backup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Scheduled backup failed";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
