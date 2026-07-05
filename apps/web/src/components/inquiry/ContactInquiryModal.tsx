/**
 * ContactInquiryModal — popup แสดงรายละเอียดสินค้าก่อน redirect ไป LINE / Messenger
 * ใช้ flow เดียวกันทั้งสองช่องทาง
 */
import { useState, useEffect } from 'react'
import { X, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react'
import { Dialog } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import {
  buildProductMessage,
  buildLineInquiryUrl,
  buildLineChatUrl,
  buildMessengerUrl,
  copyToClipboard,
  isMobile,
  type ProductForContact,
} from '@/lib/contact'
import { cn } from '@/lib/utils'

export type ContactChannel = 'line' | 'messenger'

interface ContactInquiryModalProps {
  open: boolean
  onClose: () => void
  product: ProductForContact | null
  channel: ContactChannel
}

export function ContactInquiryModal({ open, onClose, product, channel }: ContactInquiryModalProps) {
  const [justCopied, setJustCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const message = product ? buildProductMessage(product) : ''

  // LINE บนมือถือใช้ oaMessage ได้เลย ไม่ต้อง copy
  const lineOnMobile = channel === 'line' && isMobile()

  // auto-copy เมื่อเปิด modal (ยกเว้น LINE มือถือ)
  useEffect(() => {
    if (!open || !message || lineOnMobile) return
    copyToClipboard(message).then((ok) => {
      if (ok) {
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2500)
      }
    })
  }, [open, message, lineOnMobile])

  // reset state เมื่อปิด
  useEffect(() => {
    if (!open) {
      setJustCopied(false)
      setShowToast(false)
    }
  }, [open])

  async function handleCopy() {
    const ok = await copyToClipboard(message)
    if (ok) {
      setJustCopied(true)
      setShowToast(true)
      setTimeout(() => setJustCopied(false), 2000)
      setTimeout(() => setShowToast(false), 2500)
    }
  }

  function handleRedirect() {
    if (channel === 'line') {
      if (lineOnMobile && product) {
        window.location.href = buildLineInquiryUrl(product)
      } else {
        window.open(buildLineChatUrl(), '_blank', 'noopener,noreferrer')
      }
    } else {
      window.open(buildMessengerUrl(), '_blank', 'noopener,noreferrer')
    }
    onClose()
  }

  const channelLabel = channel === 'line' ? 'LINE' : 'Messenger'
  const channelColor =
    channel === 'line'
      ? 'bg-[#06C755] text-white hover:bg-[#05b34d]'
      : 'bg-[#0084FF] text-white hover:bg-[#006fd6]'

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-5 shadow-xl transition duration-200 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
          {/* toast — คัดลอกสำเร็จ */}
          <div
            className={cn(
              'absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300',
              showToast
                ? 'translate-y-0 opacity-100'
                : '-translate-y-2 opacity-0 pointer-events-none'
            )}
          >
            <Check className="size-4" />
            คัดลอกข้อความสำเร็จแล้ว
          </div>

          {/* header */}
          <div className="mb-4 flex items-start justify-between">
            <Dialog.Title className="text-base font-bold">
              ติดต่อสอบถามผ่าน {channelLabel}
            </Dialog.Title>
            <Dialog.Close
              render={
                <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted" />
              }
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {/* description */}
          <p className="mb-3 text-sm text-muted-foreground">
            {lineOnMobile
              ? 'ข้อความด้านล่างจะถูกส่งเข้า LINE ให้อัตโนมัติ กดปุ่มด้านล่างเพื่อเปิด LINE'
              : `กดปุ่มด้านล่างเพื่อเปิด ${channelLabel} แล้ววางข้อความในแชทได้เลย`}
          </p>

          {/* message preview + copy icon */}
          {message && (
            <div className="relative mb-4 rounded-xl border border-border bg-muted/50 p-3 pr-10">
              {/* copy button มุมบนขวา */}
              {!lineOnMobile && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    'absolute right-2 top-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors',
                    justCopied
                      ? 'text-green-600'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {justCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {justCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              )}
              <div className="select-text whitespace-pre-line text-sm leading-relaxed">
                {message}
              </div>
            </div>
          )}

          {/* ปุ่ม redirect — ปุ่มหลัก */}
          <Button onClick={handleRedirect} className={cn('w-full gap-2', channelColor)}>
            {channel === 'line' ? (
              <MessageCircle className="size-4" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            เปิด {channelLabel}
          </Button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
