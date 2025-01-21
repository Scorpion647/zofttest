"use client";

import { createClient } from "@lib/supabase/client";
import { CustomDataError, handleError } from "@/app/_lib/definitions";
import { Except } from "type-fest";
import { Tables, TablesInsert, TablesUpdate } from "@lib/database.types";

export async function getMaterial(
  code: Tables<"materials">["material_code"],
): Promise<Tables<"materials"> | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("material_code", code)
    .single();

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function getInvo(
  id: Tables<"invoice_data">["invoice_id"],
): Promise<Tables<"invoice_data"> | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoice_data")
    .select("*")
    .eq("invoice_id", id)
    .single();

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function insertInvoice(
  invoice: TablesInsert<"invoice_data">,
): Promise<Tables<"invoice_data">["invoice_id"] | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoice_data")
    .insert(invoice)
    .select("invoice_id")
    .single();

  if (error || !data.invoice_id) {
    return handleError(error);
  }
  return data.invoice_id;
}

export async function getbase_bill(
  base_bill_id: Tables<"base_bills">["base_bill_id"],
): Promise<Tables<"base_bills"> | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("base_bills")
    .select("*")
    .eq("base_bill_id", base_bill_id)
    .single();

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function getInvoice(
  page: number = 1,
  limit: number = 10,
  search?: string,
  order_by?: [
    keyof Tables<"invoice_data">,
    { ascending?: boolean; foreignTable?: boolean; nullsFirst?: boolean },
  ][],
): Promise<Tables<"invoice_data">[] | CustomDataError | null> {
  const supabase = createClient();
  const query = supabase.from("invoice_data").select("*");

  if (search && search.trim() !== "") {
    query.textSearch("invoice_id", search, {
      type: "websearch",
    });
  }

  if (order_by && order_by.length > 0) {
    order_by.forEach(([column, options]) => {
      query.order(column, options);
    });
  }

  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1,
  );

  if (error) {
    return handleError(error);
  }

  return data;
}

export async function getSuplierInvoice(
  page: number = 1,
  limit: number = 10,
  search?: string,
  order_by?: [
    keyof Tables<"supplier_data">,
    { ascending?: boolean; foreignTable?: boolean; nullsFirst?: boolean },
  ][],
): Promise<Tables<"supplier_data">[] | CustomDataError | null> {
  const supabase = createClient();
  const query = supabase.from("supplier_data").select("*");

  // Realiza la búsqueda exacta por `invoice_id` si se proporciona `search`
  if (search && search.trim() !== "") {
    query.eq("invoice_id", search); // Búsqueda exacta para UUID
  }

  // Ordenar los resultados si se proporciona `order_by`
  if (order_by && order_by.length > 0) {
    order_by.forEach(([column, options]) => {
      query.order(column, options);
    });
  }

  // Paginación
  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1,
  );

  if (error) {
    return handleError(error);
  }

  return data;
}

export async function getlastmodified(
  invoiceId: Tables<"supplier_data">["invoice_id"],
): Promise<Tables<"supplier_data"> | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplier_data")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("modified_at", { ascending: false }) // Ordenar de más reciente a más antiguo
    .limit(1) // Solo tomar el más reciente
    .single(); // Esperar que haya solo un registro

  if (error || !data) {
    return handleError(error);
  }

  return data;
}

export async function checkSubheadingExists(
  subheading: number,
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("subheading")
    .eq("subheading", subheading)
    .limit(1); // Limitamos a 1 resultado para optimización

  if (error) {
    console.error("Error buscando subheading:", error.message);
    return false; // Retornamos false si hay un error
  }

  // Si los datos no están vacíos, significa que existe el subheading
  return data.length > 0;
}

export async function SearchRecord(
  base_bill_id: number,
): Promise<Tables<"base_bills"> | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("base_bills")
    .select("*")
    .eq("base_bill_id", base_bill_id)
    .single();

  if (error) {
    return handleError(error);
  }

  // Si los datos no están vacíos, significa que existe el subheading
  return data;
}

export async function getMaterials(
  page: number = 1,
  limit: number = 10,
  search?: string,
  order_by?: [
    keyof Tables<"materials">,
    { ascending?: boolean; foreignTable?: boolean; nullsFirst?: boolean },
  ][],
): Promise<Tables<"materials">[] | CustomDataError | null> {
  const supabase = createClient();
  const query = supabase.from("materials").select("*");

  if (search && search.trim() !== "") {
    query.textSearch("name_description", search, {
      type: "websearch",
    });
  }

  if (order_by && order_by.length > 0) {
    order_by.forEach(([column, options]) => {
      query.order(column, options);
    });
  }

  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1,
  );

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function insertMaterial(
  material: TablesInsert<"materials">,
): Promise<Tables<"materials">["material_code"] | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("materials")
    .insert(material)
    .select("material_code")
    .single();

  if (error || !data.material_code) {
    return handleError(error);
  }
  return data.material_code;
}

