import { createClient } from "@lib/supabase/client";

export async function userData() {
  return await createClient().auth.getUser();
}
