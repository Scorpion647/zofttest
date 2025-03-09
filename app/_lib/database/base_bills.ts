"use client";
import { createClient } from "@lib/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { Arrayable, SetRequired, Writable } from "type-fest";
import { Tables, TablesInsert, TablesUpdate } from "../database.types";
import { MultiSelectQuery } from "../database.utils";

const supabase = createClient();

export async function insertBills(
  bill: Writable<Arrayable<Omit<TablesInsert<"base_bills">, "base_bill_id">>>,
) {
  const billList = bill instanceof Array ? bill : [bill];

  const { data, error } = await supabase
    .from("base_bills")
    .insert(billList)
    .select();

  if (error) {
    console.error("Error inserting bills:", error);  // Log de error más detallado
    throw new Error("No se pudo insertar la factura");
  }

  return data;
}

export async function updateBills(
  bills: Writable<
    Arrayable<SetRequired<TablesUpdate<"base_bills">, "base_bill_id">>
  >,
) {
  const billList = bills instanceof Array ? bills : [bills];

  const errors: PostgrestError[] = [];
  for (const it of billList) {
    const { error } = await supabase
      .from("base_bills")
      .update(it)
      .eq("base_bill_id", it.base_bill_id);

    if (error) errors.push(error);
  }

  if (errors.length > 0) throw errors;
}

export async function deleteBills(
  billID: Arrayable<Tables<"base_bills">["base_bill_id"]>,
) {
  const { error } = await supabase
    .from("base_bills")
    .delete()
    .in("base_bill_id", Array.isArray(billID) ? billID : [billID]);

  if (error) throw error;
}


export async function selectSingleBill(
  id: Tables<"base_bills">["base_bill_id"],
) {
  const { data, error } = await supabase
    .from("base_bills")
    .select()
    .eq("base_bill_id", id);

  if (error) throw error;

  return data;
}

export async function selectByPurchaseOrder(
  po: Tables<"base_bills">["purchase_order"],
  item: Tables<"base_bills">["item"],
) {
  const { data, error } = await supabase
    .from("base_bills")
    .select()
    .eq("purchase_order", po)
    .eq("item", item);
  if (error) throw error;
  return data;
}

export async function selectBills(
  params: MultiSelectQuery<Tables<"base_bills">>,
) {
  let query = supabase.from("base_bills").select();

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
    query = query.textSearch("base_bill_search", params.search, {
      type: "websearch",
    });
  }

  if (params.orderBy) {
    const orderList =
      params.orderBy instanceof Array ? params.orderBy : [params.orderBy];

    for (const order of orderList) {
      query = query.order(order.column, order.options);
    }
  }

  const { page, limit } = params;
  query =
    page ?
      query.range((page - 1) * limit, page * limit - 1)
    : query.limit(limit);

  const { data, error } = await query;

  if (error) throw error;

  return data;
}
