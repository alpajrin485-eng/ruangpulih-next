import { createClient } from "@supabase/supabase-js";

// Khusus server (API route / skrip). JANGAN diimpor dari Client Component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export type Role = "user" | "konselor" | "admin";

export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : role === "konselor" ? "/konselor" : "/app";
}
