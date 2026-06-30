/**
 * InquiryPage — /inquiry?product=123
 * ฟอร์มติดต่อร้าน: ชื่อ + ช่องทางติดต่อ (เบอร์/Line/อีเมล) + ข้อความ
 * บันทึกลง Supabase inquiries table
 */
import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProductDetail } from '@/hooks/useProducts'
import { useGarage } from '@/contexts/GarageContext'
import { useSession } from '@/contexts/SessionContext'
import { supabase } from '@/lib/supabase'

type FormState = {
  customerName: string
  contactPhone: string
  contactLine: string
  contactEmail: string
  message: string
}

const EMPTY_FORM: FormState = {
  customerName: '',
  contactPhone: '',
  contactLine: '',
  contactEmail: '',
  message: '',
}

export default function InquiryPage() {
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('product') ? Number(searchParams.get('product')) : undefined

  const { sessionId } = useSession()
  const { primaryVehicle } = useGarage()
  const { data: product } = useProductDetail(productId)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<FormState & { contact: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined, contact: undefined }))
    }
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.customerName.trim()) errs.customerName = 'กรุณาใส่ชื่อ'
    if (!form.message.trim()) errs.message = 'กรุณาใส่ข้อความ'
    const hasContact = form.contactPhone || form.contactLine || form.contactEmail
    if (!hasContact) errs.contact = 'กรุณาใส่ช่องทางติดต่ออย่างน้อย 1 ช่องทาง'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError(null)

    const { error } = await supabase.from('inquiries').insert({
      session_id: sessionId,
      customer_name: form.customerName.trim(),
      contact_phone: form.contactPhone.trim() || null,
      contact_line: form.contactLine.trim() || null,
      contact_email: form.contactEmail.trim() || null,
      vehicle_id: primaryVehicle?.id ?? null,
      message: form.message.trim(),
      product_ids: productId ? [productId] : null,
      source: productId ? 'product_page' : 'contact_form',
    })

    setSubmitting(false)

    if (error) {
      setServerError('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง หรือติดต่อผ่าน Line')
      return
    }

    setSubmitted(true)
  }

  // Success state
  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
        <CheckCircle className="mb-4 size-16 text-green-500" />
        <h1 className="text-xl font-bold">ส่งคำขอเรียบร้อยแล้ว</h1>
        <p className="mt-2 text-muted-foreground">ทางร้านจะติดต่อกลับหาคุณโดยเร็ว ขอบคุณที่สนใจ</p>
        {product && (
          <div className="mt-4 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm">
            <p className="text-muted-foreground">สินค้าที่สอบถาม</p>
            <p className="mt-0.5 font-medium">{product.name_th}</p>
          </div>
        )}
        <Link
          to="/"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* breadcrumb */}
      <div className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          หน้าหลัก
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">ติดต่อสั่งซื้อ</span>
      </div>

      <h1 className="mb-1 text-xl font-bold">ส่งคำขอสั่งซื้อ</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        กรอกข้อมูลด้านล่าง ทางร้านจะติดต่อกลับภายใน 24 ชั่วโมง
      </p>

      {/* สินค้าที่สอบถาม */}
      {product && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
          {product.product_images?.[0]?.url && (
            <img
              src={product.product_images[0].url}
              alt={product.name_th}
              className="size-14 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">สินค้าที่สนใจ</p>
            <p className="truncate font-medium">{product.name_th}</p>
            <p className="text-sm font-bold text-primary">
              ฿{product.price.toLocaleString('th-TH')}
            </p>
          </div>
        </div>
      )}

      {/* รถที่มีใน garage */}
      {primaryVehicle && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          <span className="size-2 shrink-0 rounded-full bg-accent" />
          <span className="text-accent">
            รถของคุณ: {primaryVehicle.brand} {primaryVehicle.model} {primaryVehicle.year}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* ชื่อ */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            ชื่อ <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.customerName}
            onChange={set('customerName')}
            placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
            autoComplete="name"
          />
          {errors.customerName && (
            <p className="mt-1 text-xs text-destructive">{errors.customerName}</p>
          )}
        </div>

        {/* ช่องทางติดต่อ */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            ช่องทางติดต่อ <span className="text-destructive">*</span>
          </label>
          <p className="mb-2 text-xs text-muted-foreground">ใส่อย่างน้อย 1 ช่องทาง</p>
          <div className="space-y-2">
            <Input
              value={form.contactPhone}
              onChange={set('contactPhone')}
              placeholder="เบอร์โทรศัพท์"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
            />
            <Input value={form.contactLine} onChange={set('contactLine')} placeholder="Line ID" />
            <Input
              value={form.contactEmail}
              onChange={set('contactEmail')}
              placeholder="อีเมล"
              type="email"
              autoComplete="email"
              inputMode="email"
            />
          </div>
          {errors.contact && <p className="mt-1 text-xs text-destructive">{errors.contact}</p>}
        </div>

        {/* ข้อความ */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            ข้อความ <span className="text-destructive">*</span>
          </label>
          <textarea
            value={form.message}
            onChange={set('message')}
            placeholder="สอบถามสินค้า ราคา หรือรายละเอียดเพิ่มเติม..."
            rows={4}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
        </div>

        {/* นโยบายคืนสินค้า — trust signal */}
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          ✅ คืนสินค้าฟรีภายใน 7 วัน หากสั่งผิดรุ่น
        </div>

        {serverError && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'กำลังส่ง...' : 'ส่งคำขอ'}
        </Button>
      </form>
    </div>
  )
}
