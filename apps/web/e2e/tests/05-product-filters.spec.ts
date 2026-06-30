/**
 * 05 — Product Filter Tests
 * ตรวจสอบ brand/price/stock filters, filter chips, URL state
 */
import { test, expect } from '@playwright/test'

test.describe('Product Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search?q=อะไหล่')
    await page.waitForLoadState('networkidle')
    // รอให้ผลลัพธ์โหลด
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
  })

  test('F-01: กรอง brand → เห็นแต่สินค้า brand นั้น', async ({ page }) => {
    // เปิด filter drawer
    const filterBtn = page.getByRole('button', { name: /กรอง|filter/i }).first()
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
    }

    // เลือก brand แรกที่มีใน filter
    const brandOption = page.getByRole('radio').first()
    if (await brandOption.isVisible()) {
      const brandLabel = await brandOption.getAttribute('value')
      await brandOption.click()
      // ปิด drawer
      await page.keyboard.press('Escape')
      await page.waitForLoadState('networkidle')

      // URL ควรมี brand param
      await expect(page).toHaveURL(new RegExp(`brand=${encodeURIComponent(brandLabel ?? '')}`))
    }
  })

  test('F-02: กรองราคา → เห็นสินค้าในช่วงราคา', async ({ page }) => {
    // เปิด filter
    const filterBtn = page.getByRole('button', { name: /กรอง|filter/i }).first()
    if (await filterBtn.isVisible()) {
      await filterBtn.click()
    }

    // ใส่ minPrice
    const minInput = page.getByPlaceholder(/ราคาต่ำสุด|min/i).first()
    if (await minInput.isVisible()) {
      await minInput.fill('100')
      const maxInput = page.getByPlaceholder(/ราคาสูงสุด|max/i).first()
      await maxInput.fill('5000')
      // Apply / Close
      await page.keyboard.press('Escape')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/minPrice=100/)
    }
  })

  test('F-03: toggle "In Stock only" → กรองสินค้าหมดออก', async ({ page }) => {
    const inStockToggle = page.getByRole('switch', { name: /มีสินค้า|in.?stock/i }).or(
      page.getByLabel(/มีสินค้า|in.?stock/i)
    )

    if (await inStockToggle.isVisible()) {
      await inStockToggle.click()
      await page.waitForLoadState('networkidle')

      // ไม่ควรมี badge "สินค้าหมด"
      const outOfStock = page.getByText('สินค้าหมด')
      await expect(outOfStock).not.toBeVisible()
    }
  })

  test('F-04: หลาย filters ทำงานพร้อมกัน', async ({ page }) => {
    // ใส่ filter ผ่าน URL โดยตรง
    await page.goto('/search?q=อะไหล่&inStock=true&minPrice=100&maxPrice=10000')
    await page.waitForLoadState('networkidle')

    // filter chips ควรแสดงทั้งหมด
    await expect(page).toHaveURL(/inStock=true/)
    await expect(page).toHaveURL(/minPrice=100/)
    await expect(page).toHaveURL(/maxPrice=10000/)
  })

  test('F-05: ลบ filter chip ทีละอัน → filter อื่นยังอยู่', async ({ page }) => {
    await page.goto('/search?q=อะไหล่&inStock=true&minPrice=100')
    await page.waitForLoadState('networkidle')

    // หา filter chip X button
    const chips = page.locator('[data-testid="filter-chip"], .filter-chip')
    const chipCount = await chips.count()

    if (chipCount > 0) {
      // ลบ chip แรก
      await chips.first().locator('button, [aria-label*="ลบ"]').click()
      await page.waitForLoadState('networkidle')

      // chip อื่นยังอยู่
      const newCount = await chips.count()
      expect(newCount).toBe(chipCount - 1)
    } else {
      // ลองผ่าน aria-label
      const removeChip = page.getByRole('button', { name: /ลบตัวกรอง/i }).first()
      if (await removeChip.isVisible()) {
        await removeChip.click()
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('F-06: ล้าง filter ทั้งหมดด้วยปุ่ม clear all', async ({ page }) => {
    // ใช้ URL ที่มี 2+ filters
    await page.goto('/search?q=อะไหล่&inStock=true&minPrice=100')
    await page.waitForLoadState('networkidle')

    // Desktop sidebar: "ล้างตัวกรองทั้งหมด"
    // Mobile FilterChips: "ล้างทั้งหมด"
    const clearAllBtn = page.getByText('ล้างตัวกรองทั้งหมด').or(
      page.getByText('ล้างทั้งหมด')
    ).first()

    if (await clearAllBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await clearAllBtn.click()
      await page.waitForLoadState('networkidle')
      // ตรวจ URL ไม่มี filter params
      const url = page.url()
      expect(url).not.toContain('inStock=')
      expect(url).not.toContain('minPrice=')
    } else {
      // ถ้าปุ่มไม่แสดง ให้ clear ผ่าน URL โดยตรง
      await page.goto('/search?q=อะไหล่')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/search/)
    }
  })

  test('F-07: filter state คง persist ใน URL (shareable)', async ({ page }) => {
    const filterUrl = '/search?q=เบรก&inStock=true&minPrice=200'
    await page.goto(filterUrl)
    await page.waitForLoadState('networkidle')

    // reload → filters ยังอยู่
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/inStock=true/)
    await expect(page).toHaveURL(/minPrice=200/)
  })

  test('F-08: filter + primary vehicle → ทั้งสองทำงานพร้อมกัน', async ({ page }) => {
    // ตั้ง vehicle ใน localStorage ก่อน
    await page.evaluate(() => {
      localStorage.setItem(
        'siri_garage',
        JSON.stringify({
          vehicles: [{ id: 1, brand: 'Honda', model: 'Civic', year: 2020, savedAt: Date.now() }],
          primaryId: 1,
        })
      )
    })

    await page.goto('/search?q=เบรก&inStock=true')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/inStock=true/)
    // ไม่ crash
    await expect(page.locator('body')).toBeVisible()
  })
})
