/**
 * Search helpers — reusable actions for smart search tests
 */
import type { Page } from '@playwright/test'

/**
 * พิมพ์ข้อความลง SmartSearchBox และรอ autocomplete
 * returns: locator ของ listbox dropdown
 */
export async function typeInSearchBox(page: Page, query: string) {
  const input = page.getByPlaceholder('ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...')
  await input.click()
  await input.fill(query)
  return page.getByRole('listbox')
}

/**
 * ค้นหาและกด Enter เพื่อไปหน้า /search
 */
export async function searchAndSubmit(page: Page, query: string): Promise<void> {
  const input = page.getByPlaceholder('ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...')
  await input.click()
  await input.fill(query)
  await input.press('Enter')
  await page.waitForURL(/\/search/)
}

/**
 * รอให้ผลลัพธ์การค้นหาโหลด (product cards หรือ empty state)
 */
export async function waitForSearchResults(page: Page): Promise<void> {
  // รอให้หายจาก loading state
  await page.waitForLoadState('networkidle')
}
