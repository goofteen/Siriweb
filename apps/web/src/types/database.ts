export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          id: number
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          code: string
          created_at: string | null
          id: number
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          admin_notes: string | null
          contact_email: string | null
          contact_line: string | null
          contact_phone: string | null
          created_at: string | null
          customer_name: string
          id: number
          message: string
          product_ids: number[] | null
          session_id: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          contact_email?: string | null
          contact_line?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_name: string
          id?: number
          message: string
          product_ids?: number[] | null
          session_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          contact_email?: string | null
          contact_line?: string | null
          contact_phone?: string | null
          created_at?: string | null
          customer_name?: string
          id?: number
          message?: string
          product_ids?: number[] | null
          session_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'inquiries_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          name_en: string | null
          name_th: string
          parent_id: number | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name_en?: string | null
          name_th: string
          parent_id?: number | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name_en?: string | null
          name_th?: string
          parent_id?: number | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'product_categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: number
          is_primary: boolean | null
          product_id: number
          sort_order: number | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          product_id: number
          sort_order?: number | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          product_id?: number
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_availability'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_inventory: {
        Row: {
          last_updated: string | null
          product_id: number
          quantity: number
          warehouse_code: string | null
        }
        Insert: {
          last_updated?: string | null
          product_id: number
          quantity?: number
          warehouse_code?: string | null
        }
        Update: {
          last_updated?: string | null
          product_id?: number
          quantity?: number
          warehouse_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'product_inventory_product_id_fkey'
            columns: ['product_id']
            isOneToOne: true
            referencedRelation: 'product_availability'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_inventory_product_id_fkey'
            columns: ['product_id']
            isOneToOne: true
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_inventory_branches: {
        Row: {
          branch_id: number
          last_updated: string | null
          product_id: number
          quantity: number
        }
        Insert: {
          branch_id: number
          last_updated?: string | null
          product_id: number
          quantity?: number
        }
        Update: {
          branch_id?: number
          last_updated?: string | null
          product_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'product_inventory_branches_branch_id_fkey'
            columns: ['branch_id']
            isOneToOne: false
            referencedRelation: 'branches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_inventory_branches_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_availability'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_inventory_branches_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_vehicles: {
        Row: {
          product_id: number
          vehicle_id: number
        }
        Insert: {
          product_id: number
          vehicle_id: number
        }
        Update: {
          product_id?: number
          vehicle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'product_vehicles_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_availability'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_vehicles_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_vehicles_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: number | null
          created_at: string | null
          description_en: string | null
          description_th: string | null
          id: number
          is_active: boolean | null
          name_en: string | null
          name_th: string
          oem_part_number: string | null
          price: number
          search_vector: unknown
          searchable_text: string | null
          sku: string
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: number | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          id?: number
          is_active?: boolean | null
          name_en?: string | null
          name_th: string
          oem_part_number?: string | null
          price: number
          search_vector?: unknown
          searchable_text?: string | null
          sku: string
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: number | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          id?: number
          is_active?: boolean | null
          name_en?: string | null
          name_th?: string
          oem_part_number?: string | null
          price?: number
          search_vector?: unknown
          searchable_text?: string | null
          sku?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string | null
          id: number
          query: string
          results_count: number
          session_id: string | null
          vehicle_filter: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          query: string
          results_count: number
          session_id?: string | null
          vehicle_filter?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          query?: string
          results_count?: number
          session_id?: string | null
          vehicle_filter?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'search_logs_vehicle_filter_fkey'
            columns: ['vehicle_filter']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      search_synonyms: {
        Row: {
          canonical: string
          created_at: string | null
          id: number
          synonyms: string[]
        }
        Insert: {
          canonical: string
          created_at?: string | null
          id?: number
          synonyms: string[]
        }
        Update: {
          canonical?: string
          created_at?: string | null
          id?: number
          synonyms?: string[]
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          data: Json | null
          expires_at: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          expires_at: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_vehicles: {
        Row: {
          created_at: string | null
          id: number
          is_primary: boolean | null
          license_plate: string | null
          nickname: string | null
          session_id: string
          vehicle_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          license_plate?: string | null
          nickname?: string | null
          session_id: string
          vehicle_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          license_plate?: string | null
          nickname?: string | null
          session_id?: string
          vehicle_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'user_vehicles_vehicle_id_fkey'
            columns: ['vehicle_id']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string | null
          engine: string | null
          id: number
          model: string
          year_from: number
          year_to: number
        }
        Insert: {
          brand: string
          created_at?: string | null
          engine?: string | null
          id?: number
          model: string
          year_from: number
          year_to: number
        }
        Update: {
          brand?: string
          created_at?: string | null
          engine?: string | null
          id?: number
          model?: string
          year_from?: number
          year_to?: number
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          added_at: string | null
          id: number
          note: string | null
          product_id: number
          session_id: string
        }
        Insert: {
          added_at?: string | null
          id?: number
          note?: string | null
          product_id: number
          session_id: string
        }
        Update: {
          added_at?: string | null
          id?: number
          note?: string | null
          product_id?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'product_availability'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'wishlist_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      product_availability: {
        Row: {
          id: number | null
          in_stock: boolean | null
          name_th: string | null
          price: number | null
          quantity: number | null
          sku: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      all_words_match: {
        Args: { query: string; search_text: string }
        Returns: boolean
      }
      expand_query_with_synonyms: {
        Args: { input_query: string }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { '': string }; Returns: string[] }
      smart_search: {
        Args: {
          p_brand?: string
          p_category_id?: number
          p_in_stock?: boolean
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_query: string
          p_vehicle_id?: number
        }
        Returns: {
          brand: string
          category_id: number
          id: number
          name_en: string
          name_th: string
          price: number
          relevance: number
          sku: string
        }[]
      }
      unaccent: { Args: { '': string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
