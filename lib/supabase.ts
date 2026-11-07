"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Check the public configuration before creating the client. Next.js may
 * pre-render client components during production builds; malformed values
 * must not crash the entire deployment.
 */
export function getSupabaseConfigProblem(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url) return "NEXT_PUBLIC_SUPABASE_URL is missing.";
  if (!key) return "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.";

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) ||
        !parsed.hostname ||
        parsed.username || parsed.password ||
        parsed.search || parsed.hash ||
        parsed.pathname !== "/") {
      return "NEXT_PUBLIC_SUPABASE_URL must contain only the project URL, e.g. https://your-project.supabase.co (without the variable name, quotes, or an API path).";
    }
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Copy only the https://...supabase.co value after '=' in Supabase's .env.local example.";
  }

  if (!key.startsWith("sb_publishable_")) {
    return "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must contain your Supabase publishable key (starting with sb_publishable_), not a secret key.";
  }
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (getSupabaseConfigProblem()) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim()
    );
  }
  return client;
}
