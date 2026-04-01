import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BoardState, Member, TaskTemplate } from "@/lib/types";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

type MemberRow = {
  id: number;
  name: string;
  color_class: string;
};

type TaskTemplateRow = {
  id: string;
  title: string;
};

type CompletionRow = {
  task_id: string;
  member_id: number;
  date_key: string;
};

function requireClient(): SupabaseClient {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export async function fetchBoardStateFromSupabase(): Promise<BoardState> {
  const supabase = requireClient();

  const [membersResult, templatesResult, completionsResult] = await Promise.all([
    supabase.from("members").select("id,name,color_class").order("id", { ascending: true }),
    supabase.from("task_templates").select("id,title").order("created_at", { ascending: true }),
    supabase.from("task_completions").select("task_id,member_id,date_key"),
  ]);

  if (membersResult.error) {
    throw membersResult.error;
  }
  if (templatesResult.error) {
    throw templatesResult.error;
  }
  if (completionsResult.error) {
    throw completionsResult.error;
  }

  const members: Member[] = (membersResult.data as MemberRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    colorClass: row.color_class,
  }));

  const taskTemplates: TaskTemplate[] = (templatesResult.data as TaskTemplateRow[]).map((row) => ({
    id: row.id,
    title: row.title,
  }));

  const completions = (completionsResult.data as CompletionRow[]).map((row) => ({
    taskId: row.task_id,
    memberId: row.member_id,
    date: row.date_key,
  }));

  return {
    members,
    taskTemplates,
    completions,
  };
}

export async function createMemberInSupabase(name: string, colorClass: string): Promise<Member> {
  const supabase = requireClient();
  const result = await supabase.from("members").insert({ name, color_class: colorClass }).select("id,name,color_class").single();

  if (result.error) {
    throw result.error;
  }

  return {
    id: result.data.id,
    name: result.data.name,
    colorClass: result.data.color_class,
  };
}

export async function updateMemberInSupabase(memberId: number, name: string): Promise<void> {
  const supabase = requireClient();
  const result = await supabase.from("members").update({ name }).eq("id", memberId);
  if (result.error) {
    throw result.error;
  }
}

export async function createTaskTemplateInSupabase(title: string): Promise<TaskTemplate> {
  const supabase = requireClient();
  const result = await supabase.from("task_templates").insert({ title }).select("id,title").single();
  if (result.error) {
    throw result.error;
  }

  return {
    id: result.data.id,
    title: result.data.title,
  };
}

export async function updateTaskTemplateInSupabase(taskId: string, title: string): Promise<void> {
  const supabase = requireClient();
  const result = await supabase.from("task_templates").update({ title }).eq("id", taskId);
  if (result.error) {
    throw result.error;
  }
}

export async function removeTaskTemplateInSupabase(taskId: string): Promise<void> {
  const supabase = requireClient();
  const result = await supabase.from("task_templates").delete().eq("id", taskId);
  if (result.error) {
    throw result.error;
  }
}

export async function taskHasCompletionsInSupabase(taskId: string): Promise<boolean> {
  const supabase = requireClient();
  const result = await supabase.from("task_completions").select("id", { head: true, count: "exact" }).eq("task_id", taskId);
  if (result.error) {
    throw result.error;
  }

  return (result.count ?? 0) > 0;
}

export async function createCompletionInSupabase(taskId: string, memberId: number, date: string): Promise<void> {
  const supabase = requireClient();
  const result = await supabase.from("task_completions").insert({ task_id: taskId, member_id: memberId, date_key: date });
  if (result.error) {
    throw result.error;
  }
}

export async function removeCompletionInSupabase(taskId: string, memberId: number, date: string): Promise<void> {
  const supabase = requireClient();
  const result = await supabase.from("task_completions").delete().eq("task_id", taskId).eq("member_id", memberId).eq("date_key", date);

  if (result.error) {
    throw result.error;
  }
}

export async function savePushSubscriptionInSupabase(subscription: PushSubscription): Promise<void> {
  const supabase = requireClient();
  const subJson = subscription.toJSON();
  
  const result = await supabase.from("push_subscriptions").upsert({
    endpoint: subJson.endpoint,
    p256dh: subJson.keys?.p256dh,
    auth: subJson.keys?.auth,
    user_agent: window.navigator.userAgent
  }, { onConflict: "endpoint" });

  if (result.error) {
    throw result.error;
  }
}

export async function removePushSubscriptionFromSupabase(endpoint: string): Promise<void> {
  const supabase = requireClient();
  const result = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  
  if (result.error) {
    throw result.error;
  }
}
