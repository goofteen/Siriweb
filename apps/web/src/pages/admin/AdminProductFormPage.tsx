/**
 * AdminProductFormPage — เพิ่ม / แก้ไขสินค้า
 * Route: /admin/products/new  หรือ  /admin/products/:id/edit
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X, Plus, Trash2, ChevronDown, AlertTriangle } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ─── types ──────────────────────────────────────────────────────────────────

interface Category {
  id: number
  name_th: string
  parent_id: number | null
}

interface Branch {
  id: number
  name: string
  code: string
  sort_order: number
}

interface ProductForm {
  name_th: string
  name_en: string
  sku: string
  oem_part_number: string
  brand: string
  price: string
  description_th: string
  category_id: string
  is_active: boolean
}

const EMPTY_FORM: ProductForm = {
  name_th: '',
  name_en: '',
  sku: '',
  oem_part_number: '',
  brand: '',
  price: '',
  description_th: '',
  category_id: '',
  is_active: true,
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [quantity, setQuantity] = useState('0')
  const [branchInventory, setBranchInventory] = useState<Record<number, string>>({})
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errors, setErrors] = useState<Partial<ProductForm & { general: string }>>({})
  const [isDirty, setIsDirty] = useState(false)

  // category combobox state
  const [catOpen, setCatOpen] = useState(false)
  const [catQuery, setCatQuery] = useState('')
  const catWrapRef = useRef<HTMLDivElement>(null)

  // ─── unsaved-changes guard ─────────────────────────────────────────────────
  // warn on browser refresh / tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function safeNavigate(to: string) {
    if (isDirty && !window.confirm('มีการแก้ไขที่ยังไม่ได้บันทึก\nออกจากหน้านี้หรือไม่?')) return
    navigate(to)
  }

  // ─── close combobox on outside click ──────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (catWrapRef.current && !catWrapRef.current.contains(e.target as Node)) {
        setCatOpen(false)
        setCatQuery('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ─── data: categories ─────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
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

  // ─── data: branches ───────────────────────────────────────────────────────
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code, sort_order')
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })

  // ─── load existing product when editing ───────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return
    supabase
      .from('products')
      .select(`*, product_images(url, sort_order, is_primary), product_inventory(quantity)`)
      .eq('id', Number(id))
      .single()
      .then(({ data, error }) => {
        if (error || !data) return
        setForm({
          name_th: data.name_th ?? '',
          name_en: data.name_en ?? '',
          sku: data.sku ?? '',
          oem_part_number: data.oem_part_number ?? '',
          brand: data.brand ?? '',
          price: String(data.price ?? ''),
          description_th: data.description_th ?? '',
          category_id: data.category_id ? String(data.category_id) : '',
          is_active: data.is_active ?? true,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inv = data.product_inventory as any
        setQuantity(String(inv?.quantity ?? 0))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgs = (data.product_images as any[]) ?? []
        const sorted = imgs.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        setImageUrls(sorted.length > 0 ? sorted.map((i) => i.url) : [''])
      })

    // load branch inventory
    supabase
      .from('product_inventory_branches')
      .select('branch_id, quantity')
      .eq('product_id', Number(id))
      .then(({ data }) => {
        if (!data) return
        const map: Record<number, string> = {}
        data.forEach((row) => {
          map[row.branch_id] = String(row.quantity)
        })
        setBranchInventory(map)
      })
  }, [id, isEdit])

  // ─── helpers ──────────────────────────────────────────────────────────────
  function set(field: keyof ProductForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
      setIsDirty(true)
    }
  }

  const selectedCategory = categories.find((c) => String(c.id) === form.category_id)
  const catDisplayName = selectedCategory?.name_th ?? ''
  const filteredCats = categories.filter(
    (c) => !catQuery || c.name_th.toLowerCase().includes(catQuery.toLowerCase())
  )

  // branch stock warning
  const filledBranches = Object.entries(branchInventory).filter(([, v]) => v.trim() !== '')
  const branchSum = filledBranches.reduce((s, [, v]) => s + (parseInt(v) || 0), 0)
  const totalQty = parseInt(quantity) || 0
  const showBranchWarning = filledBranches.length > 0 && branchSum !== totalQty

  // ─── image upload to Supabase Storage ─────────────────────────────────────
  async function handleImageUpload(idx: number, file: File) {
    setUploadingIdx(idx)
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      alert(`อัปโหลดไม่สำเร็จ: ${uploadError.message}`)
      setUploadingIdx(null)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)
    const urls = [...imageUrls]
    urls[idx] = publicUrlData.publicUrl
    setImageUrls(urls)
    setIsDirty(true)
    setUploadingIdx(null)
  }

  // ─── validate ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.name_th.trim()) errs.name_th = 'กรุณาใส่ชื่อสินค้า'
    if (!form.sku.trim()) errs.sku = 'กรุณาใส่ SKU'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = 'กรุณาใส่ราคาที่ถูกต้อง'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ─── save ─────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setErrors({})

    const payload = {
      name_th: form.name_th.trim(),
      name_en: form.name_en.trim() || null,
      sku: form.sku.trim(),
      oem_part_number: form.oem_part_number.trim() || null,
      brand: form.brand.trim() || null,
      price: Number(form.price),
      description_th: form.description_th.trim() || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      is_active: form.is_active,
    }

    let productId = id ? Number(id) : null

    if (isEdit && productId) {
      const { error } = await supabase.from('products').update(payload).eq('id', productId)
      if (error) {
        setErrors({ general: `บันทึกไม่สำเร็จ: ${error.message}` })
        setSaving(false)
        return
      }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      if (error || !data) {
        setErrors({ general: `บันทึกไม่สำเร็จ: ${error?.message}` })
        setSaving(false)
        return
      }
      productId = data.id
    }

    // save images
    const validUrls = imageUrls.filter((u) => u.trim())
    if (validUrls.length > 0 && productId) {
      await supabase.from('product_images').delete().eq('product_id', productId)
      await supabase.from('product_images').insert(
        validUrls.map((url, i) => ({
          product_id: productId,
          url,
          sort_order: i,
          is_primary: i === 0,
        }))
      )
    }

    // save total inventory
    if (productId) {
      await supabase.from('product_inventory').upsert({
        product_id: productId,
        quantity: Math.max(0, parseInt(quantity) || 0),
        last_updated: new Date().toISOString(),
      })
    }

    // save branch inventory
    if (productId) {
      await supabase.from('product_inventory_branches').delete().eq('product_id', productId)
      const branchRows = Object.entries(branchInventory)
        .filter(([, v]) => v.trim() !== '' && !isNaN(Number(v)))
        .map(([branchId, v]) => ({
          product_id: productId as number,
          branch_id: Number(branchId),
          quantity: Math.max(0, parseInt(v) || 0),
          last_updated: new Date().toISOString(),
        }))
      if (branchRows.length > 0) {
        await supabase.from('product_inventory_branches').insert(branchRows)
      }
    }

    queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    setSaving(false)
    setIsDirty(false)
    navigate('/admin/products')
  }

  // ─── delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!id) return
    if (!confirm(`ลบสินค้านี้ออกจากระบบ?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return
    setDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', Number(id))
    if (error) {
      alert(`ลบไม่สำเร็จ: ${error.message}`)
      setDeleting(false)
      return
    }
    queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    navigate('/admin/products')
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl">
      {/* back + title */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => safeNavigate('/admin/products')}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          aria-label="กลับ"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── ข้อมูลหลัก ─── */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">ข้อมูลสินค้า</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              ชื่อสินค้า (ไทย) <span className="text-destructive">*</span>
            </label>
            <Input value={form.name_th} onChange={set('name_th')} placeholder="ผ้าเบรกหน้า" />
            {errors.name_th && <p className="mt-1 text-xs text-destructive">{errors.name_th}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">ชื่อสินค้า (อังกฤษ)</label>
            <Input value={form.name_en} onChange={set('name_en')} placeholder="Front Brake Pad" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                SKU <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.sku}
                onChange={set('sku')}
                placeholder="BP-TOY-001"
                className="font-mono"
              />
              {errors.sku && <p className="mt-1 text-xs text-destructive">{errors.sku}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">OEM Part Number</label>
              <Input
                value={form.oem_part_number}
                onChange={set('oem_part_number')}
                placeholder="04465-02200"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">ยี่ห้อ</label>
              <Input value={form.brand} onChange={set('brand')} placeholder="Brembo" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                ราคา (บาท) <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.price}
                onChange={set('price')}
                placeholder="850"
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
              />
              {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price}</p>}
            </div>
          </div>

          {/* ─── category combobox ─── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">หมวดหมู่</label>
            <div ref={catWrapRef} className="relative">
              <div
                className={cn(
                  'flex h-10 w-full items-center rounded-lg border border-input bg-background px-3 text-sm transition-colors cursor-text',
                  catOpen && 'border-ring ring-3 ring-ring/50'
                )}
                onClick={() => {
                  setCatOpen(true)
                  setCatQuery('')
                }}
              >
                {catOpen ? (
                  <input
                    autoFocus
                    value={catQuery}
                    onChange={(e) => setCatQuery(e.target.value)}
                    placeholder="พิมพ์เพื่อค้นหา..."
                    className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                  />
                ) : (
                  <span
                    className={cn('flex-1 truncate', !catDisplayName && 'text-muted-foreground')}
                  >
                    {catDisplayName || '— ไม่ระบุหมวดหมู่ —'}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'ml-2 size-4 shrink-0 text-muted-foreground transition-transform',
                    catOpen && 'rotate-180'
                  )}
                />
              </div>

              {catOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-md overflow-hidden">
                  <div className="max-h-52 overflow-y-auto py-1">
                    {/* clear option */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm((f) => ({ ...f, category_id: '' }))
                        setIsDirty(true)
                        setCatOpen(false)
                        setCatQuery('')
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted transition-colors',
                        !form.category_id && 'bg-muted/60 font-medium'
                      )}
                    >
                      — ไม่ระบุหมวดหมู่ —
                    </button>
                    {filteredCats.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">ไม่พบหมวดหมู่</p>
                    ) : (
                      filteredCats.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setForm((f) => ({ ...f, category_id: String(c.id) }))
                            setErrors((er) => ({ ...er, category_id: undefined }))
                            setIsDirty(true)
                            setCatOpen(false)
                            setCatQuery('')
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors',
                            String(c.id) === form.category_id && 'bg-muted/60 font-medium',
                            c.parent_id && 'pl-7 text-muted-foreground'
                          )}
                        >
                          {c.name_th}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">รายละเอียด</label>
            <textarea
              value={form.description_th}
              onChange={set('description_th')}
              rows={3}
              placeholder="รายละเอียดสินค้า..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </section>

        {/* ─── รูปภาพ ─── */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold">รูปภาพ</h2>
          <p className="text-xs text-muted-foreground">รูปแรกจะเป็นรูปหลัก รองรับ JPG, PNG, WebP</p>

          <div className="space-y-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {url ? (
                    <img src={url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="relative flex-1">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const urls = [...imageUrls]
                      urls[idx] = e.target.value
                      setImageUrls(urls)
                      setIsDirty(true)
                    }}
                    placeholder="https://... หรืออัปโหลดไฟล์"
                    className="pr-10"
                  />
                  <label
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                    title="อัปโหลดรูป"
                  >
                    {uploadingIdx === idx ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Upload className="size-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(idx, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrls(imageUrls.filter((_, i) => i !== idx))
                      setIsDirty(true)
                    }}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}

            {imageUrls.length < 5 && (
              <button
                type="button"
                onClick={() => {
                  setImageUrls([...imageUrls, ''])
                  setIsDirty(true)
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-4" />
                เพิ่มรูปอีก
              </button>
            )}
          </div>
        </section>

        {/* ─── สต็อก ─── */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold">สต็อก</h2>

          {/* จำนวนรวม */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">จำนวนรวม</label>
            <div className="flex items-center gap-3">
              <div className="w-36">
                <Input
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value)
                    setIsDirty(true)
                  }}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              {showBranchWarning && (
                <div className="flex items-center gap-1.5 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs text-yellow-700">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>รวมไม่ตรงกับยอดสาขา ({branchSum})</span>
                </div>
              )}
            </div>
          </div>

          {/* สต็อกแยกสาขา */}
          {branches.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                สต็อกแยกสาขา <span className="font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {branches.map((branch) => (
                  <div key={branch.id}>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {branch.name}
                    </label>
                    <Input
                      value={branchInventory[branch.id] ?? ''}
                      onChange={(e) => {
                        setBranchInventory((prev) => ({ ...prev, [branch.id]: e.target.value }))
                        setIsDirty(true)
                      }}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ─── การแสดงผล ─── */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">แสดงสินค้า</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                ถ้าปิด สินค้าจะไม่ปรากฏให้ลูกค้าเห็น
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => {
                if (
                  form.is_active &&
                  !confirm('ซ่อนสินค้านี้?\nลูกค้าจะไม่เห็นสินค้านี้บนหน้าเว็บ')
                )
                  return
                setForm((f) => ({ ...f, is_active: !f.is_active }))
                setIsDirty(true)
              }}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                form.is_active ? 'bg-green-500' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 mt-0.5',
                  form.is_active ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </section>

        {errors.general && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.general}
          </p>
        )}

        {/* ─── actions ─── */}
        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => safeNavigate('/admin/products')}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
          </Button>
        </div>

        {/* ─── delete zone (edit only) ─── */}
        {isEdit && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 pb-8">
            <p className="text-sm font-medium text-destructive">ลบสินค้า</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ลบสินค้าออกจากระบบถาวร รวมถึงรูปภาพและข้อมูลสต็อกทั้งหมด
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
              {deleting ? 'กำลังลบ...' : 'ลบสินค้านี้'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
