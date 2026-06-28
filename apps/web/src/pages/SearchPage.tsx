/**
 * SearchPage — /search?q=...&vehicle=...&category=...&brand=...&minPrice=...&maxPrice=...&inStock=...
 * Filter state ผ่าน URL searchParams เพื่อ shareable/bookmarkable
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SmartSearchBox } from '@/components/search/SmartSearchBox'
import { FilterChips, type ActiveFilter } from '@/components/filter/FilterChips'
import { FilterDrawer, type FilterState } from '@/components/filter/FilterDrawer'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useSmartSearch } from '@/hooks/useProducts'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)

  const q = searchParams.get('q') ?? ''
  const vehicleId = searchParams.get('vehicle') ? Number(searchParams.get('vehicle')) : undefined
  const categoryId = searchParams.get('category') ? Number(searchParams.get('category')) : undefined
  const brand = searchParams.get('brand') ?? undefined
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const inStock = searchParams.get('inStock') === 'true' ? true : undefined

  const {
    data: searchResponse,
    isLoading,
    isFetching,
  } = useSmartSearch(
    { query: q || 'a', vehicleId, categoryId, brand, minPrice, maxPrice, inStock, limit: 30 },
    true // always run to show filtered results
  )

  function handleSearch(newQuery: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('q', newQuery)
      return next
    })
  }

  function handleFilterApply(filters: FilterState) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (filters.categoryId) next.set('category', String(filters.categoryId))
      else next.delete('category')
      if (filters.brand) next.set('brand', filters.brand)
      else next.delete('brand')
      if (filters.minPrice) next.set('minPrice', String(filters.minPrice))
      else next.delete('minPrice')
      if (filters.maxPrice) next.set('maxPrice', String(filters.maxPrice))
      else next.delete('maxPrice')
      if (filters.inStock) next.set('inStock', 'true')
      else next.delete('inStock')
      return next
    })
  }

  function handleRemoveFilter(key: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete(key)
      return next
    })
  }

  function handleClearAll() {
    setSearchParams((prev) => {
      const next = new URLSearchParams()
      if (prev.get('q')) next.set('q', prev.get('q')!)
      return next
    })
  }

  // build active filters list for chips
  const activeFilters: ActiveFilter[] = []
  if (vehicleId) activeFilters.push({ key: 'vehicle', label: 'รุ่นรถ', value: `ID:${vehicleId}` })
  if (categoryId) activeFilters.push({ key: 'category', label: 'หมวด', value: `ID:${categoryId}` })
  if (brand) activeFilters.push({ key: 'brand', label: 'ยี่ห้อ', value: brand })
  if (minPrice)
    activeFilters.push({
      key: 'minPrice',
      label: 'ราคาต่ำสุด',
      value: `฿${minPrice.toLocaleString()}`,
    })
  if (maxPrice)
    activeFilters.push({
      key: 'maxPrice',
      label: 'ราคาสูงสุด',
      value: `฿${maxPrice.toLocaleString()}`,
    })
  if (inStock) activeFilters.push({ key: 'inStock', label: 'สต็อก', value: 'มีสินค้า' })

  // smart_search returns minimal data — adapt to ProductCardData shape
  const results = (searchResponse?.results ?? []).map((r) => ({
    id: r.id,
    name_th: r.name_th,
    name_en: r.name_en,
    brand: r.brand,
    price: r.price,
    category_id: r.category_id,
    product_images: null,
    product_inventory: null,
  }))

  return (
    <div className="mx-auto max-w-2xl">
      {/* search box */}
      <div className="sticky top-[57px] z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <SmartSearchBox initialValue={q} autoFocus={!q} onSearch={handleSearch} />
      </div>

      {/* filter chips */}
      <div className="border-b border-border px-4 py-2.5">
        <FilterChips
          filters={activeFilters}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAll}
          onOpenDrawer={() => setFilterOpen(true)}
        />
      </div>

      {/* results */}
      <div className="px-4 py-4">
        {/* result count */}
        {!isLoading && q && (
          <p className="mb-3 text-sm text-muted-foreground">
            {isFetching
              ? 'กำลังค้นหา...'
              : results.length > 0
                ? `พบ ${results.length} รายการ สำหรับ "${q}"`
                : `ไม่พบสินค้าสำหรับ "${q}"`}
          </p>
        )}

        {/* zero-result suggestion */}
        {!isLoading && !isFetching && q && results.length === 0 && (
          <div className="mb-4 rounded-xl border border-border bg-muted/50 p-4 text-sm">
            <p className="font-medium">ลองค้นหาด้วย</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• ชื่อสินค้าภาษาไทย หรือ ภาษาอังกฤษ</li>
              <li>• รหัสอะไหล่ (เช่น 04465-02200)</li>
              <li>• ยี่ห้อสินค้า (เช่น Brembo, Bosch)</li>
            </ul>
          </div>
        )}

        <ProductGrid
          products={results}
          isLoading={isLoading}
          skeletonCount={6}
          emptyMessage={q ? undefined : 'พิมพ์ชื่อสินค้าหรือรุ่นรถเพื่อค้นหา'}
        />
      </div>

      {/* filter drawer */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        current={{ categoryId, brand, minPrice, maxPrice, inStock }}
        onApply={handleFilterApply}
      />
    </div>
  )
}
