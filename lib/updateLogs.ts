import { createClient } from "@supabase/supabase-js";

export type UpdateLog = {
  id: number;
  created_at: string;
  status: "success" | "error";
  message: string | null;
  saved_count: number;
  draw_nos: number[];
  error_message: string | null;
  source: string;
};

function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: (input, init = {}) => {
        return fetch(input, {
          ...init,
          cache: "no-store",
        });
      },
    },
  });
}

export async function addUpdateLog(input: {
  status: "success" | "error";
  message?: string | null;
  saved_count?: number;
  draw_nos?: number[];
  error_message?: string | null;
  source?: string;
}) {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { error } = await supabase.from("lotto_update_logs").insert({
    status: input.status,
    message: input.message ?? null,
    saved_count: input.saved_count ?? 0,
    draw_nos: input.draw_nos ?? [],
    error_message: input.error_message ?? null,
    source: input.source ?? "cron",
  });

  if (error) {
    console.error("Update log insert error:", error.message);
  }

  return null;
}

export async function getUpdateLogs(limit = 30): Promise<UpdateLog[]> {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("lotto_update_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as UpdateLog[];
}