export async function updateMaterial(
  material_code: Tables<"materials">["material_code"],
  new_data: TablesUpdate<"materials">,
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("materials")
    .update(new_data)
    .eq("material_code", material_code);

  if (error) {
    return handleError(error);
  }
}

export async function deleteMaterial(
  code: Tables<"materials">["material_code"],
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("material_code", code);

  if (error) {
    return handleError(error);
  }
}

export async function getRecord(
  purchase_order: string,
  item: number,
): Promise<Tables<"base_bills"> | CustomDataError | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("base_bills")
    .select("*")
    .eq("purchase_order", purchase_order)
    .eq("item", item)
    .single();

  if (error) {
    return handleError(error);
  }

  return data;
}

export async function getRecordInvoice(
  base_bill_id: string,
): Promise<Tables<"base_bills"> | CustomDataError | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("base_bills")
    .select("*")
    .eq("base_bill_id", base_bill_id)
    .single();

  if (error) {
    return handleError(error);
  }

  return data;
}

export async function getRecords(
  page: number = 1,
  limit: number = 10,
  search?: string,
  order_by?: [
    keyof Tables<"base_bills">,
    { ascending?: boolean; foreignTable?: boolean; nullsFirst?: boolean },
  ][],
): Promise<Tables<"base_bills">[] | CustomDataError | null> {
  const supabase = createClient();
  const query = supabase.from("base_bills").select("*");

  if (search && search.trim() !== "") {
    query.textSearch("purchase_order", search, {
      type: "websearch",
    });
  }

  if (order_by && order_by.length > 0) {
    order_by.forEach(([column, options]) => {
      query.order(column, options);
    });
  }

  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1,
  );

  if (error) {
    return handleError(error);
  }

  return data;
}

export async function insertRecord(
  record: TablesInsert<"base_bills">,
): Promise<Tables<"base_bills">["base_bill_id"] | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("base_bills")
    .insert(record)
    .select("base_bill_id")
    .single();

  if (error || !data.base_bill_id) {
    return handleError(error);
  }
  return data.base_bill_id;
}

export async function updateRecord(
  purchase_order: string,
  item: string,
  new_data: TablesUpdate<"base_bills">,
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("base_bills")
    .update(new_data)
    .eq("purchase_order", purchase_order)
    .eq("item", item)
    .single();

  if (error) {
    return handleError(error);
  }
}

export async function deleteRecord(
  id: Tables<"base_bills">["base_bill_id"],
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("base_bills")
    .delete()
    .eq("base_bill_id", id);

  if (error) {
    return handleError(error);
  }
}

export async function getRecordInfo(
  record_id: Tables<"supplier_data">["base_bill_id"],
): Promise<Tables<"supplier_data"> | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplier_data")
    .select("*")
    .eq("base_bill_id", record_id)
    .single();

  if (error || !data) {
    return handleError(error);
  }
  return data;
}

export async function getRecordsInfo(
  page: number = 1,
  limit: number = 10,
  search?: string,
  order_by?: [
    keyof Tables<"supplier_data">,
    { ascending?: boolean; foreignTable?: boolean; nullsFirst?: boolean },
  ][],
): Promise<Tables<"supplier_data">[] | CustomDataError | null> {
  const supabase = createClient();
  const query = supabase.from("supplier_data").select("*");

  if (search && search.trim() !== "") {
    query.textSearch("base_bill_id", search, {
      type: "websearch",
    });
  }

  if (order_by && order_by.length > 0) {
    order_by.forEach(([column, options]) => {
      query.order(column, options);
    });
  }

  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1,
  );

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function insertRecordInfo(
  info: TablesInsert<"supplier_data">,
): Promise<
  Tables<"supplier_data">["supplier_data_id"] | CustomDataError | null
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplier_data")
    .insert(info)
    .select("supplier_data_id")
    .single();

  if (error || !data.supplier_data_id) {
    return handleError(error);
  }

  return data.supplier_data_id;
}

export async function updateRecordInfo(
  record_id: Tables<"supplier_data">["base_bill_id"],
  new_data: TablesUpdate<"supplier_data">,
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("supplier_data")
    .update(new_data)
    .eq("base_bill_id", record_id);

  if (error) {
    return handleError(error);
  }
}

