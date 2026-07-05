/**
 * ContactStoreButton — ปุ่ม "ติดต่อสั่งซื้อ" บนหน้าสินค้า
 * เปิด bottom sheet ให้เลือก 3 ช่องทาง: Line OA / โทร / ฟอร์ม
 */
import { Phone, MessageCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { STORE } from '@/config/store'
import { buildLineInquiryUrl } from '@/lib/line'
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
      sublabel: 'ส่งรายละเอียดสินค้าเข้า LINE เลย',
      color: 'bg-[#06C755] hover:bg-[#05b34d]',
      textColor: 'text-white',
      action: () => {
        logLineInquiry()
        if (productId && productName && productSku && productPrice != null) {
          const url = buildLineInquiryUrl({
            id: productId,
            name_th: productName,
            sku: productSku,
            price: productPrice,
          })
          window.location.href = url
        } else {
          // fallback ถ้าไม่มีข้อมูลสินค้าครบ
          window.location.href = STORE.lineOaUrl
        }
        onClose()
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
