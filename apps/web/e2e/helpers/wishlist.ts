/**
 * Wishlist helpers — reusable actions for wishlist tests
 */
import type { Page } from '@playwright/test'

/**
 * ปิด autocomplete dropdown ที่เปิดอัตโนมัติเมื่อ SmartSearchBox มี initialValue
 * ทำโดย dispatch mousedown นอก container → document listener เรียก closeDropdown()
 */
export async function dismissSearchDropdown(page: Page): Promise<void> {
  const listbox = page.getByRole('listbox')
  const isVisible = await listbox.isVisible().catch(() => false)
  if (!isVisible) return

  // dispatch mousedown บน document โดยตรง — target คือ document ซึ่งไม่ได้อยู่ใน containerRef
  await page.evaluate(() => {
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
  })

  // รอให้ dropdown หาย
  await listbox.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {})
}

/**
 * คลิก heart button บน product card แรกในหน้า
 */
export async function toggleFirstProductWishlist(page: Page): Promise<void> {
  const heartBtn = page
    .getByRole('button', { name: /บันทึกในรายการโปรด|ลบออกจากรายการโปรด/i })
    .first()
  await heartBtn.click()
}

/**
 * ตรวจว่า product id นี้อยู่ใน wishlist state ของ component (ผ่าน aria-label)
 */
export async function isInWishlist(page: Page): Promise<boolean> {
  const btn = page
    .getByRole('button', { name: /บันทึกในรายการโปรด|ลบออกจากรายการโปรด/i })
    .first()
  const label = await btn.getAttribute('aria-label')
  return label === 'ลบออกจากรายการโปรด'
}
