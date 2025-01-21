"use client";

import { createClient } from "@lib/supabase/client";
import type { Database, Tables } from "@lib/database.types";
import { Prettify } from "../utils/types";
import { MultiSelectQuery } from "../database.utils";
import { Arrayable } from "type-fest";

const supabase = createClient();
type Track = Prettify<Database["public"]["Functions"]["track_bill"]>;

export default async function track_bill(args: Track["Args"]) {
  const { data, error } = await supabase.rpc("track_bill", args);

  if (error) {
    throw error;
  }

  return data;
}

export async function selectSingleTrack(id: Tables<"data_tracking">["id"]) {
  const { data, error } = await supabase
    .from("data_tracking")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function selectTracks(
  params: MultiSelectQuery<Tables<"data_tracking">>,
) {
  let query = supabase.from("data_tracking").select("*");

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
    query = query.textSearch("bill_number", params.search, {
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

export async function deleteTrack(
  id: Arrayable<Tables<"data_tracking">["id"]>,
) {
  const { error } = await supabase.from("materials").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
