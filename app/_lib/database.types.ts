export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      appdata: {
        Row: {
          created_at: string;
          key: Database["public"]["Enums"]["app_options"];
          updated_at: string;
          value: Json;
        };
        Insert: {
          created_at?: string;
          key: Database["public"]["Enums"]["app_options"];
          updated_at?: string;
          value: Json;
        };
        Update: {
          created_at?: string;
          key?: Database["public"]["Enums"]["app_options"];
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      base_bills: {
        Row: {
          approved_quantity: number;
          base_bill_id: string;
          created_at: string;
          currency: Database["public"]["Enums"]["currency"];
          description: string | null;
          item: number;
          material_code: string;
          measurement_unit: string;
          net_price: number | null;
          pending_quantity: number;
          purchase_order: string;
          supplier_id: number;
          total_quantity: number;
          unit_price: number;
          base_bill_search: string | null;
        };
        Insert: {
          approved_quantity?: number;
          base_bill_id?: string;
          created_at?: string;
          currency: Database["public"]["Enums"]["currency"];
          description?: string | null;
          item: number;
          material_code: string;
          measurement_unit: string;
          net_price?: number | null;
          pending_quantity?: number;
          purchase_order: string;
          supplier_id: number;
          total_quantity?: number;
          unit_price: number;
        };
        Update: {
          approved_quantity?: number;
          base_bill_id?: string;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency"];
          description?: string | null;
          item?: number;
          material_code?: string;
          measurement_unit?: string;
          net_price?: number | null;
          pending_quantity?: number;
          purchase_order?: string;
          supplier_id?: number;
          total_quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "base_bills_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      data_tracking: {
        Row: {
          bill_measurement_unit: string | null;
          bill_number: string | null;
          bill_total_price: number | null;
          bill_unit_price: number | null;
          code: string | null;
          created_at: string | null;
          data_total_price: number | null;
          data_unit_price: number | null;
          description: string | null;
          fmm: string | null;
          gross_weight: number | null;
          id: number;
          items: number | null;
          material_measurement_unit: string | null;
          packages: number | null;
          purchase_order: string | null;
          quantity: number | null;
          subheading: string | null;
          supplier_name: string | null;
          trm: number | null;
          type: Database["public"]["Enums"]["material_type"] | null;
        };
        Insert: {
          bill_measurement_unit?: string | null;
          bill_number?: string | null;
          bill_total_price?: number | null;
          bill_unit_price?: number | null;
          code?: string | null;
          created_at?: string | null;
          data_total_price?: number | null;
          data_unit_price?: number | null;
          description?: string | null;
          fmm?: string | null;
          gross_weight?: number | null;
          id?: number;
          items?: number | null;
          material_measurement_unit?: string | null;
          packages?: number | null;
          purchase_order?: string | null;
          quantity?: number | null;
          subheading?: string | null;
          supplier_name?: string | null;
          trm?: number | null;
          type?: Database["public"]["Enums"]["material_type"] | null;
        };
        Update: {
          bill_measurement_unit?: string | null;
          bill_number?: string | null;
          bill_total_price?: number | null;
          bill_unit_price?: number | null;
          code?: string | null;
          created_at?: string | null;
          data_total_price?: number | null;
          data_unit_price?: number | null;
          description?: string | null;
          fmm?: string | null;
          gross_weight?: number | null;
          id?: number;
          items?: number | null;
          material_measurement_unit?: string | null;
          packages?: number | null;
          purchase_order?: string | null;
          quantity?: number | null;
          subheading?: string | null;
          supplier_name?: string | null;
          trm?: number | null;
          type?: Database["public"]["Enums"]["material_type"] | null;
        };
        Relationships: [];
      };
      email_recipients: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      invoice_data: {
        Row: {
          approved_date: string | null;
          created_at: string;
          feedback: string | null;
          fmm: string | null;
          invoice_id: string;
          last_modified_by: string | null;
          state: Database["public"]["Enums"]["invoice_state"];
          supplier_id: number;
          updated_at: string;
        };
        Insert: {
          approved_date?: string | null;
          created_at?: string;
          feedback?: string | null;
          fmm?: string | null;
          invoice_id?: string;
          last_modified_by?: string | null;
          state?: Database["public"]["Enums"]["invoice_state"];
          supplier_id: number;
          updated_at?: string;
        };
        Update: {
          approved_date?: string | null;
          created_at?: string;
          feedback?: string | null;
          fmm?: string | null;
          invoice_id?: string;
          last_modified_by?: string | null;
          state?: Database["public"]["Enums"]["invoice_state"];
          supplier_id?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_data_last_modified_by_fkey";
            columns: ["last_modified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "invoice_data_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      invoice_docs: {
        Row: {
          doc_id: number;
          invoice_id: string;
          uploaded_at: string | null;
        };
        Insert: {
          doc_id?: never;
          invoice_id: string;
          uploaded_at?: string | null;
        };
        Update: {
          doc_id?: never;
          invoice_id?: string;
          uploaded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_docs_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoice_data";
            referencedColumns: ["invoice_id"];
          },
        ];
      };
      materials: {
        Row: {
          created_at: string;
          material_code: string;
          measurement_unit: string | null;
          subheading: string | null;
          type: Database["public"]["Enums"]["material_type"] | null;
          material_search: string | null;
        };
        Insert: {
          created_at?: string;
          material_code: string;
          measurement_unit?: string | null;
          subheading?: string | null;
          type?: Database["public"]["Enums"]["material_type"] | null;
        };
        Update: {
          created_at?: string;
          material_code?: string;
          measurement_unit?: string | null;
          subheading?: string | null;
          type?: Database["public"]["Enums"]["material_type"] | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          profile_id: string;
          updated_at: string | null;
          user_role: "administrator" | "employee" | "guest" | null;
          profiles_search: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          profile_id: string;
          updated_at?: string | null;
          user_role?: "administrator" | "employee" | "guest" | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          profile_id?: string;
          updated_at?: string | null;
          user_role?: "administrator" | "employee" | "guest" | null;
        };
        Relationships: [];
      };
      supplier_data: {
        Row: {
          base_bill_id: string;
          bill_number: string;
          billed_currency: Database["public"]["Enums"]["currency"];
          billed_quantity: number;
          billed_total_price: number;
          billed_unit_price: number;
          created_at: string;
          created_by: string | null;
          gross_weight: number;
          invoice_id: string;
          modified_at: string;
          packages: number;
          supplier_data_id: string;
          trm: number;
          supplier_data_search: string | null;
        };
        Insert: {
          base_bill_id: string;
          bill_number: string;
          billed_currency: Database["public"]["Enums"]["currency"];
          billed_quantity: number;
          billed_total_price: number;
          billed_unit_price: number;
          created_at?: string;
          created_by?: string | null;
          gross_weight: number;
          invoice_id: string;
          modified_at?: string;
          packages: number;
          supplier_data_id?: string;
          trm: number;
        };
        Update: {
          base_bill_id?: string;
          bill_number?: string;
          billed_currency?: Database["public"]["Enums"]["currency"];
          billed_quantity?: number;
          billed_total_price?: number;
          billed_unit_price?: number;
          created_at?: string;
          created_by?: string | null;
          gross_weight?: number;
          invoice_id?: string;
          modified_at?: string;
          packages?: number;
          supplier_data_id?: string;
          trm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_data_base_bill_id_fkey";
            columns: ["base_bill_id"];
            isOneToOne: false;
            referencedRelation: "base_bills";
            referencedColumns: ["base_bill_id"];
          },
          {
            foreignKeyName: "supplier_data_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "supplier_data_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoice_data";
            referencedColumns: ["invoice_id"];
          },
        ];
      };
      supplier_employees: {
        Row: {
          created_at: string;
          profile_id: string;
          supplier_employee_id: number;
          supplier_id: number;
        };
        Insert: {
          created_at?: string;
          profile_id: string;
          supplier_employee_id?: number;
          supplier_id: number;
        };
        Update: {
          created_at?: string;
          profile_id?: string;
          supplier_employee_id?: number;
          supplier_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_employees_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "supplier_employees_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["supplier_id"];
          },
        ];
      };
      suppliers: {
        Row: {
          created_at: string;
          domain: string | null;
          name: string;
          supplier_id: number;
          supplier_search: string | null;
        };
        Insert: {
          created_at?: string;
          domain?: string | null;
          name: string;
          supplier_id?: number;
        };
        Update: {
          created_at?: string;
          domain?: string | null;
          name?: string;
          supplier_id?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      base_bill_search: {
        Args: { "": Database["public"]["Tables"]["base_bills"]["Row"] };
        Returns: string;
      };
      delete_old_invoice_docs: {
        Args: Record<PropertyKey, never>;
        Returns: {
          path: string;
        }[];
      };
      get_invoice_email: {
        Args: { invoice_id: string };
        Returns: {
          email: string;
          invoice_id: string;
          invoice_updated_at: string;
          supplier_name: string;
          bill_number: string;
          purchase_order: string;
        }[];
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_employee: {
        Args: { _supplier_id: number; _profile_id?: string };
        Returns: boolean;
      };
      is_positive_value: {
        Args: { "": number };
        Returns: boolean;
      };
      material_search: {
        Args: { "": Database["public"]["Tables"]["materials"]["Row"] };
        Returns: string;
      };
      profiles_search: {
        Args: { "": Database["public"]["Tables"]["profiles"]["Row"] };
        Returns: string;
      };
      role_has_permission: {
        Args: {
          table_name: string;
          user_permission?: unknown;
          user_role?: "administrator" | "employee" | "guest";
        };
        Returns: boolean;
      };
      supplier_data_search: {
        Args: { "": Database["public"]["Tables"]["supplier_data"]["Row"] };
        Returns: string;
      };
      supplier_search: {
        Args: { "": Database["public"]["Tables"]["suppliers"]["Row"] };
        Returns: string;
      };
      track_bill: {
        Args: { bill_id: string; clean_bill?: boolean; clean_data?: boolean };
        Returns: undefined;
      };
      update_bill_quantities: {
        Args: { base_bill_id: string };
        Returns: undefined;
      };
      user_is: {
        Args: {
          user_role?: "administrator" | "employee" | "guest";
          user_id?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_options: "trm_usd" | "trm_eur";
      currency: "COP" | "USD" | "EUR";
      invoice_state: "pending" | "approved" | "rejected";
      material_type: "national" | "foreign" | "nationalized" | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends (
    {
      schema: keyof Database;
    }
  ) ?
    keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> =
  DefaultSchemaTableNameOrOptions extends { schema: keyof Database } ?
    (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends (
      {
        Row: infer R;
      }
    ) ?
      R
    : never
  : DefaultSchemaTableNameOrOptions extends (
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ) ?
    (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends (
      {
        Row: infer R;
      }
    ) ?
      R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends (
    {
      schema: keyof Database;
    }
  ) ?
    keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> =
  DefaultSchemaTableNameOrOptions extends { schema: keyof Database } ?
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends (
      {
        Insert: infer I;
      }
    ) ?
      I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ?
    DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends (
      {
        Insert: infer I;
      }
    ) ?
      I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends (
    {
      schema: keyof Database;
    }
  ) ?
    keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> =
  DefaultSchemaTableNameOrOptions extends { schema: keyof Database } ?
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends (
      {
        Update: infer U;
      }
    ) ?
      U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ?
    DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends (
      {
        Update: infer U;
      }
    ) ?
      U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends (
    {
      schema: keyof Database;
    }
  ) ?
    keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> =
  DefaultSchemaEnumNameOrOptions extends { schema: keyof Database } ?
    Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ?
    DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends (
    {
      schema: keyof Database;
    }
  ) ?
    keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> =
  PublicCompositeTypeNameOrOptions extends { schema: keyof Database } ?
    Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends (
    keyof DefaultSchema["CompositeTypes"]
  ) ?
    DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_options: ["trm_usd", "trm_eur"],
      currency: ["COP", "USD", "EUR"],
      invoice_state: ["pending", "approved", "rejected"],
      material_type: ["national", "foreign", "nationalized", "other"],
    },
  },
} as const;
