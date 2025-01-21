import { createClient } from "@lib/supabase/client";

const supabase = createClient();

export async function userData() {
  return await supabase.auth.getUser();
}
