"use client";

import { Tables, TablesInsert, TablesUpdate } from "@lib/database.types";
import { createClient } from "@lib/supabase/client";
import { Arrayable, SetRequired, Writable } from "type-fest";
import { MultiSelectQuery } from "../database.utils";

export async function selectSingleSupplier(
  supplier_id: Tables<"suppliers">["supplier_id"],
) {
  const { data, error } = await createClient()
    .from("suppliers")
    .select("*")
    .eq("supplier_id", supplier_id)
    .single();

  if (error) throw error;

  return data;
}

export async function selectSuppliers(
  params: MultiSelectQuery<Tables<"suppliers">>,
) {
  let query = createClient().from("suppliers").select();

  if (params.equals && !params.search) {
    const keys = Object.keys(params.equals) as Array<
      keyof typeof params.equals
    >;

    for (let key of keys) {
      if (params.equals[key] !== undefined && params.equals[key] !== null) {
        query = query.eq(key, params.equals[key]);
      }
    }
  } else if (params.search && params.search.trim().length > 0) {
    const term = `%${params.search.trim()}%`;
    query = query.ilike("name", term);
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

export async function insertSupplier(
  supplier: Writable<Arrayable<TablesInsert<"suppliers">>>,
) {
  const supplierList = supplier instanceof Array ? supplier : [supplier];

  const { data, error } = await createClient()
    .from("suppliers")
    .insert(supplierList)
    .select();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateSupplier(
  supplier: Arrayable<SetRequired<TablesUpdate<"suppliers">, "supplier_id">>,
) {
  const supplierList = supplier instanceof Array ? supplier : [supplier];
  const supabase = createClient();

  for (const it of supplierList) {
    const { error } = await supabase
      .from("suppliers")
      .update(it)
      .eq("supplier_id", it.supplier_id)
      .single();

    if (error) throw error;
  }
}

export async function deleteSupplier(
  supplier_id: Arrayable<Tables<"suppliers">["supplier_id"]>,
) {
  const { error } = await createClient()
    .from("suppliers")
    .delete()
    .in(
      "supplier_id",
      Array.isArray(supplier_id) ? supplier_id : [supplier_id],
    );

  if (error) {
    throw error;
  }
}
