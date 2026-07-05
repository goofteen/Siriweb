/**
 * MessengerInquiryModal — popup ยืนยันก่อนเปิด Messenger
 * แสดง preview ข้อความ + ปุ่มคัดลอก + ปุ่มเปิด Messenger
 */
import { useState } from 'react'
import { X, Copy, Check, ExternalLink } from 'lucide-react'
import { Dialog } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import {
  buildProductMessage,
  buildMessengerUrl,
  copyToClipboard,
  type ProductForContact,
} from '@/lib/contact'
import { cn } from '@/lib/utils'

interface MessengerInquiryModalProps {
  open: boolean
  onClose: () => void
  product: ProductForContact | null
  autoCopied: boolean
}

export function MessengerInquiryModal({
  open,
  onClose,
  product,
  autoCopied,
}: MessengerInquiryModalProps) {
  const [justCopied, setJustCopied] = useState(false)
  const message = product ? buildProductMessage(product) : ''

  async function handleCopy() {
    const ok = await copyToClipboard(message)
    if (ok) {
      setJustCopied(true)
      setTimeout(() => setJustCopied(false), 2000)
    }
  }

  function handleOpenMessenger() {
    window.open(buildMessengerUrl(), '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-5 shadow-xl transition duration-200 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
          {/* header */}
          <div className="mb-4 flex items-start justify-between">
            <Dialog.Title className="text-base font-bold">ติดต่อสอบถามผ่าน Messenger</Dialog.Title>
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
            {autoCopied || justCopied
              ? 'ระบบคัดลอกข้อความให้แล้ว นำไปวางในแชท Messenger ได้เลย (หรือกดคัดลอกอีกครั้งด้านล่าง)'
              : 'กดปุ่มด้านล่างเพื่อคัดลอกข้อความ แล้วนำไปวางในแชท Messenger'}
          </p>

          {/* message preview */}
          {message && (
            <div className="mb-4 select-text whitespace-pre-line rounded-xl border border-border bg-muted/50 p-3 text-sm leading-relaxed">
              {message}
            </div>
          )}

          {/* actions */}
          <div className="flex flex-col gap-2.5">
            {/* ปุ่มคัดลอก */}
            <Button
              variant={autoCopied && !justCopied ? 'outline' : justCopied ? 'outline' : 'default'}
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

            {/* ปุ่มเปิด Messenger — ปุ่มหลัก */}
            <Button
              onClick={handleOpenMessenger}
              className="gap-2 bg-[#0084FF] text-white hover:bg-[#006fd6]"
            >
              <ExternalLink className="size-4" />
              เปิด Messenger
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
