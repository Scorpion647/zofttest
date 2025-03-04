import { createClient } from "@lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("delete_old_invoice_docs");

  console.info(data);

  return new Response(error ? error.message : "Success");
}
