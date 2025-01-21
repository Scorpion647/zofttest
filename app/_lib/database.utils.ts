import {
  Arrayable,
  RequireAtLeastOne,
  Simplify,
  SimplifyDeep,
} from "type-fest";

interface SupabaseFilterOptions {
  ascending?: boolean;
  foreignTable?: boolean;
  nullsFirst?: boolean;
}

interface SingleOrderBy<T> {
  column: keyof T;
  options?: RequireAtLeastOne<
    SupabaseFilterOptions,
    keyof SupabaseFilterOptions
  >;
}

type OrderBy<T> = SimplifyDeep<Arrayable<SingleOrderBy<T>>>;

export type MultiSelectQuery<Table> = Simplify<{
  limit: number;
  page?: number;
  search?: string;
  orderBy?: OrderBy<Table>;
  equals: {
    [K in keyof Table]?: Table[K];
  };
}>;
