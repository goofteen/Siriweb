import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { FilterChips, type ActiveFilter } from '@/components/filter/FilterChips'
import { FilterDrawer, type FilterState } from '@/components/filter/FilterDrawer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useCategoryBySlug } from '@/hooks/useCategories'
import { useProductsByCategory } from '@/hooks/useProducts'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})

  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(slug)
  const { data: products = [], isLoading: productsLoading } = useProductsByCategory(
    category?.id ?? null
  )

  // filter products client-side (ข้อมูลน้อย — server-side filter ใน Sprint 3)
  const filtered = products.filter((p) => {
    if (filters.inStock) {
      const inv = p.product_inventory as { quantity: number } | null
      if ((inv?.quantity ?? 0) === 0) return false
    }
    if (filters.minPrice && p.price < filters.minPrice) return false
    if (filters.maxPrice && p.price > filters.maxPrice) return false
    return true
  })

  // adapt Supabase shape to ProductCardData (product_inventory is 1-1 in query)
  const adaptedProducts = filtered.map((p) => ({
    ...p,
    product_inventory: p.product_inventory
      ? [p.product_inventory as unknown as { quantity: number }]
      : null,
  }))

  const activeFilters: ActiveFilter[] = []
  if (filters.inStock) activeFilters.push({ key: 'inStock', label: 'สต็อก', value: 'มีสินค้า' })
  if (filters.minPrice)
    activeFilters.push({
      key: 'minPrice',
      label: 'ราคาต่ำสุด',
      value: `฿${filters.minPrice.toLocaleString()}`,
    })
  if (filters.maxPrice)
    activeFilters.push({
      key: 'maxPrice',
      label: 'ราคาสูงสุด',
      value: `฿${filters.maxPrice.toLocaleString()}`,
    })

  if (categoryLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-medium">ไม่พบหมวดหมู่นี้</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          กลับหน้าหลัก
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* breadcrumb */}
      <div className="flex items-center gap-1 px-4 py-3 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          หน้าหลัก
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{category.name_th}</span>
      </div>

      {/* header */}
      <div className="px-4 pb-4">
        <h1 className="text-xl font-bold">{category.name_th}</h1>
        {!productsLoading && (
          <p className="mt-0.5 text-sm text-muted-foreground">{filtered.length} รายการ</p>
        )}
      </div>

      {/* filters */}
      <div className="border-b border-border px-4 py-2.5">
        <FilterChips
          filters={activeFilters}
          onRemove={(key) =>
            setFilters((f) => {
              const n = { ...f }
              delete n[key as keyof FilterState]
              return n
            })
          }
          onClearAll={() => setFilters({})}
          onOpenDrawer={() => setFilterOpen(true)}
        />
      </div>

      {/* products */}
      <div className="px-4 py-4">
        <ProductGrid
          products={adaptedProducts}
          isLoading={productsLoading}
          emptyMessage="ไม่พบสินค้าในหมวดนี้"
        />
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        current={filters}
        onApply={setFilters}
      />
    </div>
  )
}
