import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface CategoryForm {
  name_th: string
  name_en: string
  slug: string
  parent_id: string
  icon: string
  sort_order: string
}

const EMPTY: CategoryForm = {
  name_th: '',
  name_en: '',
  slug: '',
  parent_id: '',
  icon: '',
  sort_order: '0',
}

export default function AdminCategoryFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<CategoryForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errors, setErrors] = useState<Partial<CategoryForm & { general: string }>>({})

  const { data: allCategories = [] } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name_th, parent_id')
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  // load existing
  useEffect(() => {
    if (!isEdit || !id) return
    supabase
      .from('product_categories')
      .select('*')
      .eq('id', Number(id))
      .single()
      .then(({ data }) => {
        if (!data) return
        setForm({
          name_th: data.name_th ?? '',
          name_en: data.name_en ?? '',
          slug: data.slug ?? '',
          parent_id: data.parent_id ? String(data.parent_id) : '',
          icon: data.icon ?? '',
          sort_order: String(data.sort_order ?? 0),
        })
      })
  }, [id, isEdit])

  function set(field: keyof CategoryForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }
  }

  // auto-generate slug จาก name_en หรือ name_th
  function handleNameThChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setForm((f) => ({
      ...f,
      name_th: val,
      slug:
        f.slug ||
        val
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, ''),
    }))
    setErrors((er) => ({ ...er, name_th: undefined }))
  }

  function validate() {
    const errs: typeof errors = {}
    if (!form.name_th.trim()) errs.name_th = 'กรุณาใส่ชื่อหมวด'
    if (!form.slug.trim()) errs.slug = 'กรุณาใส่ slug'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setErrors({})

    const payload = {
      name_th: form.name_th.trim(),
      name_en: form.name_en.trim() || null,
      slug: form.slug.trim(),
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      icon: form.icon.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
    }

    const { error } = isEdit
      ? await supabase.from('product_categories').update(payload).eq('id', Number(id))
      : await supabase.from('product_categories').insert(payload)

    if (error) {
      setErrors({ general: `บันทึกไม่สำเร็จ: ${error.message}` })
      setSaving(false)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] })
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    setSaving(false)
    navigate('/admin/categories')
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('ลบหมวดนี้ออกจากระบบ?\nสินค้าในหมวดนี้จะไม่ถูกลบ แต่จะไม่มีหมวดหมู่')) return
    setDeleting(true)
    const { error } = await supabase.from('product_categories').delete().eq('id', Number(id))
    if (error) {
      alert(`ลบไม่สำเร็จ: ${error.message}`)
      setDeleting(false)
      return
    }
    queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] })
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    navigate('/admin/categories')
  }

  const rootCategories = allCategories.filter((c) => !c.parent_id && String(c.id) !== id)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/categories')}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'แก้ไขหมวด' : 'เพิ่มหมวดใหม่'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">ข้อมูลหมวด</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              ชื่อหมวด (ไทย) <span className="text-destructive">*</span>
            </label>
            <Input value={form.name_th} onChange={handleNameThChange} placeholder="ระบบเบรก" />
            {errors.name_th && <p className="mt-1 text-xs text-destructive">{errors.name_th}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">ชื่อหมวด (อังกฤษ)</label>
            <Input value={form.name_en} onChange={set('name_en')} placeholder="Brake System" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Slug <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.slug}
              onChange={set('slug')}
              placeholder="brake-system"
              className="font-mono"
            />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">ประเภท</label>
              <select
                value={form.parent_id}
                onChange={set('parent_id')}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">— ไม่มีประเภท (เป็นประเภทหลัก) —</option>
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Icon (emoji)</label>
              <Input value={form.icon} onChange={set('icon')} placeholder="🔧" />
            </div>
          </div>

          <div className="w-32">
            <label className="mb-1.5 block text-sm font-medium">ลำดับแสดง</label>
            <Input
              value={form.sort_order}
              onChange={set('sort_order')}
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
            />
          </div>
        </section>

        {errors.general && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.general}
          </p>
        )}

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/categories')}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มหมวด'}
          </Button>
        </div>

        {isEdit && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 pb-8">
            <p className="text-sm font-medium text-destructive">ลบหมวด</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              สินค้าในหมวดนี้จะไม่ถูกลบ แต่จะไม่มีหมวดหมู่
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-4"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="mr-1.5 size-4" />
              {deleting ? 'กำลังลบ...' : 'ลบหมวดนี้'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
