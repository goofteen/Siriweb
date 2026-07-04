/**
 * SearchPage — /search?q=...&vehicle=...&vehicle_brand=...&vehicle_model=...&category=...&brand=...&minPrice=...&maxPrice=...&inStock=...
 * Filter state ผ่าน URL searchParams เพื่อ shareable/bookmarkable
 * Desktop: sidebar filter แสดงตลอด | Mobile: bottom drawer
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Car, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SmartSearchBox } from '@/components/search/SmartSearchBox'
import { FilterChips, type ActiveFilter } from '@/components/filter/FilterChips'
import { FilterDrawer, type FilterState } from '@/components/filter/FilterDrawer'
import { FilterPanel } from '@/components/filter/FilterPanel'
import { VehicleSelector } from '@/components/vehicle/VehicleSelector'
import { ProductGrid } from '@/components/product/ProductGrid'
import { BrandLogo } from '@/components/vehicle/BrandLogo'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSmartSearch, usePopularProducts } from '@/hooks/useProducts'
import {
  useVehicle,
  useVehicleBrands,
  useVehicleModels,
  useVehicleYears,
  useFirstVehicleByBrandModel,
} from '@/hooks/useVehicles'
import { useCategories } from '@/hooks/useCategories'
import { useGarage } from '@/contexts/GarageContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const q = searchParams.get('q') ?? ''
  usePageTitle(q ? `ค้นหา "${q}"` : 'ค้นหาสินค้า')

  const vehicleId = searchParams.get('vehicle') ? Number(searchParams.get('vehicle')) : undefined
  const vehicleBrand = searchParams.get('vehicle_brand') ?? undefined
  const vehicleModel = searchParams.get('vehicle_model') ?? undefined
  const categoryId = searchParams.get('category') ? Number(searchParams.get('category')) : undefined
  const brand = searchParams.get('brand') ?? undefined
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const inStock = searchParams.get('inStock') === 'true' ? true : undefined

  // ดึงชื่อรุ่นรถ — ดู Garage ก่อน (เร็ว ไม่ต้อง fetch) แล้วค่อย fallback hook
  const { vehicles: garageVehicles, addVehicle } = useGarage()
  const garageVehicle = vehicleId ? garageVehicles.find((v) => v.id === vehicleId) : undefined
  const { data: fetchedVehicle } = useVehicle(garageVehicle ? null : (vehicleId ?? null))

  // partial vehicle (vehicle_brand + vehicle_model ไม่มี year) — ดึง vehicleId แรกที่เจอ
  const { data: firstVehicle } = useFirstVehicleByBrandModel(
    vehicleId ? null : (vehicleBrand ?? null),
    vehicleId ? null : (vehicleModel ?? null)
  )

  // vehicleId จริงที่ใช้ filter
  const effectiveVehicleId = vehicleId ?? firstVehicle?.id

  // label สำหรับแสดงใน filter chip
  const vehicleLabel = garageVehicle
    ? `${garageVehicle.brand} ${garageVehicle.model} ${garageVehicle.year}`
    : fetchedVehicle
      ? `${fetchedVehicle.brand} ${fetchedVehicle.model} ${fetchedVehicle.year_from}`
      : vehicleBrand
        ? vehicleModel
          ? `${vehicleBrand} ${vehicleModel}`
          : vehicleBrand
        : effectiveVehicleId
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
    {
      query: q || undefined, // empty string falls through to filter-only search
      vehicleId: effectiveVehicleId,
      categoryId,
      brand,
      minPrice,
      maxPrice,
      inStock,
      limit: 30,
    },
    true
  )

  const { data: popularRaw = [] } = usePopularProducts(8)

  // === Save vehicle banner logic ===
  const bannerVehicleId = vehicleId ?? firstVehicle?.id
  const bannerBrand =
    garageVehicle?.brand ?? fetchedVehicle?.brand ?? firstVehicle?.brand ?? vehicleBrand
  const bannerModel =
    garageVehicle?.model ?? fetchedVehicle?.model ?? firstVehicle?.model ?? vehicleModel
  const bannerYear = garageVehicle?.year ?? fetchedVehicle?.year_from ?? firstVehicle?.year_from
  const isVehicleInGarage = bannerVehicleId
    ? garageVehicles.some((v) => v.id === bannerVehicleId)
    : false
  const hasVehicleSearch = !!(vehicleId || (vehicleBrand && vehicleModel))
  const showSaveBanner = hasVehicleSearch && !isVehicleInGarage && !bannerDismissed

  function handleSaveVehicle(v: { id: number; brand: string; model: string; year: number }) {
    addVehicle(v)
    setBannerDismissed(true)
  }

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

  function handleSidebarVehicleSelect(id: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('vehicle', String(id))
      next.delete('vehicle_brand')
      next.delete('vehicle_model')
      return next
    })
  }

  function handleRemoveFilter(key: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (key === 'vehicle') {
        next.delete('vehicle')
        next.delete('vehicle_brand')
        next.delete('vehicle_model')
      } else {
        next.delete(key)
      }
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

  // build active filters list
  const activeFilters: ActiveFilter[] = []
  if ((effectiveVehicleId || vehicleBrand) && vehicleLabel)
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

  const sidebarState: FilterState = { categoryId, brand, minPrice, maxPrice, inStock }

  // ดึง images + inventory สำหรับ search results
  const searchProductIds = useMemo(
    () => (searchResponse?.results ?? []).map((r) => r.id),
    [searchResponse]
  )
  const { data: productExtras } = useQuery({
    queryKey: ['search-product-extras', searchProductIds],
    queryFn: async () => {
      if (searchProductIds.length === 0) return []
      const { data } = await supabase
        .from('products')
        .select('id, product_images(url, is_primary), product_inventory(quantity)')
        .in('id', searchProductIds)
      return data ?? []
    },
    enabled: searchProductIds.length > 0,
    staleTime: 60 * 1000,
  })
  const extrasMap = useMemo(() => {
    const map = new Map<
      number,
      {
        images: { url: string; is_primary: boolean | null }[] | null
        inventory: { quantity: number }[] | null
      }
    >()
    for (const p of productExtras ?? []) {
      map.set(p.id, {
        images: p.product_images as { url: string; is_primary: boolean | null }[] | null,
        inventory: p.product_inventory
          ? [p.product_inventory as unknown as { quantity: number }]
          : null,
      })
    }
    return map
  }, [productExtras])

  const results = (searchResponse?.results ?? []).map((r) => {
    const extra = extrasMap.get(r.id)
    return {
      id: r.id,
      name_th: r.name_th,
      name_en: r.name_en,
      brand: r.brand,
      price: r.price,
      category_id: r.category_id,
      product_images: extra?.images ?? null,
      product_inventory: extra?.inventory ?? null,
    }
  })

  const popularProducts = popularRaw.map((p) => ({
    ...p,
    product_inventory: p.product_inventory
      ? [p.product_inventory as unknown as { quantity: number }]
      : null,
  }))

  const hasQuery = !!q
  const zeroResults = !isLoading && !isFetching && hasQuery && results.length === 0

  return (
    <div className="mx-auto max-w-6xl">
      {/* search box — sticky */}
      <div className="sticky top-[57px] z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="px-4 py-3">
          <SmartSearchBox initialValue={q} autoFocus={!q} onSearch={handleSearch} />
        </div>
      </div>

      <div className="flex gap-0">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border">
          <div className="sticky top-[130px] overflow-y-auto max-h-[calc(100vh-130px)] p-5 space-y-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold">รุ่นรถ</h3>
              {vehicleLabel && (
                <div className="mb-3 rounded-lg bg-accent/10 border border-accent/30 px-3 py-2">
                  <p className="text-xs font-medium text-accent uppercase tracking-wide">
                    กำลังดูอะไหล่สำหรับ
                  </p>
                  <p className="text-sm font-semibold">{vehicleLabel}</p>
                  <button
                    onClick={() => handleRemoveFilter('vehicle')}
                    className="mt-1 text-xs text-muted-foreground hover:text-destructive underline-offset-2 hover:underline"
                  >
                    ล้างตัวกรองรถ
                  </button>
                </div>
              )}
              <VehicleSelector vertical onSelect={(id) => handleSidebarVehicleSelect(id)} />
            </div>

            <div className="border-t border-border" />

            <div>
              <h3 className="mb-3 text-sm font-semibold">กรองสินค้า</h3>
              <FilterPanel
                draft={sidebarState}
                onChange={(next) => handleFilterApply(next)}
                onApply={() => {}}
                onReset={() => handleFilterApply({})}
                hideActions
              />
            </div>

            {(categoryId || brand || minPrice || maxPrice || inStock) && (
              <button
                onClick={() => handleFilterApply({})}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
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

          {/* active filter chips — desktop */}
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
            {/* save vehicle card */}
            {showSaveBanner && (
              <SaveVehicleBanner
                initialBrand={bannerBrand}
                initialModel={bannerModel}
                initialYear={bannerYear}
                initialVehicleId={bannerVehicleId}
                onSave={handleSaveVehicle}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}

            {!isLoading && hasQuery && (
              <p className="mb-3 text-sm text-muted-foreground">
                {isFetching
                  ? 'กำลังค้นหา...'
                  : results.length > 0
                    ? `พบ ${results.length} รายการ สำหรับ "${q}"`
                    : `ไม่พบสินค้าที่ตรงกับ "${q}"`}
              </p>
            )}

            {zeroResults && (
              <>
                <div className="mb-5 rounded-xl border border-border bg-muted/50 p-4 text-sm">
                  <p className="font-medium">ลองค้นหาด้วย</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• ชื่อสินค้าภาษาไทย หรือ ภาษาอังกฤษ (brake pad, ผ้าเบรก)</li>
                    <li>• รหัสอะไหล่ (เช่น 04465-02200)</li>
                    <li>• ยี่ห้อสินค้า (เช่น Brembo, Bosch, Denso)</li>
                  </ul>
                </div>
                {popularProducts.length > 0 && (
                  <>
                    <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                      สินค้าที่คนนิยม
                    </h2>
                    <ProductGrid products={popularProducts} isLoading={false} skeletonCount={4} />
                  </>
                )}
              </>
            )}

            {!zeroResults && (
              <ProductGrid
                products={results}
                isLoading={isLoading}
                skeletonCount={6}
                emptyMessage={hasQuery ? undefined : 'พิมพ์ชื่อสินค้าหรือรุ่นรถเพื่อค้นหา'}
              />
            )}
          </div>
        </div>
      </div>

      {/* filter drawer — mobile เท่านั้น */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        current={sidebarState}
        onApply={handleFilterApply}
        vehicleLabel={vehicleLabel}
        onVehicleSelect={handleSidebarVehicleSelect}
        onVehicleRemove={() => handleRemoveFilter('vehicle')}
      />
    </div>
  )
}

// ===== SaveVehicleBanner =====
interface SaveVehicleBannerProps {
  initialBrand?: string
  initialModel?: string
  initialYear?: number
  initialVehicleId?: number
  onSave: (v: { id: number; brand: string; model: string; year: number }) => void
  onDismiss: () => void
}

function SaveVehicleBanner({
  initialBrand,
  initialModel,
  initialYear,
  initialVehicleId,
  onSave,
  onDismiss,
}: SaveVehicleBannerProps) {
  // เริ่มจาก null ทั้งหมด แล้ว sync เมื่อข้อมูล async พร้อม (fetchedVehicle / firstVehicle)
  const [brand, setBrand] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [yearId, setYearId] = useState<number | null>(null)
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    // prefill ครั้งเดียวเมื่อ initialBrand พร้อม (รอ async fetch)
    if (initialized.current || !initialBrand) return
    setBrand(initialBrand)
    if (initialModel) setModel(initialModel)
    if (initialVehicleId) setYearId(initialVehicleId)
    if (initialYear) setYearFrom(initialYear)
    initialized.current = true
  }, [initialBrand, initialModel, initialVehicleId, initialYear])

  const { data: brands = [] } = useVehicleBrands()
  const { data: models = [] } = useVehicleModels(brand)
  const { data: years = [] } = useVehicleYears(brand, model)

  function handleBrandChange(value: string) {
    setBrand(value)
    setModel(null)
    setYearId(null)
    setYearFrom(null)
  }

  function handleModelChange(value: string) {
    setModel(value)
    setYearId(null)
    setYearFrom(null)
  }

  function handleYearChange(value: string) {
    const year = years.find((y) => String(y.id) === value)
    if (year) {
      setYearId(year.id)
      setYearFrom(year.year_from)
    }
  }

  const canSave = !!(yearId && brand && model && yearFrom)

  // คำนวณ display string สำหรับปี (ป้องกัน SelectValue แสดง raw ID)
  const selectedYearObj = years.find((y) => y.id === yearId)
  const yearDisplay = selectedYearObj
    ? `${selectedYearObj.year_from}${selectedYearObj.year_to ? `–${String(selectedYearObj.year_to).slice(-2)}` : '+'}`
    : yearFrom
      ? String(yearFrom)
      : null

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* header — เหมือน card ใน home */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="size-4 text-accent" />
          <span className="text-sm font-medium">บันทึกรถนี้ไว้ในโรงรถของคุณไหม?</span>
        </div>
        <button
          onClick={onDismiss}
          aria-label="ปิด"
          className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* dropdowns + ปุ่มบันทึก — บรรทัดเดียวกัน เหมือน VehicleSelector */}
      <div className="flex items-center gap-2">
        {/* Brand */}
        <div className="min-w-0 flex-1">
          <Select value={brand ?? ''} onValueChange={(v) => v && handleBrandChange(v)}>
            <SelectTrigger className="h-10 w-full">
              {brand ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <BrandLogo brand={brand} className="h-4 w-8 shrink-0 object-contain" />
                  <span className="truncate">{brand}</span>
                </span>
              ) : (
                <SelectValue placeholder="ยี่ห้อ" />
              )}
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  <span className="flex items-center gap-2">
                    <BrandLogo brand={b} className="h-4 w-8 object-contain" />
                    {b}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="min-w-0 flex-1">
          <Select
            value={model ?? ''}
            onValueChange={(v) => v && handleModelChange(v)}
            disabled={!brand}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="รุ่น" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="min-w-0 flex-1">
          <Select
            value={yearId ? String(yearId) : ''}
            onValueChange={(v) => v && handleYearChange(v)}
            disabled={!model}
          >
            <SelectTrigger className="h-10 w-full">
              {yearDisplay ? (
                <span className="truncate">{yearDisplay}</span>
              ) : (
                <SelectValue placeholder="ปี" />
              )}
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.year_from}
                  {y.year_to ? `–${String(y.year_to).slice(-2)}` : '+'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ปุ่มบันทึก — inline กับ dropdown */}
        <button
          onClick={() =>
            canSave && onSave({ id: yearId!, brand: brand!, model: model!, year: yearFrom! })
          }
          disabled={!canSave}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
        >
          บันทึกรถ
        </button>
      </div>
    </div>
  )
}
