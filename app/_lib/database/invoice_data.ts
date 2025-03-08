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
    .select("*, invoice_docs(*)")
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
    .select("*, invoice_docs(*)")
    .eq("supplier_id", supplierID);

  if (error) throw error;

  return data;
}

export async function selectInvoice_data(
  params: Prettify<Omit<MultiSelectQuery<Tables<"invoice_data">>, "search">>,
) {
  let query = supabase.from("invoice_data").select("*, invoice_docs(*)");

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
  invoice: TablesInsert<"invoice_data">,
  files: FileList,
) {
  const { data: invoiceData, error } = await supabase
    .from("invoice_data")
    .insert(invoice)
    .select();

  if (error) {
    throw error;
  }

  if (!files) {
    return invoiceData;
  }

  const { invoice_id, supplier_id } = invoiceData[0];

  return await insertInvoiceDoc(supplier_id, invoice_id, files);
}

export async function insertInvoiceDoc(
  supplier_id: Tables<"suppliers">["supplier_id"],
  invoice_id: Tables<"invoice_data">["invoice_id"],
  files: FileList,
  upsert: boolean = false,
) {
  const storageErrors: Error[] = [];

  Array.from(files).map(async (file) => {
    if (file.type !== "application/pdf") {
      storageErrors.push(Error("The selected file is not a pdf"));
      return;
    }

    const { data: docsData, error: tableError } = await supabase
      .from("invoice_docs")
      .insert({
        invoice_id,
      })
      .returns<Tables<"invoice_docs">[]>();

    if (tableError) {
      storageErrors.push(Error(tableError.message));
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("invoices")
      .upload(`${supplier_id}/${invoice_id}/${docsData[0].doc_id}`, file, {
        contentType: "application/pdf",
        upsert,
      });
    if (storageError) storageErrors.push(storageError);
  });

  return storageErrors.length > 0 ? storageErrors : undefined;
}

export async function deleteInvoiceDoc(
  document: Tables<"invoice_docs">,
  supplier_id: Tables<"suppliers">["supplier_id"],
  all: boolean = false,
) {
  const { doc_id, invoice_id } = document;

  const { error: storageE } = await supabase.storage
    .from("invoices")
    .remove([`${supplier_id}/${invoice_id}/${all ? "" : doc_id}`]);

  if (storageE) {
    throw storageE;
  }

  const { error } = await supabase
    .from("invoice_docs")
    .delete()
    .eq("doc_id", doc_id);
  if (error) throw error;
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
