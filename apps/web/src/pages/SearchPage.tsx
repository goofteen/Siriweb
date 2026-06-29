/**
 * SearchPage — /search?q=...&vehicle=...&category=...&brand=...&minPrice=...&maxPrice=...&inStock=...
 * Filter state ผ่าน URL searchParams เพื่อ shareable/bookmarkable
 * Desktop: sidebar filter แสดงตลอด | Mobile: bottom drawer
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SmartSearchBox } from '@/components/search/SmartSearchBox'
import { FilterChips, type ActiveFilter } from '@/components/filter/FilterChips'
import { FilterDrawer, type FilterState } from '@/components/filter/FilterDrawer'
import { FilterPanel } from '@/components/filter/FilterPanel'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useSmartSearch } from '@/hooks/useProducts'
import { useVehicle } from '@/hooks/useVehicles'
import { useCategories } from '@/hooks/useCategories'
import { useGarage } from '@/contexts/GarageContext'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const q = searchParams.get('q') ?? ''
  usePageTitle(q ? `ค้นหา "${q}"` : 'ค้นหาสินค้า')

  const vehicleId = searchParams.get('vehicle') ? Number(searchParams.get('vehicle')) : undefined
  const categoryId = searchParams.get('category') ? Number(searchParams.get('category')) : undefined
  const brand = searchParams.get('brand') ?? undefined
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const inStock = searchParams.get('inStock') === 'true' ? true : undefined

  // ดึงชื่อรุ่นรถ — ดู Garage ก่อน (เร็ว ไม่ต้อง fetch) แล้วค่อย fallback hook
  const { vehicles: garageVehicles } = useGarage()
  const garageVehicle = vehicleId ? garageVehicles.find((v) => v.id === vehicleId) : undefined
  const { data: fetchedVehicle } = useVehicle(garageVehicle ? null : (vehicleId ?? null))
  const vehicleLabel = garageVehicle
    ? `${garageVehicle.brand} ${garageVehicle.model} ${garageVehicle.year}`
    : fetchedVehicle
      ? `${fetchedVehicle.brand} ${fetchedVehicle.model} ${fetchedVehicle.year_from}`
      : vehicleId
        ? 'กำลังโหลด...'
        : undefined

  // ดึงชื่อหมวดหมู่
  const { data: categoryTree = [] } = useCategories()
  const allCategories = categoryTree.flatMap((c) => [c, ...c.children])
  const categoryLabel = categoryId
    ? (allCategories.find((c) => c.id === categoryId)?.name_th ?? 'กำลังโหลด...')
    : undefined

  const {
    data: searchResponse,
    isLoading,
    isFetching,
  } = useSmartSearch(
    { query: q || 'a', vehicleId, categoryId, brand, minPrice, maxPrice, inStock, limit: 30 },
    true
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
      if (prev.get('vehicle')) next.set('vehicle', prev.get('vehicle')!)
      return next
    })
  }

  // build active filters list — ใช้ชื่อจริงแทน ID
  const activeFilters: ActiveFilter[] = []
  if (vehicleId && vehicleLabel)
    activeFilters.push({ key: 'vehicle', label: 'รุ่นรถ', value: vehicleLabel })
  if (categoryId && categoryLabel)
    activeFilters.push({ key: 'category', label: 'หมวด', value: categoryLabel })
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

  // sidebar draft state — apply ทันทีเมื่อเปลี่ยน
  const sidebarState: FilterState = { categoryId, brand, minPrice, maxPrice, inStock }
  function handleSidebarChange(next: FilterState) {
    handleFilterApply(next)
  }

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
    <div className="mx-auto max-w-6xl">
      {/* search box — sticky */}
      <div className="sticky top-[57px] z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:max-w-none">
        <SmartSearchBox initialValue={q} autoFocus={!q} onSearch={handleSearch} />
      </div>

      <div className="flex gap-0">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border">
          <div className="sticky top-[130px] p-5 space-y-1">
            <h2 className="mb-4 text-base font-semibold">กรองสินค้า</h2>

            {/* รุ่นรถที่ filter อยู่ */}
            {vehicleLabel && (
              <div className="mb-4 rounded-lg bg-accent/10 border border-accent/30 px-3 py-2">
                <p className="text-xs font-medium text-accent uppercase tracking-wide">รุ่นรถ</p>
                <p className="text-sm font-semibold">{vehicleLabel}</p>
                <button
                  onClick={() => handleRemoveFilter('vehicle')}
                  className="mt-1 text-xs text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
                >
                  ล้างตัวกรองรถ
                </button>
              </div>
            )}

            <FilterPanel
              draft={sidebarState}
              onChange={handleSidebarChange}
              onApply={() => {}}
              onReset={() => {
                handleFilterApply({})
              }}
              hideActions
            />

            {/* ปุ่ม reset สำหรับ sidebar */}
            {(categoryId || brand || minPrice || maxPrice || inStock) && (
              <button
                onClick={() => handleFilterApply({})}
                className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <div className="min-w-0 flex-1">
          {/* filter chips — mobile เท่านั้น */}
          <div className="border-b border-border px-4 py-2.5 lg:hidden">
            <FilterChips
              filters={activeFilters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAll}
              onOpenDrawer={() => setFilterOpen(true)}
            />
          </div>

          {/* active filter chips บน desktop (เฉพาะ vehicle chip เพราะที่เหลืออยู่ sidebar) */}
          {activeFilters.length > 0 && (
            <div className="hidden lg:flex flex-wrap gap-2 border-b border-border px-5 py-2.5">
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-sm"
                >
                  <span className="text-muted-foreground">{f.label}:</span>
                  <span className="font-medium">{f.value}</span>
                  <button
                    onClick={() => handleRemoveFilter(f.key)}
                    className="ml-0.5 text-muted-foreground hover:text-destructive"
                    aria-label={`ลบ ${f.label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* results */}
          <div className="px-4 py-4 lg:px-5">
            {!isLoading && q && (
              <p className="mb-3 text-sm text-muted-foreground">
                {isFetching
                  ? 'กำลังค้นหา...'
                  : results.length > 0
                    ? `พบ ${results.length} รายการ${q ? ` สำหรับ "${q}"` : ''}`
                    : `ไม่พบสินค้า${q ? ` สำหรับ "${q}"` : ''}`}
              </p>
            )}

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
        </div>
      </div>

      {/* filter drawer — mobile เท่านั้น */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        current={sidebarState}
        onApply={handleFilterApply}
      />
    </div>
  )
}
