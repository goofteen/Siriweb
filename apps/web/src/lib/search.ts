import { supabase } from './supabase'

export interface SearchParams {
  query: string
  vehicleId?: number
  categoryId?: number
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  limit?: number
  offset?: number
}

export interface SearchResult {
  id: number
  sku: string
  name_th: string
  name_en: string | null
  brand: string | null
  price: number
  category_id: number | null
  relevance: number
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  took_ms: number
}

/**
 * smart_search — wraps Supabase rpc('smart_search')
 *
 * เรียก PostgreSQL function ที่รวม FTS + trigram + synonym ไว้ในที่เดียว
 * ดู docs/07-SMART-SEARCH-GUIDE.md สำหรับรายละเอียด algorithm
 */
export async function smartSearch(params: SearchParams): Promise<SearchResponse> {
  const {
    query,
    vehicleId,
    categoryId,
    brand,
    minPrice,
    maxPrice,
    inStock,
    limit = 20,
    offset = 0,
  } = params

  const start = Date.now()

  const { data, error } = await supabase.rpc('smart_search', {
    p_query: query,
    p_vehicle_id: vehicleId ?? undefined,
    p_category_id: categoryId ?? undefined,
    p_brand: brand ?? undefined,
    p_min_price: minPrice ?? undefined,
    p_max_price: maxPrice ?? undefined,
    p_in_stock: inStock ?? undefined,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) throw new Error(`Search failed: ${error.message}`)

  const took_ms = Date.now() - start

  // log ผลการค้นหาแบบ fire-and-forget (ไม่ block response)
  logSearch(query, (data as SearchResult[])?.length ?? 0, vehicleId ?? undefined).catch(
    () => void 0 // ไม่ throw ถ้า log ล้มเหลว
  )

  return {
    results: (data as SearchResult[]) ?? [],
    query,
    took_ms,
  }
}

/**
 * searchSuggestions — autocomplete สำหรับ dropdown
 *
 * ขั้นที่ 1: ILIKE บน name_th, name_en, brand, sku (เร็ว — prefix/substring match)
 * ขั้นที่ 2: ถ้าได้ผลน้อยกว่า 3 รายการ → fallback ด้วย smart_search (trigram fuzzy)
 *           เพื่อรองรับ typo, คำสะกดผิด, หรือพิมภาษาอังกฤษแล้วอยากค้นภาษาไทย
 */
export async function searchSuggestions(
  query: string,
  limit = 5
): Promise<Array<{ name_th: string; brand: string | null }>> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  // --- ขั้น 1: Multi-field ILIKE ---
  const { data: exact } = await supabase
    .from('products')
    .select('name_th, brand')
    .or(
      `name_th.ilike.%${trimmed}%,name_en.ilike.%${trimmed}%,brand.ilike.%${trimmed}%,sku.ilike.%${trimmed}%`
    )
    .eq('is_active', true)
    .limit(limit)

  if ((exact?.length ?? 0) >= 3) return exact ?? []

  // --- ขั้น 2: Fuzzy fallback ผ่าน smart_search (trigram + FTS) ---
  try {
    const { data: fuzzy } = await supabase.rpc('smart_search', {
      p_query: trimmed,
      p_limit: limit,
    })

    const fuzzyMapped = ((fuzzy as SearchResult[]) ?? []).map((r) => ({
      name_th: r.name_th,
      brand: r.brand,
    }))

    // รวมและ deduplicate โดยใช้ name_th เป็น key
    const seen = new Set<string>()
    const merged = [...(exact ?? []), ...fuzzyMapped].filter((r) => {
      if (seen.has(r.name_th)) return false
      seen.add(r.name_th)
      return true
    })

    return merged.slice(0, limit)
  } catch {
    return exact ?? []
  }
}

/**
 * logSearch — บันทึก search log แบบ async
 * ใช้สำหรับ analytics และ zero-result tracking (ดู ROADMAP)
 */
async function logSearch(
  query: string,
  resultsCount: number,
  vehicleId: number | undefined
): Promise<void> {
  await supabase.from('search_logs').insert({
    query,
    results_count: resultsCount,
    vehicle_filter: vehicleId ?? null,
    // session_id จะเพิ่มใน Phase 1 Sprint 2 เมื่อมี SessionContext
  })
}
