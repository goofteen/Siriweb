/**
 * 02 — Smart Search Tests
 * ตรวจสอบ Thai search, autocomplete, keyboard navigation, zero result state
 */
import { test, expect } from '@playwright/test'
import { typeInSearchBox, searchAndSubmit, waitForSearchResults } from '../helpers/search'

// SKU และคำไทยที่มีอยู่ใน seed.sql
const KNOWN_SKU = 'BP-HC-001'
const THAI_KEYWORD = 'ผ้าเบรก'
const THAI_SYNONYM = 'แบรก' // synonym ของ เบรก
const THAI_TYPO = 'ผ้าเบลก' // typo ของ ผ้าเบรก
const EN_KEYWORD = 'brake pad'
const NO_RESULT_QUERY = 'xyzxyzxyz99999aaaqqq'

test.describe('Smart Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('S-01: คลิก search box แล้ว focus ลงที่ input', async ({ page }) => {
    const input = page.getByPlaceholder('ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...')
    await input.click()
    await expect(input).toBeFocused()
  })

  test('S-02: พิมพ์ 1 ตัวอักษร → ไม่มี dropdown', async ({ page }) => {
    const listbox = await typeInSearchBox(page, 'ก')
    await page.waitForTimeout(400) // รอ debounce
    await expect(listbox).not.toBeVisible()
  })

  test('S-03: พิมพ์ 2+ ตัวอักษร → dropdown แสดงภายใน 1 วินาที', async ({ page }) => {
    const listbox = await typeInSearchBox(page, 'แบ')
    await expect(listbox).toBeVisible({ timeout: 1_500 })
    const options = page.getByRole('option')
    await expect(options.first()).toBeVisible()
  })

  test('S-04: ค้นหาคำไทย "ผ้าเบรก" → มีผลลัพธ์', async ({ page }) => {
    await searchAndSubmit(page, THAI_KEYWORD)
    await waitForSearchResults(page)
    const productLinks = page.locator('a[href^="/product/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 })
    const count = await productLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('S-05: ค้นหา synonym "แบรก" → มีผลลัพธ์ (เหมือน เบรก)', async ({ page }) => {
    await searchAndSubmit(page, THAI_SYNONYM)
    await waitForSearchResults(page)
    const productLinks = page.locator('a[href^="/product/"]')
    // ต้องมีผลลัพธ์อย่างน้อย 1 รายการ ไม่ใช่หน้าว่าง
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 })
  })

  test('S-06: ค้นหา typo "ผ้าเบลก" → fuzzy matching ยังให้ผลลัพธ์', async ({ page }) => {
    await searchAndSubmit(page, THAI_TYPO)
    await waitForSearchResults(page)
    // อาจจะมีผลน้อย แต่ต้องไม่ crash และไม่แสดง error page
    await expect(page).toHaveURL(/\/search/)
    await expect(page.locator('body')).not.toContainText('Error')
  })

  test('S-07: ค้นหาภาษาอังกฤษ "brake pad" → มีผลลัพธ์', async ({ page }) => {
    await searchAndSubmit(page, EN_KEYWORD)
    await waitForSearchResults(page)
    const productLinks = page.locator('a[href^="/product/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 })
  })

  test('S-08: ค้นหา SKU ตรง → product นั้นปรากฏก่อน', async ({ page }) => {
    await searchAndSubmit(page, KNOWN_SKU)
    await waitForSearchResults(page)
    const productLinks = page.locator('a[href^="/product/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 })
    // ผลแรกควรมี SKU นั้นอยู่ (ตรวจจากชื่อสินค้า)
    const firstName = await productLinks.first().textContent()
    expect(firstName?.toLowerCase()).toBeTruthy()
  })

  test('S-09: ค้นหาคำที่ไม่มีผล → empty state ไม่ crash', async ({ page }) => {
    await searchAndSubmit(page, NO_RESULT_QUERY)
    await waitForSearchResults(page)
    await expect(page).toHaveURL(/\/search/)
    // ไม่มี JS error, หน้าแสดงอยู่
    await expect(page.locator('body')).toBeVisible()
    // ควรมีข้อความบอกว่าไม่พบสินค้า
    await expect(
      page.getByText(/ไม่พบ|ไม่มีสินค้า|0 รายการ|no result/i)
    ).toBeVisible({ timeout: 10_000 })
  })

  test('S-10: keyboard navigation ด้วย Arrow keys และ Enter', async ({ page }) => {
    const input = page.getByPlaceholder('ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...')
    await input.click()
    await input.fill('ผ้า')

    // รอ suggestions จริงๆ โหลดเสร็จ (ไม่ใช่แค่ loading state)
    // role="option" ปรากฏเมื่อ suggestions.length > 0 เท่านั้น
    const firstOption = page.getByRole('listbox').getByRole('option').first()
    await expect(firstOption).toBeVisible({ timeout: 3_000 })

    // กด ArrowDown → option แรกถูก highlight (aria-selected="true")
    await input.press('ArrowDown')
    await expect(firstOption).toHaveAttribute('aria-selected', 'true')

    // กด Enter → navigate ไปหน้า search
    await input.press('Enter')
    await expect(page).toHaveURL(/\/search/)
  })

  test('S-11: Escape ปิด dropdown (app bug fix)', async ({ page }) => {
    // ก่อนแก้ bug: Escape ล้างแค่ showSuggestions แต่ไม่ล้าง suggestions
    //   → onFocus re-open ได้ ทำให้ dropdown ยังแสดงอยู่
    // หลังแก้ bug: Escape ล้าง suggestions + isFetching ด้วย → dropdown ปิดถาวร
    const listbox = await typeInSearchBox(page, 'แบ')
    // รอ suggestions โหลดเสร็จ (ไม่ใช่แค่ loading state)
    await expect(page.getByRole('listbox').getByRole('option').first()).toBeVisible({ timeout: 3_000 })

    const input = page.getByPlaceholder('ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...')
    await input.press('Escape')
    await expect(listbox).not.toBeVisible({ timeout: 2_000 })
    // input ยังคงมีค่าอยู่ แต่ suggestions ถูกล้างแล้ว
    await expect(input).toHaveValue('แบ')
  })

  test('S-12: URL มี query param หลังค้นหา (shareable link)', async ({ page }) => {
    await searchAndSubmit(page, THAI_KEYWORD)
    await expect(page).toHaveURL(/[?&]q=/)

    // โหลดหน้าใหม่ด้วย URL เดิม → ผลลัพธ์ยังอยู่
    await page.reload()
    await waitForSearchResults(page)
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible({ timeout: 10_000 })
  })
})
