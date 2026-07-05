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
  const [autoCopied, setAutoCopied] = useState(false)
  const message = product ? buildProductMessage(product) : ''

  // LINE บนมือถือใช้ oaMessage ได้เลย ไม่ต้อง copy
  const lineOnMobile = channel === 'line' && isMobile()

  // auto-copy เมื่อเปิด modal (ยกเว้น LINE มือถือ)
  useEffect(() => {
    if (!open || !message || lineOnMobile) return
    copyToClipboard(message).then((ok) => setAutoCopied(ok))
  }, [open, message, lineOnMobile])

  // reset state เมื่อปิด
  useEffect(() => {
    if (!open) {
      setJustCopied(false)
      setAutoCopied(false)
    }
  }, [open])

  async function handleCopy() {
    const ok = await copyToClipboard(message)
    if (ok) {
      setJustCopied(true)
      setAutoCopied(true)
      setTimeout(() => setJustCopied(false), 2000)
    }
  }

  function handleRedirect() {
    if (channel === 'line') {
      if (lineOnMobile && product) {
        // มือถือ: เปิด LINE พร้อมข้อความ prefill
        window.location.href = buildLineInquiryUrl(product)
      } else {
        // desktop: เปิด LINE chat (ข้อความ copy ไว้แล้ว)
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
              : autoCopied || justCopied
                ? `ระบบคัดลอกข้อความให้แล้ว นำไปวางในแชท ${channelLabel} ได้เลย`
                : `กดคัดลอกข้อความด้านล่าง แล้วนำไปวางในแชท ${channelLabel}`}
          </p>

          {/* message preview */}
          {message && (
            <div className="mb-4 select-text whitespace-pre-line rounded-xl border border-border bg-muted/50 p-3 text-sm leading-relaxed">
              {message}
            </div>
          )}

          {/* actions */}
          <div className="flex flex-col gap-2.5">
            {/* ปุ่มคัดลอก — ไม่แสดงถ้าเป็น LINE มือถือ (ไม่ต้อง copy) */}
            {!lineOnMobile && (
              <Button
                variant="outline"
                onClick={handleCopy}
                className={cn('gap-2', justCopied && 'text-green-600')}
              >
                {justCopied ? (
                  <>
                    <Check className="size-4" />
                    คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    คัดลอกข้อความ
                  </>
                )}
              </Button>
            )}

            {/* ปุ่ม redirect — ปุ่มหลัก */}
            <Button onClick={handleRedirect} className={cn('gap-2', channelColor)}>
              {channel === 'line' ? (
                <MessageCircle className="size-4" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              เปิด {channelLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
