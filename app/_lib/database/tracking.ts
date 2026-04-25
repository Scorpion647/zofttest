"use client";

import { createClient } from "@lib/supabase/client";

const supabase = createClient();

export type TrackingSummaryRow = {
  invoice_id: string;
  purchase_order: string | null;
  bill_number: string | null;
  subtotal: number;
  fob: number;
  modified_at: string;
  supplier_name: string;
};

export type TrackingExportRow = {
  invoice_id: string;
  purchase_order: string | null;
  item: number | null;
  material_code: string | null;
  description: string | null;
  billed_quantity: number;
  bill_measurement_unit: string | null;
  supplier_name: string;
  billed_unit_price: number;
  bill_number: string;
  fmm: string | null;
  subheading: string | null;
  material_measurement_unit: string | null;
  trm: number;
  billed_currency: string;
  material_type: string | null;
  gross_weight: number;
  packages: number;
};

type TrackingFilters = {
  supplierId?: number;
  year?: number;
  month?: number;
};

export async function selectTrackingSummary(
  filters: TrackingFilters & { limit?: number; offset?: number },
) {
  const { data, error } = await (supabase as any).rpc(
    "tracking_approved_summary",
    {
      p_supplier_id: filters.supplierId ?? null,
      p_year: filters.year ?? null,
      p_month: filters.month ?? null,
      p_limit: filters.limit ?? 40,
      p_offset: filters.offset ?? 0,
    },
  );

  if (error) throw error;

  return (data ?? []) as unknown as TrackingSummaryRow[];
}

export async function selectTrackingExportRows(filters: TrackingFilters) {
  const { data, error } = await (supabase as any).rpc(
    "tracking_approved_export_rows",
    {
      p_supplier_id: filters.supplierId ?? null,
      p_year: filters.year ?? null,
      p_month: filters.month ?? null,
    },
  );

  if (error) throw error;

  return (data ?? []) as unknown as TrackingExportRow[];
}
