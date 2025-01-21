"use client";

import { createClient } from "@/app/_lib/supabase/client";
import { Arrayable, SetRequired } from "type-fest";
import { Tables, TablesUpdate } from "../database.types";
import { handleError } from "../definitions";
import { MultiSelectQuery } from "../database.utils";

const supabase = createClient();

export async function selectProfiles(
  params: MultiSelectQuery<Tables<"profiles">>,
) {
  let query = supabase.from("profiles").select("*");

  if (params.equals) {
    const keys = Object.keys(params.equals) as Array<
      keyof typeof params.equals
    >;

    for (let key of keys) {
      if (params.equals[key] !== undefined && params.equals[key] !== null) {
        query = query.eq(key, params.equals[key]);
      }
    }
  }

  if (params.search && params.search.trim().length > 0) {
    query = query.textSearch("profiles_search", params.search, {
      type: "websearch",
    });
  }

  if (params.orderBy) {
    const orderList =
      params.orderBy instanceof Array ? params.orderBy : [params.orderBy];

    for (let it of orderList) {
      const { column, options } = it;
      query = query.order(column, options);
    }
  }

  const { page, limit } = params;

  query =
    page ?
      query.range((page - 1) * limit, page * limit - 1)
    : query.limit(limit);

  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data;
}

export async function getProfile(profile_id: Tables<"profiles">["profile_id"]) {
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("profile_id", profile_id)
    .single();

  if (error) throw error;

  return data;
}

export async function updateProfile(
  profile: Arrayable<SetRequired<TablesUpdate<"profiles">, "profile_id">>,
) {
  const profileList = profile instanceof Array ? profile : [profile];

  for (const it of profileList) {
    const { error } = await supabase
      .from("profiles")
      .update(it)
      .eq("user_id", it.profile_id);

    if (error) throw error;
  }
}

export async function deleteAccount() {
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const { error } = await supabase.functions.invoke("delete-user", {
    body: { user_id: userData.user.id },
  });

  if (error) throw error;
}

export async function removeUser(user_id: string) {
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) throw userError;

  const { data: userTarget, error: userTargetError } = await supabase
    .from("profiles")
    .select("profile_id")
    .eq("user_id", user_id)
    .limit(1)
    .single();

  if (userTargetError) throw userTargetError;

  const { error } = await supabase.functions.invoke("delete-user", {
    body: { user_id: userTarget.profile_id },
  });
  if (error) return handleError(error);
}
