"use client";

import { Tables, TablesInsert, TablesUpdate } from "@lib/database.types";
import { createClient } from "@lib/supabase/client";
import { Prettify } from "@lib/utils/types";
import { Arrayable, SetRequired, Writable } from "type-fest";
import { MultiSelectQuery } from "../database.utils";

const supabase = createClient();

export async function selectSingleSupplierData(
  supplier_data_id: Tables<"supplier_data">["supplier_data_id"],
) {
  const { data, error } = await supabase
    .from("supplier_data")
    .select("*")
    .eq("supplier_data_id", supplier_data_id)
    .single();

  if (error) throw error;

  return data;
}

export async function selectSupplierDataByInvoiceID(
  invoiceID: Tables<"invoice_data">["invoice_id"],
  page: number = 1,
  pageSize: number = 10,
) {
  const { data, error } = await supabase
    .from("supplier_data")
    .select()
    .eq("invoice_id", invoiceID)
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw error;

  return data;
}

export async function selectSupplierData(
  params: Prettify<MultiSelectQuery<Tables<"supplier_data">>>,
) {
  let query = supabase.from("supplier_data").select("*");

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
    query = query.textSearch("supplier_data_search", params.search, {
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

export async function insertSupplierData(
  supplierData: Writable<Arrayable<TablesInsert<"supplier_data">>>,
) {
  const supplierDataList = (supplierData =
    supplierData instanceof Array ? supplierData : [supplierData]);

  const { data, error } = await supabase
    .from("supplier_data")
    .insert(supplierDataList)
    .select();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateSupplierData(
  supplierData: Arrayable<
    SetRequired<TablesUpdate<"supplier_data">, "supplier_data_id">
  >,
) {
  const supplierDataList =
    supplierData instanceof Array ? supplierData : [supplierData];

  for (const it of supplierDataList) {
    const { error } = await supabase
      .from("supplier_data")
      .update(it)
      .eq("supplier_data_id", it.supplier_data_id)
      .single();

    if (error) throw error;
  }
}

export async function deleteSupplierData(
  supplier_data_id: Arrayable<Tables<"supplier_data">["supplier_data_id"]>,
) {
  const { error } = await supabase
    .from("supplier_data")
    .delete()
    .in(
      "supplier_data_id",
      Array.isArray(supplier_data_id) ? supplier_data_id : [supplier_data_id],
    );

  if (error) {
    throw error;
  }
}
