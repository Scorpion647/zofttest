import { createClient } from "@lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  const supabase = await createClient();

  const { data: sources, error } = await supabase.rpc(
    "delete_old_invoice_docs",
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (sources.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("invoices")
      .remove(sources.map((s) => s.path));

    if (storageError) {
      return NextResponse.json({ error: storageError }, { status: 500 });
    }
  }

  return NextResponse.json(
    { message: "Success", paths: sources },
    {
      status: 200,
    },
  );
}
