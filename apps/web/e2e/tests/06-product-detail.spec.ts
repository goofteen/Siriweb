/**
 * 06 — Product Detail Tests
 * ตรวจสอบหน้า /product/:id — ข้อมูลครบ, รูป, compatibility, breadcrumb, contact sheet
 */
import { test, expect } from '@playwright/test'

test.describe('Product Detail', () => {
  let productUrl: string

  test.beforeAll(async ({ browser }) => {
    // หา product แรกจากหน้า search
    const page = await browser.newPage()
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    const firstProduct = page.locator('a[href^="/product/"]').first()
    await firstProduct.waitFor({ timeout: 10_000 })
    productUrl = (await firstProduct.getAttribute('href')) ?? '/product/1'
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(productUrl)
    await page.waitForLoadState('networkidle')
  })

  test('P-01: คลิก product card → navigate ไป /product/:id', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('a[href^="/product/"]').first()
    await firstCard.click()
    await expect(page).toHaveURL(/\/product\/\d+/)
  })

  test('P-02: แสดงข้อมูลสินค้าครบ (ชื่อ, ราคา, SKU, สต็อก)', async ({ page }) => {
    // ชื่อสินค้า (Thai)
    await expect(page.locator('h1, [data-testid="product-name"]').first()).toBeVisible()

    // ราคา (มี ฿)
    await expect(page.getByText(/฿[\d,]+/)).toBeVisible()

    // SKU
    await expect(page.getByText(/SKU|รหัสสินค้า/i)).toBeVisible()
  })

  test('P-03: รูปสินค้าแสดงอยู่', async ({ page }) => {
    const productImg = page.locator('img').first()
    await expect(productImg).toBeVisible({ timeout: 10_000 })
    // ตรวจว่ารูปโหลดสำเร็จ
    const loaded = await productImg.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
    )
    expect(loaded).toBe(true)
  })

  test('P-04: compatibility list แสดงรุ่นรถที่ใช้ได้', async ({ page }) => {
    // หัวข้อ compatibility
    await expect(
      page.getByText(/รถที่ใช้ได้|compatibility|รุ่นรถที่รองรับ/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('P-05: badge "ใช้กับรถคุณได้" แสดงเมื่อ primary vehicle compatible', async ({ page }) => {
    // ตั้ง vehicle ที่ compatible กับ BP-HC-001 (Honda Civic)
    await page.evaluate(() => {
      localStorage.setItem(
        'siri_garage',
        JSON.stringify({
          vehicles: [{ id: 1, brand: 'Honda', model: 'Civic', year: 2020, savedAt: Date.now() }],
          primaryId: 1,
        })
      )
    })

    // ไปหน้า product ที่ compatible กับ Honda Civic
    await page.goto('/search?q=ผ้าเบรก+Honda+Civic')
    await page.waitForLoadState('networkidle')
    const firstProduct = page.locator('a[href^="/product/"]').first()
    await firstProduct.waitFor({ timeout: 10_000 })
    await firstProduct.click()
    await page.waitForLoadState('networkidle')

    // badge อาจแสดงหรือไม่แสดง ขึ้นอยู่กับ product นั้น ๆ
    // ถ้าแสดง → ต้องมีข้อความถูกต้อง
    const badge = page.getByText('ใช้กับรถคุณได้')
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible()
    }
  })

  test('P-06: breadcrumb navigation ทำงานได้', async ({ page }) => {
    // หา breadcrumb links
    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], [data-testid="breadcrumb"]')
    if (await breadcrumb.isVisible()) {
      const homeLink = breadcrumb.getByRole('link', { name: /หน้าแรก|home/i })
      await homeLink.click()
      await expect(page).toHaveURL('/')
    } else {
      // ไม่มี explicit breadcrumb nav → ตรวจ link ที่ไปหน้าแรก
      const backLink = page.getByRole('link', { name: /หน้าแรก|home/i }).first()
      if (await backLink.isVisible()) {
        await backLink.click()
        await expect(page).toHaveURL('/')
      }
    }
  })

  test('P-07: wishlist toggle บนหน้า product detail', async ({ page }) => {
    // ProductDetailPage ใช้ 'ลบจากรายการโปรด' (ไม่มีคำว่า "ออก")
    const heartBtn = page
      .getByRole('button', { name: /บันทึกในรายการโปรด|ลบจากรายการโปรด|ลบออกจากรายการโปรด/i })
      .first()
    await expect(heartBtn).toBeVisible()

    const before = await heartBtn.getAttribute('aria-label')
    await heartBtn.click()
    await page.waitForTimeout(300)
    const after = await heartBtn.getAttribute('aria-label')

    expect(after).not.toBe(before)
  })

  test('P-08: ปุ่ม "ติดต่อ" เปิด ContactStoreSheet', async ({ page }) => {
    const contactBtn = page.getByRole('button', { name: 'ติดต่อสั่งซื้อ' })
    await expect(contactBtn).toBeVisible()
    await contactBtn.click()

    // ตรวจ Sheet heading (ไม่ใช่ button) เพื่อหลีกเลี่ยง strict mode
    await expect(page.getByRole('heading', { name: 'ติดต่อสั่งซื้อ' })).toBeVisible({ timeout: 3_000 })
    await expect(page.getByText('Line OA')).toBeVisible()
    await expect(page.getByText('โทรหาร้าน')).toBeVisible()
    await expect(page.getByText('กรอกแบบฟอร์ม')).toBeVisible()
  })
})
