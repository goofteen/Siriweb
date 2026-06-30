/**
 * 01 — Homepage Tests
 * ตรวจสอบว่า homepage แสดงผลครบและ interactive elements ทำงานได้
 */
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('H-01: โหลด homepage ได้ครบ ไม่มี console error', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Logo visible
    await expect(page.locator('header')).toBeVisible()

    // Search bar visible
    await expect(
      page.getByPlaceholder('ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...')
    ).toBeVisible()

    // ไม่มี unhandled error (ยกเว้น network error จาก external services)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Failed to load resource') && !e.includes('net::ERR')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('H-02: category tiles คลิกแล้วไปหน้า category', async ({ page }) => {
    // HomePage ใช้ Link to={`/search?category=${cat.id}`} ไม่ใช่ /category/:slug
    const categoryLink = page.locator('a[href^="/search?category="]').first()
    await expect(categoryLink).toBeVisible({ timeout: 10_000 })
    await categoryLink.click()
    await expect(page).toHaveURL(/\/search\?category=/)
  })

  test('H-03: popular products มีอย่างน้อย 1 รายการ', async ({ page }) => {
    // รอ product cards โหลด
    const productCards = page.locator('a[href^="/product/"]')
    await expect(productCards.first()).toBeVisible({ timeout: 10_000 })
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('H-04: VehicleSelector แสดง dropdowns ครบ 3 ตัว', async ({ page }) => {
    const brandDropdown = page.getByRole('combobox').first()
    await expect(brandDropdown).toBeVisible({ timeout: 10_000 })
    const comboboxes = page.getByRole('combobox')
    await expect(comboboxes).toHaveCount(3)
  })

  test('H-05: ไม่มีรูป broken (img ทุกรูป load สำเร็จ)', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    // รอให้รูปภาพที่อยู่ใน viewport โหลดครบ (รวม lazy-loaded)
    await page.waitForTimeout(1_000)
    const broken = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      // กรอง placeholder images จาก placehold.co ออก (อาจโหลดช้าหรือถูก block บาง browser)
      return imgs
        .filter((img) => !img.src.includes('placehold.co'))
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src)
    })
    expect(broken).toHaveLength(0)
  })
})
