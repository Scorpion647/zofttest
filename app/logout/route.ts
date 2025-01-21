"use server";

import { createClient } from "@lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  console.info("logged out");

  revalidatePath("/", "layout");
  redirect("/");
}
