import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@lib/database.types";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key-placeholder";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}

export async function getSession() {
  const supabase = createClient();
  return await supabase.auth.getSession();
}

export async function reauthenticate() {
  const supabase = createClient();
  return await supabase.auth.reauthenticate();
}

export async function getRole() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("profile_id", data.user.id)
    .limit(1)
    .single();

  console.info(data);

  if (profileError) throw profileError;

  return profileData.user_role;
}

export async function checkIfAdmin() {
  const role = await getRole();

  return role === "administrator";
}
