"use client";

import { Tables, TablesInsert, TablesUpdate } from "@lib/database.types";
import { createClient } from "@lib/supabase/client";
import { Arrayable, SetRequired, Writable } from "type-fest";
import { MultiSelectQuery } from "../database.utils";
import { Prettify } from "../utils/types";

const supabase = createClient();

export async function selectSingleMaterial(
  material_code: Tables<"materials">["material_code"],
) {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("material_code", material_code)
    .single();

  if (error) throw error;

  return data;
}

export async function selectBySubheading(subheading: string) {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("subheading", subheading);

  if (error) {
    throw error;
  }

  return data;
}

export async function selectMaterials(
  params: MultiSelectQuery<Tables<"materials">>,
) {
  let query = supabase.from("materials").select("*");

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
    query = query.textSearch("material_search", params.search, {
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

export async function insertMaterial(
  material: Writable<Arrayable<TablesInsert<"materials">>>,
) {
  const materialList = material instanceof Array ? material : [material];

  const { data, error } = await supabase
    .from("materials")
    .insert(materialList)
    .select()
    .returns<Tables<"materials">[]>();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateMaterial(
  data: Arrayable<{
    data: Prettify<TablesUpdate<"materials">>;
    target: Prettify<Tables<"materials">["material_code"]>;
  }>,
) {
  const materialList = data instanceof Array ? data : [data];

  for (const it of materialList) {
    const { error } = await supabase
      .from("materials")
      .update(it.data)
      .eq("material_code", it.target)
      .single();

    if (error) throw error;
  }
}

export async function deleteMaterial(
  material_code: Arrayable<Tables<"materials">["material_code"]>,
) {
  const materialList = material_code instanceof Array ? material_code : [material_code];

  for (const code of materialList) {
    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("material_code", code);

    if (error) {
      throw error;
    }
  }
}
