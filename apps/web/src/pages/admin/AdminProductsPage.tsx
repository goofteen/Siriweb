import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Package, Search, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface AdminProduct {
  id: number
  sku: string
  name_th: string
  brand: string | null
  price: number
  is_active: boolean
  product_categories: { name_th: string } | null
  product_images: { url: string; is_primary: boolean }[]
  product_inventory: { quantity: number } | null
}

interface Category {
  id: number
  name_th: string
}

type StatusFilter = 'all' | 'active' | 'inactive'

const PAGE_SIZE = 20

export default function AdminProductsPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const queryClient = useQueryClient()

  function resetPage() {
    setPage(0)
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    resetPage()
  }

  function handleStatusFilter(s: StatusFilter) {
    setStatusFilter(s)
    resetPage()
  }

  function handleCategoryFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategoryFilter(e.target.value)
    resetPage()
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('')
    resetPage()
  }

  const hasFilter = search.trim() !== '' || statusFilter !== 'all' || categoryFilter !== ''

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name_th')
        .order('name_th')
      if (error) throw error
      return (data ?? []) as Category[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, statusFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(
          `id, sku, name_th, brand, price, is_active,
           product_categories(name_th),
           product_images(url, is_primary),
           product_inventory(quantity)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (search.trim()) {
        query = query.or(
          `name_th.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%,brand.ilike.%${search.trim()}%`
        )
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }
      if (categoryFilter) {
        query = query.eq('category_id', Number(categoryFilter))
      }

      const { data, error, count } = await query
      if (error) throw error
      return { products: (data ?? []) as unknown as AdminProduct[], total: count ?? 0 }
    },
    staleTime: 30 * 1000,
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, is_active }) => {
      await queryClient.cancelQueries({
        queryKey: ['admin-products', page, search, statusFilter, categoryFilter],
      })
      const previous = queryClient.getQueryData<{ products: AdminProduct[]; total: number }>([
        'admin-products',
        page,
        search,
        statusFilter,
        categoryFilter,
      ])
      queryClient.setQueryData<{ products: AdminProduct[]; total: number }>(
        ['admin-products', page, search, statusFilter, categoryFilter],
        (old) =>
          old
            ? { ...old, products: old.products.map((p) => (p.id === id ? { ...p, is_active } : p)) }
            : old
      )
      return { previous }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(
          ['admin-products', page, search, statusFilter, categoryFilter],
          ctx.previous
        )
      alert(`อัปเดตสถานะไม่สำเร็จ:\n${err.message}`)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const categories = categoriesData ?? []

  return (
    <div>
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">จัดการสินค้า</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-muted-foreground">ทั้งหมด {total} รายการ</p>
          )}
        </div>
        <Link to="/admin/products/new" className={buttonVariants({ variant: 'default' })}>
          <Plus className="size-4" />
          เพิ่มสินค้า
        </Link>
      </div>

      {/* search + filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* text search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="ค้นหาชื่อ, SKU, ยี่ห้อ..."
            className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        {/* category filter */}
        <select
          value={categoryFilter}
          onChange={handleCategoryFilter}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_th}
            </option>
          ))}
        </select>

        {/* status filter */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
          {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'all' ? 'ทั้งหมด' : s === 'active' ? 'แสดง' : 'ซ่อน'}
            </button>
          ))}
        </div>

        {/* clear */}
        {hasFilter && (
          <button
            onClick={clearFilters}
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
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 size-10 text-muted-foreground/30" />
            <p className="font-medium">{hasFilter ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}</p>
            {hasFilter ? (
              <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">
                ล้างตัวกรอง
              </button>
            ) : (
              <Link
                to="/admin/products/new"
                className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' mt-4'}
              >
                เพิ่มสินค้าแรก
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col />
                {/* สินค้า — grows */}
                <col className="w-[120px]" />
                <col className="w-[140px]" />
                <col className="w-[96px]" />
                <col className="w-[72px]" />
                <col className="w-[80px]" />
                <col className="w-[52px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">สินค้า</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    หมวดหมู่
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">ราคา</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">สต็อก</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">สถานะ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => {
                  const thumb =
                    p.product_images?.find((i) => i.is_primary)?.url ?? p.product_images?.[0]?.url
                  const stock = p.product_inventory?.quantity ?? 0

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {thumb ? (
                              <img src={thumb} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center">
                                <Package className="size-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium leading-snug line-clamp-2">{p.name_th}</p>
                            {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.product_categories?.name_th ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ฿{p.price.toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            stock > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'
                          }
                        >
                          {stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={p.is_active}
                            onClick={() => {
                              if (
                                p.is_active &&
                                !confirm(`ซ่อน "${p.name_th}"?\nลูกค้าจะไม่เห็นสินค้านี้บนหน้าเว็บ`)
                              )
                                return
                              toggleActive.mutate({ id: p.id, is_active: !p.is_active })
                            }}
                            className={[
                              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                              p.is_active ? 'bg-green-500' : 'bg-input',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                                p.is_active ? 'translate-x-4' : 'translate-x-0',
                              ].join(' ')}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="แก้ไข"
                          >
                            <Pencil className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
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
