/**
 * LINE OA — สร้าง URL สำหรับเปิด LINE พร้อมข้อความ prefill
 * ใช้ LINE URL Scheme: oaMessage (ไม่ต้องใช้ Messaging API)
 *
 * มือถือ: เปิดแอป LINE พร้อมข้อความ prefill (oaMessage)
 * Desktop: copy ข้อความ + เปิด LINE แชทในแท็บใหม่
 */

const LINE_OA_ID = import.meta.env.VITE_LINE_OA_ID || '@siriparts'

export interface ProductForLine {
  id: number
  name_th: string
  sku: string
  price: number
}

/** ตรวจว่าเป็นมือถือหรือไม่ */
export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** สร้างข้อความรายละเอียดสินค้า */
export function buildLineMessage(product: ProductForLine): string {
  const productUrl = `${window.location.origin}/product/${product.id}`
  return [
    `สนใจสินค้า: ${product.name_th}`,
    `รหัส: ${product.sku}`,
    `ราคา: ${product.price.toLocaleString('th-TH')} บาท`,
    productUrl,
  ].join('\n')
}

/** สร้าง oaMessage URL (ใช้บนมือถือ) */
export function buildLineInquiryUrl(product: ProductForLine): string {
  const message = buildLineMessage(product)
  const encodedOaId = LINE_OA_ID.replace('@', '%40')
  return `https://line.me/R/oaMessage/${encodedOaId}/?${encodeURIComponent(message)}`
}

/** สร้าง LINE chat URL สำหรับ desktop (เปิดแชทแต่ไม่มี prefill) */
export function buildLineChatUrl(): string {
  const encodedOaId = LINE_OA_ID.replace('@', '%40')
  return `https://line.me/R/ti/p/${encodedOaId}`
}
