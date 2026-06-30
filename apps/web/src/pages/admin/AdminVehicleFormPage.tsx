import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface VehicleForm {
  brand: string
  model: string
  year_from: string
  year_to: string
  engine: string
}

const EMPTY: VehicleForm = {
  brand: '',
  model: '',
  year_from: '',
  year_to: '',
  engine: '',
}

const BRANDS = [
  'Toyota',
  'Honda',
  'Nissan',
  'Mazda',
  'Mitsubishi',
  'Isuzu',
  'Suzuki',
  'Subaru',
  'Ford',
  'Chevrolet',
]

export default function AdminVehicleFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<VehicleForm>(() => ({
    ...EMPTY,
    brand: (location.state as { brand?: string } | null)?.brand ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errors, setErrors] = useState<Partial<VehicleForm & { general: string }>>({})

  useEffect(() => {
    if (!isEdit || !id) return
    supabase
      .from('vehicles')
      .select('*')
      .eq('id', Number(id))
      .single()
      .then(({ data }) => {
        if (!data) return
        setForm({
          brand: data.brand ?? '',
          model: data.model ?? '',
          year_from: String(data.year_from ?? ''),
          year_to: String(data.year_to ?? ''),
          engine: data.engine ?? '',
        })
      })
  }, [id, isEdit])

  function set(field: keyof VehicleForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }
  }

  function validate() {
    const errs: typeof errors = {}
    if (!form.brand.trim()) errs.brand = 'กรุณาใส่ยี่ห้อ'
    if (!form.model.trim()) errs.model = 'กรุณาใส่รุ่น'
    if (!form.year_from || isNaN(Number(form.year_from))) errs.year_from = 'กรุณาใส่ปีเริ่มต้น'
    if (!form.year_to || isNaN(Number(form.year_to))) errs.year_to = 'กรุณาใส่ปีสิ้นสุด'
    if (Number(form.year_to) < Number(form.year_from))
      errs.year_to = 'ปีสิ้นสุดต้องมากกว่าปีเริ่มต้น'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setErrors({})

    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      year_from: Number(form.year_from),
      year_to: Number(form.year_to),
      engine: form.engine.trim() || null,
    }

    const { error } = isEdit
      ? await supabase.from('vehicles').update(payload).eq('id', Number(id))
      : await supabase.from('vehicles').insert(payload)

    if (error) {
      setErrors({ general: `บันทึกไม่สำเร็จ: ${error.message}` })
      setSaving(false)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    setSaving(false)
    navigate('/admin/vehicles')
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('ลบรุ่นรถนี้?\nสินค้าที่ผูกกับรุ่นรถนี้จะถูก unlink')) return
    setDeleting(true)
    const { error } = await supabase.from('vehicles').delete().eq('id', Number(id))
    if (error) {
      alert(`ลบไม่สำเร็จ: ${error.message}`)
      setDeleting(false)
      return
    }
    queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    navigate('/admin/vehicles')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/vehicles')}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'แก้ไขรุ่นรถ' : 'เพิ่มรุ่นรถใหม่'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">ข้อมูลรถ</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                ยี่ห้อ <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.brand}
                onChange={set('brand')}
                placeholder="Toyota"
                list="brand-list"
              />
              <datalist id="brand-list">
                {BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {errors.brand && <p className="mt-1 text-xs text-destructive">{errors.brand}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                รุ่น <span className="text-destructive">*</span>
              </label>
              <Input value={form.model} onChange={set('model')} placeholder="Civic" />
              {errors.model && <p className="mt-1 text-xs text-destructive">{errors.model}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                ปีเริ่มต้น <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.year_from}
                onChange={set('year_from')}
                type="number"
                min="1990"
                max="2030"
                inputMode="numeric"
                placeholder="2018"
              />
              {errors.year_from && (
                <p className="mt-1 text-xs text-destructive">{errors.year_from}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                ปีสิ้นสุด <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.year_to}
                onChange={set('year_to')}
                type="number"
                min="1990"
                max="2030"
                inputMode="numeric"
                placeholder="2022"
              />
              {errors.year_to && <p className="mt-1 text-xs text-destructive">{errors.year_to}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">เครื่องยนต์</label>
            <Input value={form.engine} onChange={set('engine')} placeholder="1.5L VTEC" />
          </div>
        </section>

        {errors.general && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.general}
          </p>
        )}

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicles')}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มรุ่นรถ'}
          </Button>
        </div>

        {isEdit && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 pb-8">
            <p className="text-sm font-medium text-destructive">ลบรุ่นรถ</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              สินค้าที่ผูกกับรุ่นรถนี้จะถูก unlink แต่ไม่ถูกลบ
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
              {deleting ? 'กำลังลบ...' : 'ลบรุ่นรถนี้'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
