/**
 * Contact utilities — สร้างข้อความและ URL สำหรับ LINE OA + Facebook Messenger
 */

const LINE_OA_ID = import.meta.env.VITE_LINE_OA_ID || '@siriparts'
const FB_PAGE_USERNAME = import.meta.env.VITE_FB_PAGE_USERNAME || ''

export interface ProductForContact {
  id: number
  name_th: string
  sku: string
  price: number
}

/** ตรวจว่าเป็นมือถือหรือไม่ */
export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** สร้างข้อความรายละเอียดสินค้า (ใช้ร่วมทั้ง LINE + Messenger) */
export function buildProductMessage(product: ProductForContact): string {
  const productUrl = `${window.location.origin}/product/${product.id}`
  return [
    `สนใจสินค้า: ${product.name_th}`,
    `รหัส: ${product.sku}`,
    `ราคา: ${product.price.toLocaleString('th-TH')} บาท`,
    productUrl,
  ].join('\n')
}

// ─── LINE ───────────────────────────────────────────────────────────────────

/** สร้าง oaMessage URL (มือถือ — prefill ข้อความใน LINE) */
export function buildLineInquiryUrl(product: ProductForContact): string {
  const message = buildProductMessage(product)
  const encodedOaId = LINE_OA_ID.replace('@', '%40')
  return `https://line.me/R/oaMessage/${encodedOaId}/?${encodeURIComponent(message)}`
}

/** สร้าง LINE chat URL (desktop — เปิดแชทแต่ไม่มี prefill) */
export function buildLineChatUrl(): string {
  const encodedOaId = LINE_OA_ID.replace('@', '%40')
  return `https://line.me/R/ti/p/${encodedOaId}`
}

// ─── Facebook Messenger ─────────────────────────────────────────────────────

/** สร้าง Messenger URL */
export function buildMessengerUrl(): string {
  return `https://m.me/${FB_PAGE_USERNAME}`
}

// ─── Clipboard ──────────────────────────────────────────────────────────────

/** Copy ข้อความลง clipboard (มี fallback สำหรับ browser เก่า) */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback: textarea + execCommand
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      return ok
    } catch {
      return false
    }
  }
}
