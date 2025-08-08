"use client";

import { Tables, TablesInsert, TablesUpdate } from "@lib/database.types";
import { createClient } from "@lib/supabase/client";
import { Arrayable, SetRequired, Writable } from "type-fest";
import { MultiSelectQuery } from "../database.utils";
import { Prettify } from "@lib/utils/types";

export async function selectSingleSupplierEmployee(
  supplier_employee_id: Tables<"supplier_employees">["supplier_employee_id"],
) {
  const { data, error } = await createClient()
    .from("supplier_employees")
    .select("*")
    .eq("supplier_employee_id", supplier_employee_id)
    .single();

  if (error) throw error;

  return data;
}

export async function selecSupplierEmployeeByProfileId(
  profile_id: Tables<"profiles">["profile_id"],
) {
  const { data, error } = await createClient()
    .from("supplier_employees")
    .select()
    .eq("profile_id", profile_id);

  if (error) throw error;

  return data;
}

export async function selectsupplier_employees(
  params: Prettify<
    Omit<MultiSelectQuery<Tables<"supplier_employees">>, "search">
  >,
) {
  let query = createClient().from("supplier_employees").select("*");

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

export async function insertSupplierEmployee(
  invoice: Writable<Arrayable<TablesInsert<"supplier_employees">>>,
) {
  const invoiceList = invoice instanceof Array ? invoice : [invoice];

  const { data, error } = await createClient()
    .from("supplier_employees")
    .insert(invoiceList)
    .select();

  if (error) {
    throw error;
  }
  return data;
}

export async function updateSupplierEmployee(
  invoice: Arrayable<
    SetRequired<TablesUpdate<"supplier_employees">, "supplier_employee_id">
  >,
) {
  const invoiceList = invoice instanceof Array ? invoice : [invoice];
  const supabase = createClient();

  for (const it of invoiceList) {
    const { error } = await supabase
      .from("supplier_employees")
      .update(it)
      .eq("supplier_employee_id", it.supplier_employee_id)
      .single();

    if (error) throw error;
  }
}

export async function deleteSupplierEmployee(
  supplier_employee_id: Arrayable<
    Tables<"supplier_employees">["supplier_employee_id"]
  >,
) {
  const { error } = await createClient()
    .from("supplier_employees")
    .delete()
    .in(
      "supplier_employee_id",
      Array.isArray(supplier_employee_id) ? supplier_employee_id : (
        [supplier_employee_id]
      ),
    );

  if (error) {
    throw error;
  }
}
