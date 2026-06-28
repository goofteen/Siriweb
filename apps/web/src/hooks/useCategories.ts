import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['product_categories']['Row']

export interface CategoryTree extends Category {
  children: Category[]
}

// ดึงทุก categories แล้ว build tree (parent + children)
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order')
      if (error) throw error

      const roots: CategoryTree[] = []
      const map = new Map<number, CategoryTree>()

      data.forEach((c) => map.set(c.id, { ...c, children: [] }))
      data.forEach((c) => {
        if (c.parent_id) {
          map.get(c.parent_id)?.children.push(c)
        } else {
          roots.push(map.get(c.id)!)
        }
      })

      return roots
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ดึง category เดียวตาม slug
export function useCategoryBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      if (!slug) return null
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  })
}
