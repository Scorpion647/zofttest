"use client";

import { createClient } from "@lib/supabase/client";
import type { Tables, TablesInsert } from "@lib/database.types";
import { Arrayable, SetRequired } from "type-fest";

export async function selectEmails(
  id?: Arrayable<Tables<"email_recipients">["id"]>,
) {
  let query = createClient().from("email_recipients").select();

  if (Array.isArray(id)) {
    const filters = id.map((val) => `id.eq.${val}`).join(",");
    query = query.or(filters);
  } else if (id) {
    query = query.eq("id", id);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

export async function insertEmails(
  emails: Arrayable<TablesInsert<"email_recipients">>,
) {
  let emailList = (
    Array.isArray(emails) ? emails : (
      [emails]
    )) as TablesInsert<"email_recipients">[];

  const { error } = await createClient()
    .from("email_recipients")
    .insert(emailList);

  if (error) throw error;
}

export async function upsertEmails(
  emails: Arrayable<SetRequired<TablesInsert<"email_recipients">, "id">>,
) {
  let emailList = (Array.isArray(emails) ? emails : [emails]) as SetRequired<
    TablesInsert<"email_recipients">,
    "id"
  >[];

  const { error } = await createClient()
    .from("email_recipients")
    .upsert(emailList);

  if (error) throw error;
}

export async function deleteEmails(
  emails: Arrayable<Tables<"email_recipients">["id"]>,
) {
  const supabase = createClient();
  let emailList = (
    Array.isArray(emails) ? emails : (
      [emails]
    )) as Tables<"email_recipients">["id"][];

  const { error } = await createClient()
    .from("email_recipients")
    .delete()
    .in("id", emailList);

  if (error) throw error;
}
