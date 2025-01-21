"use client";

import { Tables, TablesInsert, TablesUpdate } from "@lib/database.types";
import { createClient } from "@lib/supabase/client";
import { Arrayable, SetRequired, Writable } from "type-fest";
import { MultiSelectQuery } from "../database.utils";
import { Prettify } from "@lib/utils/types";

const supabase = createClient();

export async function selectSingleInvoice(
  invoice_id: Tables<"invoice_data">["invoice_id"],
) {
  const { data, error } = await supabase
    .from("invoice_data")
    .select("*")
    .eq("invoice_id", invoice_id)
    .single();

  if (error) throw error;

  return data;
}

export async function selectInvoiceBySupplier(
  supplierID: Tables<"suppliers">["supplier_id"],
) {
  const { data, error } = await supabase
    .from("invoice_data")
    .select()
    .eq("supplier_id", supplierID);

  if (error) throw error;

  return data;
}

export async function selectInvoice_data(
  params: Prettify<Omit<MultiSelectQuery<Tables<"invoice_data">>, "search">>,
) {
  let query = supabase.from("invoice_data").select("*");

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

export async function insertInvoice(
  invoice: Writable<Arrayable<TablesInsert<"invoice_data">>>,
) {
  const invoiceList = invoice instanceof Array ? invoice : [invoice];

  const { data, error } = await supabase
    .from("invoice_data")
    .insert(invoiceList)
    .select()
    .returns<Tables<"invoice_data">[]>();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateInvoice(
  invoice: Arrayable<SetRequired<TablesUpdate<"invoice_data">, "invoice_id">>,
) {
  const invoiceList = invoice instanceof Array ? invoice : [invoice];

  for (const it of invoiceList) {
    const { error } = await supabase
      .from("invoice_data")
      .update(it)
      .eq("invoice_id", it.invoice_id)
      .single();

    if (error) throw error;
  }
}

export async function deleteInvoice(
  invoice_id: Arrayable<Tables<"invoice_data">["invoice_id"]>,
) {
  const { error } = await supabase
    .from("invoice_data")
    .delete()
    .eq("invoice_id", invoice_id);

  if (error) {
    throw error;
  }
}