export async function deleteRecordInfo(
  id: Tables<"supplier_data">["base_bill_id"],
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("supplier_data")
    .delete()
    .eq("base_bill_id", id);

  if (error) {
    return handleError(error);
  }
}

export async function getSupplier(
  id?: Tables<"suppliers">["supplier_id"],
  domain?: Tables<"suppliers">["domain"],
  name?: Tables<"suppliers">["name"],
): Promise<Tables<"suppliers"> | CustomDataError | null> {
  const supabase = createClient();

  const query = supabase.from("suppliers").select("*");
  if (id) {
    query.eq("supplier_id", id);
  }

  if (domain) {
    query.eq("domain", domain);
  }

  if (name) {
    query.eq("name", name);
  }

  const { data, error } = await query.single();

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function getSuppliers(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  order_by?: [
    keyof Tables<"suppliers">,
    { ascending?: boolean; foreignTable?: boolean; nullsFirst?: boolean },
  ][],
): Promise<Tables<"suppliers">[] | CustomDataError | null> {
  const supabase = createClient();
  const query = supabase.from("suppliers").select("*");

  if (search && search.trim() !== "") {
    query.textSearch("name_domain", search, {
      type: "websearch",
    });
  }

  if (order_by && order_by.length > 0) {
    order_by.forEach(([column, options]) => {
      query.order(column, options);
    });
  }

  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1,
  );

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function insertSupplier(
  args: TablesInsert<"suppliers">,
): Promise<CustomDataError | Tables<"suppliers">["supplier_id"] | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert(args)
    .select("supplier_id")
    .single();

  if (error) {
    return handleError(error);
  }

  return data.supplier_id;
}

export async function updateSupplier(
  id: Tables<"suppliers">["name"],
  new_data: TablesUpdate<"suppliers">,
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("suppliers")
    .update(new_data)
    .eq("supplier_id", id);

  if (error) {
    return handleError(error);
  }
}

export async function deleteSupplier(
  args: Tables<"suppliers">["supplier_id"],
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("supplier_id", args);

  if (error) {
    return handleError(error);
  }
}

export async function getEmployees(
  supplier_id?: Tables<"supplier_employees">["supplier_id"],
  page: number = 1,
  limit: number = 10,
  search?: string,
  order_by?: [
    keyof Tables<"profiles">,
    {
      ascending?: boolean;
      foreignTable?: boolean;
      nullsFirst?: boolean;
    },
  ][],
) {
  const supabase = createClient();

  // Construir la consulta
  let query = supabase.from("supplier_employees").select("*"); // Seleccionamos todos los datos

  // Filtrar por supplier_id si se proporciona
  if (supplier_id) {
    query = query.eq("supplier_id", supplier_id);
  }

  // Filtrar por búsqueda
  if (search && search.trim() !== "") {
    query = query.textSearch("supplier_id", search, {
      type: "websearch",
    });
  }

  // Ordenar si se proporciona
  if (order_by && order_by.length > 0) {
    order_by.forEach(([column, options]) => {
      query = query.order(column, options);
    });
  }

  // Establecer el rango para paginación
  const { data, error } = await query.range(
    (page - 1) * limit,
    page * limit - 1,
  );

  // Manejar errores
  if (error) {
    console.error("Error fetching employees:", error);
    return handleError(error);
  }

  return data;
}

export async function insertEmployee(
  relation: TablesInsert<"supplier_employees">,
): Promise<CustomDataError | Tables<"supplier_employees"> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplier_employees")
    .insert(relation)
    .select("*")
    .single();

  if (error) {
    return handleError(error);
  }

  return data;
}

export async function deleteEmployee(
  employee_id: Tables<"supplier_employees">["profile_id"],
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("supplier_employees")
    .delete()
    .eq("profile_id", employee_id);

  if (error) {
    return handleError(error);
  }
}

export async function updateEmployee(
  new_data: TablesUpdate<"supplier_employees">,
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { error } = await supabase.from("supplier_employees").update(new_data);

  if (error) {
    return handleError(error);
  }
}

export async function getProfile(
  user_id: Tables<"profiles">["profile_id"],
): Promise<Tables<"profiles"> | CustomDataError | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("profile_id", user_id)
    .single();

  if (error) {
    return handleError(error);
  }
  return data;
}

export async function updateProfile(
  profile_id: Tables<"profiles">["profile_id"],
  data: Except<Tables<"profiles">, "created_at" | "profile_id">,
): Promise<CustomDataError | void> {
  const supabase = createClient();
  const { email, full_name, user_role } = data;

  const { error } = await supabase
    .from("profiles")
    .update({ email, full_name, user_role })
    .eq("profile_id", profile_id)
    .single();

  if (error) {
    return handleError(error);
  }
}
