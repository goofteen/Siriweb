import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Car, X, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

interface AdminVehicle {
  id: number
  brand: string
  model: string
  year_from: number
  year_to: number
  engine: string | null
}

const PAGE_SIZE = 20

export default function AdminVehiclesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [showQuickBrand, setShowQuickBrand] = useState(false)
  const [quickBrand, setQuickBrand] = useState('')
  const brandInputRef = useRef<HTMLInputElement>(null)

  function handleQuickBrand(e: React.FormEvent) {
    e.preventDefault()
    const brand = quickBrand.trim()
    if (!brand) return
    setShowQuickBrand(false)
    setQuickBrand('')
    navigate('/admin/vehicles/new', { state: { brand } })
  }

  // fetch distinct brands for filter dropdown
  const { data: allBrandsData } = useQuery({
    queryKey: ['admin-vehicle-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('brand').order('brand')
      if (error) throw error
      return [...new Set((data ?? []).map((v) => v.brand as string))]
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles', page, search, brandFilter],
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select('id, brand, model, year_from, year_to, engine', { count: 'exact' })
        .order('brand')
        .order('model')
        .order('year_from')
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (brandFilter) {
        query = query.eq('brand', brandFilter)
      } else if (search.trim()) {
        query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { vehicles: (data ?? []) as AdminVehicle[], total: count ?? 0 }
    },
    staleTime: 30 * 1000,
  })

  const vehicles = data?.vehicles ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setBrandFilter('')
    setPage(0)
  }

  function handleBrandFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    setBrandFilter(e.target.value)
    setSearch('')
    setPage(0)
  }

  const hasFilter = search.trim() !== '' || brandFilter !== ''

  const allBrands = allBrandsData ?? []
  // group by brand for display
  const brands = [...new Set(vehicles.map((v) => v.brand))]

  return (
    <div>
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">รุ่นรถ</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-muted-foreground">ทั้งหมด {total} รุ่น</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowQuickBrand((v) => !v)
              setTimeout(() => brandInputRef.current?.focus(), 50)
            }}
          >
            <Plus className="mr-1.5 size-4" />
            เพิ่มยี่ห้อรถ
          </Button>
          <Button asChild>
            <Link to="/admin/vehicles/new">
              <Plus className="mr-1.5 size-4" />
              เพิ่มรุ่นรถ
            </Link>
          </Button>
        </div>
      </div>

      {/* quick-add brand */}
      {showQuickBrand && (
        <form
          onSubmit={handleQuickBrand}
          className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
        >
          <Input
            ref={brandInputRef}
            value={quickBrand}
            onChange={(e) => setQuickBrand(e.target.value)}
            placeholder="ยี่ห้อรถ เช่น Toyota, Honda"
            className="flex-1"
            list="brand-suggestions"
          />
          <datalist id="brand-suggestions">
            {[...new Set(vehicles.map((v) => v.brand))].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <Button type="submit" size="sm" disabled={!quickBrand.trim()}>
            ถัดไป →
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowQuickBrand(false)
              setQuickBrand('')
            }}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </form>
      )}

      {/* search + filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="ค้นหายี่ห้อหรือรุ่น..."
            className="h-9 w-56 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <select
          value={brandFilter}
          onChange={handleBrandFilter}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
        >
          <option value="">ทุกยี่ห้อ</option>
          {allBrands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {hasFilter && (
          <button
            onClick={() => {
              setSearch('')
              setBrandFilter('')
              setPage(0)
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* table */}
      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="mb-3 size-10 text-muted-foreground/30" />
            <p className="font-medium">{hasFilter ? 'ไม่พบรุ่นรถที่ค้นหา' : 'ยังไม่มีรุ่นรถ'}</p>
            {!hasFilter && (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/admin/vehicles/new">เพิ่มรุ่นแรก</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ยี่ห้อ</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">รุ่น</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ปี</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    เครื่องยนต์
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {brands.map((brand) =>
                  vehicles
                    .filter((v) => v.brand === brand)
                    .map((v, idx) => (
                      <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{idx === 0 ? brand : ''}</td>
                        <td className="px-4 py-3">{v.model}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {v.year_from}–{v.year_to}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{v.engine ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Link
                              to={`/admin/vehicles/${v.id}/edit`}
                              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="แก้ไข"
                            >
                              <Pencil className="size-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            หน้า {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
