import { useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type InquiryStatus = 'new' | 'contacted' | 'closed'

interface Inquiry {
  id: number
  customer_name: string
  contact_phone: string | null
  contact_line: string | null
  contact_email: string | null
  message: string
  status: InquiryStatus
  source: string | null
  created_at: string
  vehicles: { brand: string; model: string; year_from: number } | null
  product_ids: number[] | null
}

const STATUS_LABELS: Record<InquiryStatus, { label: string; className: string }> = {
  new: { label: 'ใหม่', className: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'ติดต่อแล้ว', className: 'bg-yellow-100 text-yellow-700' },
  closed: { label: 'ปิดแล้ว', className: 'bg-muted text-muted-foreground' },
}

const PAGE_SIZE = 20

export default function AdminInquiriesPage() {
  const [filter, setFilter] = useState<InquiryStatus | 'all'>('new')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inquiries', filter, search, page],
    queryFn: async () => {
      let query = supabase
        .from('inquiries')
        .select(
          `id, customer_name, contact_phone, contact_line, contact_email,
           message, status, source, created_at, product_ids,
           vehicles(brand, model, year_from)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (filter !== 'all') query = query.eq('status', filter)

      if (search.trim()) {
        query = query.or(
          `customer_name.ilike.%${search.trim()}%,contact_phone.ilike.%${search.trim()}%,contact_line.ilike.%${search.trim()}%,contact_email.ilike.%${search.trim()}%`
        )
      }

      const { data, error, count } = await query
      if (error) throw error
      return { inquiries: (data ?? []) as unknown as Inquiry[], total: count ?? 0 }
    },
    staleTime: 30 * 1000,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: InquiryStatus }) => {
      const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] }),
  })

  const inquiries = data?.inquiries ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">คำขอจากลูกค้า</h1>
          {!isLoading && <p className="mt-0.5 text-sm text-muted-foreground">{total} รายการ</p>}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="ค้นหาชื่อ, โทร, Line..."
            className="h-9 w-56 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {/* filter tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border bg-muted/40 p-1 w-fit">
        {(['all', 'new', 'contacted', 'closed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setFilter(s)
              setPage(0)
            }}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              filter === s
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s === 'all' ? 'ทั้งหมด' : STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {/* list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="mb-3 size-10 text-muted-foreground/30" />
          <p className="font-medium">ไม่มีคำขอ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="rounded-xl border border-border bg-card p-4">
              {/* top row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{inq.customer_name}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_LABELS[inq.status as InquiryStatus]?.className ?? ''
                      )}
                    >
                      {STATUS_LABELS[inq.status as InquiryStatus]?.label ?? inq.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(inq.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* status changer */}
                <select
                  value={inq.status}
                  onChange={(e) =>
                    updateStatus.mutate({ id: inq.id, status: e.target.value as InquiryStatus })
                  }
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring"
                >
                  <option value="new">ใหม่</option>
                  <option value="contacted">ติดต่อแล้ว</option>
                  <option value="closed">ปิดแล้ว</option>
                </select>
              </div>

              {/* message */}
              <p className="mt-3 text-sm">{inq.message}</p>

              {/* contact + vehicle */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {inq.contact_phone && <span>📞 {inq.contact_phone}</span>}
                {inq.contact_line && <span>💬 Line: {inq.contact_line}</span>}
                {inq.contact_email && <span>✉️ {inq.contact_email}</span>}
                {inq.vehicles && (
                  <span>
                    🚗 {inq.vehicles.brand} {inq.vehicles.model} {inq.vehicles.year_from}
                  </span>
                )}
                {inq.product_ids && inq.product_ids.length > 0 && (
                  <span>🔧 สินค้า {inq.product_ids.length} รายการ</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            หน้า {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted"
            >
              ก่อนหน้า
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
