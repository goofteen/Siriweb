/**
 * ContactStoreSheet — ปุ่ม "ติดต่อสั่งซื้อ" บนหน้าสินค้า
 * เปิด bottom sheet ให้เลือกช่องทาง: Line OA / Messenger / โทร
 */
import { useState } from 'react'
import { Phone, MessageCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { STORE } from '@/config/store'
import {
  buildLineInquiryUrl,
  buildProductMessage,
  buildLineChatUrl,
  isMobile,
  copyToClipboard,
  type ProductForContact,
} from '@/lib/contact'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/contexts/SessionContext'
import { MessengerInquiryModal } from './MessengerInquiryModal'

// Facebook icon (ไม่มีใน lucide)
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

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
  const [messengerOpen, setMessengerOpen] = useState(false)
  const [messengerAutoCopied, setMessengerAutoCopied] = useState(false)

  const product: ProductForContact | null =
    productId && productName && productSku && productPrice != null
      ? { id: productId, name_th: productName, sku: productSku, price: productPrice }
      : null

  // log ลง inquiries แบบ fire-and-forget
  function logInquiry(source: string) {
    if (!productId) return
    try {
      supabase.from('inquiries').insert({
        session_id: sessionId,
        customer_name: `${source} inquiry`,
        message: `สนใจสินค้า: ${productName ?? ''}`,
        product_ids: [productId],
        source,
        contact_line: source === 'line_oa' ? 'via LINE OA' : undefined,
      })
    } catch {
      // ไม่ block
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
        logInquiry('line_oa')
        if (isMobile()) {
          window.location.href = product ? buildLineInquiryUrl(product) : STORE.lineOaUrl
          onClose()
        } else {
          if (product) {
            const message = buildProductMessage(product)
            await copyToClipboard(message)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
          window.open(buildLineChatUrl(), '_blank', 'noopener,noreferrer')
          setTimeout(() => onClose(), 1500)
        }
      },
    },
    {
      icon: FacebookIcon,
      label: 'Messenger',
      sublabel: 'ส่งรายละเอียดสินค้าทาง Messenger',
      color: 'bg-[#0084FF] hover:bg-[#006fd6]',
      textColor: 'text-white',
      action: async () => {
        logInquiry('messenger')
        // copy ทันทีก่อน — สำคัญสำหรับ iOS Safari
        let autoCopied = false
        if (product) {
          const message = buildProductMessage(product)
          autoCopied = await copyToClipboard(message)
        }
        setMessengerAutoCopied(autoCopied)
        setMessengerOpen(true)
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
    <>
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

      {/* Messenger modal */}
      <MessengerInquiryModal
        open={messengerOpen}
        onClose={() => {
          setMessengerOpen(false)
          onClose()
        }}
        product={product}
        autoCopied={messengerAutoCopied}
      />
    </>
  )
}
