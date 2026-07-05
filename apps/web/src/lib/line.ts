/**
 * LINE OA — สร้าง URL สำหรับเปิด LINE พร้อมข้อความ prefill
 * ใช้ LINE URL Scheme: oaMessage (ไม่ต้องใช้ Messaging API)
 */

const LINE_OA_ID = import.meta.env.VITE_LINE_OA_ID || '@siriparts'

interface ProductForLine {
  id: number
  name_th: string
  sku: string
  price: number
}

/**
 * สร้าง URL เปิด LINE พร้อมข้อความรายละเอียดสินค้า
 * ลูกค้าแค่กดส่งใน LINE เอง
 */
export function buildLineInquiryUrl(product: ProductForLine): string {
  const productUrl = `${window.location.origin}/product/${product.id}`
  const message = [
    `สนใจสินค้า: ${product.name_th}`,
    `รหัส: ${product.sku}`,
    `ราคา: ${product.price.toLocaleString('th-TH')} บาท`,
    productUrl,
  ].join('\n')

  // OA ID ต้อง encode @ เป็น %40
  const encodedOaId = LINE_OA_ID.replace('@', '%40')
  return `https://line.me/R/oaMessage/${encodedOaId}/?${encodeURIComponent(message)}`
}
