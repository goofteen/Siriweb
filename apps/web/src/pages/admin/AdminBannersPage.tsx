import { useState, useRef } from 'react'
import { Plus, Trash2, GripVertical, Image, ExternalLink, X, Upload } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Banner {
  id: number
  title: string | null
  image_url: string
  link_url: string | null
  sort_order: number
  is_active: boolean
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLink, setNewLink] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('banners')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as Banner[]
    },
  })

  async function handleUpload(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) {
      alert(`อัปโหลดไม่สำเร็จ: ${error.message}`)
      setUploading(false)
      return
    }
    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)
    setNewImageUrl(publicUrlData.publicUrl)
    setUploading(false)
  }

  async function handleAdd() {
    if (!newImageUrl.trim()) return
    setSaving(true)
    const maxSort = banners.length > 0 ? Math.max(...banners.map((b) => b.sort_order)) + 1 : 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('banners').insert({
      title: newTitle.trim() || null,
      image_url: newImageUrl.trim(),
      link_url: newLink.trim() || null,
      sort_order: maxSort,
      is_active: true,
    })
    if (error) {
      alert(`เพิ่มไม่สำเร็จ: ${error.message}`)
    } else {
      setNewTitle('')
      setNewLink('')
      setNewImageUrl('')
      setShowAdd(false)
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('ลบ banner นี้?')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('banners').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
  }

  async function handleToggle(id: number, current: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('banners').update({ is_active: !current }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
  }

  async function handleMoveUp(idx: number) {
    if (idx === 0) return
    const items = [...banners]
    const prev = items[idx - 1]
    const curr = items[idx]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    await Promise.all([
      sb.from('banners').update({ sort_order: curr.sort_order }).eq('id', prev.id),
      sb.from('banners').update({ sort_order: prev.sort_order }).eq('id', curr.id),
    ])
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
  }

  async function handleMoveDown(idx: number) {
    if (idx >= banners.length - 1) return
    const items = [...banners]
    const next = items[idx + 1]
    const curr = items[idx]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    await Promise.all([
      sb.from('banners').update({ sort_order: curr.sort_order }).eq('id', next.id),
      sb.from('banners').update({ sort_order: next.sort_order }).eq('id', curr.id),
    ])
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">แบนเนอร์</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            แบนเนอร์โปรโมชั่นหน้าแรก (แสดงระหว่างช่องค้นหากับเลือกรุ่นรถ)
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={showAdd} className="gap-1.5">
          <Plus className="size-4" />
          เพิ่ม
        </Button>
      </div>

      {/* add form */}
      {showAdd && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">เพิ่มแบนเนอร์ใหม่</h2>
            <button
              onClick={() => {
                setShowAdd(false)
                setNewTitle('')
                setNewLink('')
                setNewImageUrl('')
              }}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* image upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              รูปภาพ <span className="text-destructive">*</span>
            </label>
            {newImageUrl ? (
              <div className="relative">
                <img
                  src={newImageUrl}
                  alt="preview"
                  className="h-40 w-full rounded-lg object-cover"
                />
                <button
                  onClick={() => setNewImageUrl('')}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {uploading ? (
                  <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <>
                    <Upload className="size-8" />
                    <span className="text-sm">คลิกเพื่ออัปโหลดรูป</span>
                    <span className="text-xs">แนะนำขนาด 1200 x 400 px</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ''
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">ชื่อ / คำอธิบาย (ไม่บังคับ)</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="โปรโมชั่นเดือนนี้"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">ลิงก์เมื่อกด (ไม่บังคับ)</label>
            <Input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="/search?category=1  หรือ URL ภายนอก"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAdd(false)
                setNewTitle('')
                setNewLink('')
                setNewImageUrl('')
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleAdd} disabled={saving || !newImageUrl.trim()}>
              {saving ? 'กำลังบันทึก...' : 'เพิ่มแบนเนอร์'}
            </Button>
          </div>
        </div>
      )}

      {/* loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* empty */}
      {!isLoading && banners.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Image className="mb-3 size-12 text-muted-foreground/40" />
          <p className="font-medium">ยังไม่มีแบนเนอร์</p>
          <p className="mt-1 text-sm text-muted-foreground">กดปุ่ม "เพิ่ม" เพื่อสร้างแบนเนอร์</p>
        </div>
      )}

      {/* banner list */}
      {!isLoading && banners.length > 0 && (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={cn(
                'flex gap-3 rounded-xl border border-border bg-card p-3 transition-opacity',
                !banner.is_active && 'opacity-50'
              )}
            >
              {/* reorder */}
              <div className="flex flex-col items-center justify-center gap-1">
                <button
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="ขยับขึ้น"
                >
                  <GripVertical className="size-4 rotate-90 scale-x-[-1]" />
                </button>
                <span className="text-xs text-muted-foreground">{idx + 1}</span>
                <button
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx >= banners.length - 1}
                  className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="ขยับลง"
                >
                  <GripVertical className="size-4 rotate-90" />
                </button>
              </div>

              {/* preview image */}
              <div className="h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={banner.image_url}
                  alt={banner.title ?? 'banner'}
                  className="size-full object-cover"
                />
              </div>

              {/* info */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="text-sm font-medium truncate">{banner.title || '(ไม่มีชื่อ)'}</p>
                  {banner.link_url && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <ExternalLink className="size-3 shrink-0" />
                      {banner.link_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(banner.id, banner.is_active)}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                      banner.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {banner.is_active ? 'แสดง' : 'ซ่อน'}
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="ลบ"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
