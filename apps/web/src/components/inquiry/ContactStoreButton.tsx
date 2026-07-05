/**
 * ContactStoreButton — ปุ่ม "ติดต่อสั่งซื้อ" บนหน้าสินค้า
 * เปิด bottom sheet ให้เลือก 3 ช่องทาง: Line OA / โทร / ฟอร์ม
 */
import { useState } from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { STORE } from '@/config/store'
import { buildLineInquiryUrl, buildLineMessage, buildLineChatUrl, isMobile } from '@/lib/line'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/contexts/SessionContext'

interface ContactStoreButtonProps {
  open: boolean
  onClose: () => void
  productId?: number
  productName?: string
  productSku?: string
  productPrice?: number
}

export function ContactStoreSheet({
  open,
  onClose,
  productId,
  productName,
  productSku,
  productPrice,
}: ContactStoreButtonProps) {
  const { sessionId } = useSession()
  const [copied, setCopied] = useState(false)

  // log ลง inquiries แบบ fire-and-forget (ไม่ block การเปิด LINE)
  function logLineInquiry() {
    if (!productId) return
    try {
      supabase.from('inquiries').insert({
        session_id: sessionId,
        customer_name: 'LINE inquiry',
        message: `สนใจสินค้า: ${productName ?? ''}`,
        product_ids: [productId],
        source: 'line_oa',
        contact_line: 'via LINE OA',
      })
    } catch {
      // ไม่ block — ถ้า log ล้มเหลวก็ไม่เป็นไร
    }
  }

  const options = [
    {
      icon: MessageCircle,
      label: 'Line OA',
      sublabel: copied
        ? 'copy รายละเอียดสินค้าเรียบร้อย วางข้อความที่แชทไลน์ได้เลย'
        : isMobile()
          ? 'ส่งรายละเอียดสินค้าเข้า LINE เลย'
          : 'คัดลอกข้อความ + เปิด LINE แชท',
      color: 'bg-[#06C755] hover:bg-[#05b34d]',
      textColor: 'text-white',
      action: async () => {
        logLineInquiry()
        const hasProduct = productId && productName && productSku && productPrice != null
        const product = hasProduct
          ? { id: productId, name_th: productName, sku: productSku, price: productPrice }
          : null

        if (isMobile()) {
          // มือถือ: เปิดแอป LINE พร้อมข้อความ prefill
          window.location.href = product ? buildLineInquiryUrl(product) : STORE.lineOaUrl
          onClose()
        } else {
          // Desktop: copy ข้อความ แล้วเปิด LINE แชท
          if (product) {
            const message = buildLineMessage(product)
            await navigator.clipboard.writeText(message)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
          window.open(buildLineChatUrl(), '_blank', 'noopener,noreferrer')
          // ไม่ปิด sheet ทันทีบน desktop เพื่อให้เห็น "คัดลอกแล้ว"
          setTimeout(() => onClose(), 1500)
        }
      },
    },
    {
      icon: Phone,
      label: 'โทรหาร้าน',
      sublabel: STORE.phone,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white',
      action: () => {
        window.location.href = `tel:${STORE.phone.replace(/[-\s]/g, '')}`
        onClose()
      },
    },
  ]

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">ติดต่อสั่งซื้อ</SheetTitle>
          {productName && (
            <p className="text-left text-sm text-muted-foreground">สำหรับ: {productName}</p>
          )}
        </SheetHeader>

        <div className="space-y-3 px-4 pb-8">
          {options.map(({ icon: Icon, label, sublabel, color, textColor, action }) => (
            <button
              key={label}
              onClick={action}
              className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors ${color} ${textColor}`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p
                  className={`text-sm ${textColor === 'text-white' ? 'text-white/80' : 'text-muted-foreground'}`}
                >
                  {sublabel}
                </p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
