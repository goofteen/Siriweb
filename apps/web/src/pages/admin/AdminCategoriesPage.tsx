import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Tag, X, Search } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface AdminCategory {
  id: number
  name_th: string
  name_en: string | null
  slug: string
  parent_id: number | null
  icon: string | null
  sort_order: number
  parent: { name_th: string } | null
}

type Tab = 'types' | 'categories'

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('types')
  const [search, setSearch] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = quickName.trim()
    if (!name) return
    setQuickSaving(true)
    const slug =
      name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '') +
      '-' +
      Date.now().toString(36)
    const { error } = await supabase
      .from('product_categories')
      .insert({ name_th: name, slug, parent_id: null, sort_order: 0 })
    if (error) {
      alert(`เพิ่มไม่สำเร็จ: ${error.message}`)
      setQuickSaving(false)
      return
    }
    queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] })
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    setQuickName('')
    setQuickSaving(false)
    setShowQuickAdd(false)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select(
          'id, name_th, name_en, slug, parent_id, icon, sort_order, parent:parent_id(name_th)'
        )
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as unknown as AdminCategory[]
    },
    staleTime: 30 * 1000,
  })

  const categories = data ?? []
  const types = categories.filter((c) => !c.parent_id)
  const subs = categories.filter((c) => c.parent_id)

  const isTypes = tab === 'types'
  const q = search.trim().toLowerCase()
  const shown = (isTypes ? types : subs).filter(
    (c) => !q || c.name_th.toLowerCase().includes(q) || (c.name_en ?? '').toLowerCase().includes(q)
  )

  return (
    <div>
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">หมวดสินค้า</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isTypes ? `${types.length} ประเภท` : `${subs.length} หมวด`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isTypes ? (
            <Button
              variant="outline"
              onClick={() => {
                setShowQuickAdd((v) => !v)
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
            >
              <Plus className="mr-1.5 size-4" />
              เพิ่มประเภท
            </Button>
          ) : (
            <Button asChild>
              <Link to="/admin/categories/new">
                <Plus className="mr-1.5 size-4" />
                เพิ่มหมวด
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหมวด..."
          className="h-9 w-full max-w-xs rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {(
          [
            ['types', 'ประเภท'],
            ['categories', 'หมวดสินค้า'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key as Tab)
              setShowQuickAdd(false)
              setQuickName('')
              setSearch('')
            }}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              tab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* quick-add type inline */}
      {isTypes && showQuickAdd && (
        <form
          onSubmit={handleQuickAdd}
          className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
        >
          <Input
            ref={inputRef}
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="ชื่อประเภท เช่น ระบบเบรก"
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={quickSaving || !quickName.trim()}>
            {quickSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowQuickAdd(false)
              setQuickName('')
            }}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </form>
      )}

      {/* table */}
      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="mb-3 size-10 text-muted-foreground/30" />
            <p className="font-medium">{isTypes ? 'ยังไม่มีประเภท' : 'ยังไม่มีหมวดสินค้า'}</p>
          </div>
        ) : isTypes ? (
          /* ── tab: ประเภท ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    ชื่อประเภท
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">ลำดับ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {types.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.icon && <span className="text-base">{t.icon}</span>}
                        <span className="font-medium">{t.name_th}</span>
                        {t.name_en && (
                          <span className="text-xs text-muted-foreground">{t.name_en}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.slug}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{t.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          to={`/admin/categories/${t.id}/edit`}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="แก้ไข"
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── tab: หมวดสินค้า ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    ชื่อหมวด
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ประเภท</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">ลำดับ</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.icon && <span className="text-base">{s.icon}</span>}
                        <span className="font-medium">{s.name_th}</span>
                        {s.name_en && (
                          <span className="text-xs text-muted-foreground">{s.name_en}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.parent?.name_th ?? (
                        <span className="text-destructive/70 text-xs">ไม่มีประเภท</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          to={`/admin/categories/${s.id}/edit`}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="แก้ไข"
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
