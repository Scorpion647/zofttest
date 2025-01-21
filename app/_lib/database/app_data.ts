"use client";

import { Tables, TablesInsert } from "@lib/database.types";
import { createClient } from "@lib/supabase/client";
import { Arrayable, Writable } from "type-fest";

const supabase = createClient();

export async function getData(key?: Tables<"appdata">["key"]) {
  let query = supabase.from("appdata").select();

  if (key) {
    query = query.eq("key", key);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

export async function saveAppData(
  appData: Writable<Arrayable<TablesInsert<"appdata">>>,
) {
  const dataList = appData instanceof Array ? appData : [appData];

  const { data, error } = await supabase
    .from("appdata")
    .upsert(dataList)
    .select();

  if (error) throw error;

  return data;
}

export async function removeAppData(key: Tables<"appdata">["key"]) {
  const { error } = await supabase.from("appdata").delete().eq("key", key);

  if (error) throw error;
}
