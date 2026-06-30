import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { smartSearch, type SearchParams, type SearchResult } from '@/lib/search'

export type { SearchResult }

// ค้นหาสินค้าด้วย smart_search RPC
export function useSmartSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['smart-search', params],
    queryFn: () => smartSearch(params),
    enabled:
      enabled &&
      ((params.query?.trim().length ?? 0) > 0 ||
        !!(
          params.vehicleId ||
          params.categoryId ||
          params.brand ||
          params.minPrice ||
          params.maxPrice ||
          params.inStock
        )),
    staleTime: 30 * 1000, // cache search result 30 วินาที
    placeholderData: (prev) => prev, // ไม่ reset list เมื่อ query เปลี่ยน
  })
}

// ดึงสินค้าตาม vehicle ID (สำหรับ browse by car)
export function useProductsByVehicle(vehicleId: number | null) {
  return useQuery({
    queryKey: ['products-by-vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return []
      const { data, error } = await supabase
        .from('product_vehicles')
        .select(
          `
          product_id,
          products (
            id, sku, name_th, name_en, brand, price, category_id, is_active,
            product_images ( url, is_primary ),
            product_inventory ( quantity )
          )
        `
        )
        .eq('vehicle_id', vehicleId)

      if (error) throw error
      return (data ?? [])
        .map((row) => row.products)
        .filter((p): p is NonNullable<typeof p> => p !== null && p.is_active === true)
    },
    enabled: !!vehicleId,
    staleTime: 2 * 60 * 1000,
  })
}

// ดึงสินค้าตาม category slug
export function useProductsByCategory(categoryId: number | null, limit = 20) {
  return useQuery({
    queryKey: ['products-by-category', categoryId, limit],
    queryFn: async () => {
      if (!categoryId) return []
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id, sku, name_th, name_en, brand, price, category_id, is_active,
          product_images ( url, is_primary ),
          product_inventory ( quantity )
        `
        )
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name_th')
        .limit(limit)

      if (error) throw error
      return data ?? []
    },
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000,
  })
}

// ดึง product detail + images + vehicles ที่ใช้ได้
export function useProductDetail(productId: number | undefined) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories ( id, name_th, name_en, slug ),
          product_images ( id, url, alt_text, sort_order, is_primary ),
          product_inventory ( quantity, warehouse_code ),
          product_vehicles (
            vehicle_id,
            vehicles ( id, brand, model, year_from, year_to, engine )
          )
        `
        )
        .eq('id', productId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
  })
}

// ดึงสินค้ายอดนิยม (สำหรับ home page — ใช้ by category/brand แทนเพราะยังไม่มี analytics)
export function usePopularProducts(limit = 8) {
  return useQuery({
    queryKey: ['popular-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id, sku, name_th, name_en, brand, price, category_id,
          product_images ( url, is_primary ),
          product_inventory ( quantity )
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
