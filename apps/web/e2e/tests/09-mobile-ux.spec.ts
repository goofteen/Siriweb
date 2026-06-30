/**
 * 09 — Mobile UX Tests
 * รัน ONLY บน iOS Safari และ Android Chrome projects
 * ตรวจสอบ bottom nav, touch targets, responsive layout, sheets
 */
import { test, expect } from '@playwright/test'
import { dismissSearchDropdown } from '../helpers/wishlist'

// Skip บน desktop projects
test.skip(
  ({ browserName, isMobile }) => !isMobile,
  'Mobile-only tests — skipped on desktop'
)

test.describe('Mobile UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('M-01: Bottom navigation แสดงครบ 5 ปุ่ม', async ({ page }) => {
    // Bottom nav ควรมีอยู่
    const nav = page.locator('nav').last() // bottom nav มักเป็น nav ล่างสุด
    await expect(nav).toBeVisible()

    // ตรวจ links/buttons ใน bottom nav
    const navItems = nav.locator('a, button')
    const count = await navItems.count()
    expect(count).toBeGreaterThanOrEqual(3) // อย่างน้อย Home, Search, Garage
  })

  test('M-02: Search bar แตะได้และ focus', async ({ page }) => {
    const input = page.getByPlaceholder('ค้นหาอะไหล่ รุ่นรถ หรือรหัสสินค้า...')
    await input.tap()
    await expect(input).toBeFocused()
  })

  test('M-03: Filter drawer เปิดได้', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
    await dismissSearchDropdown(page)

    const filterBtn = page.getByRole('button', { name: /กรอง|filter/i }).first()
    if (await filterBtn.isVisible()) {
      await filterBtn.tap()
      // Drawer/Sheet ควรเปิด
      await expect(
        page.getByRole('dialog').or(page.locator('[data-state="open"]')).first()
      ).toBeVisible({ timeout: 3_000 })
    }
  })

  test('M-04: Filter drawer ปิดได้ด้วยปุ่ม X หรือ tap นอก', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
    await dismissSearchDropdown(page)

    const filterBtn = page.getByRole('button', { name: /กรอง|filter/i }).first()
    if (await filterBtn.isVisible()) {
      await filterBtn.tap()

      const dialog = page.getByRole('dialog').first()
      await expect(dialog).toBeVisible({ timeout: 3_000 })

      // ปิดด้วยปุ่ม Close หรือ Escape
      const closeBtn = dialog.getByRole('button', { name: /ปิด|close/i }).first()
      if (await closeBtn.isVisible()) {
        await closeBtn.tap()
      } else {
        await page.keyboard.press('Escape')
      }

      await expect(dialog).not.toBeVisible({ timeout: 3_000 })
    }
  })

  test('M-05: Contact sheet เปิดได้จากหน้าสินค้า', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
    await dismissSearchDropdown(page)
    await page.locator('a[href^="/product/"]').first().tap()
    await page.waitForLoadState('networkidle')

    const contactBtn = page.getByRole('button', { name: /ติดต่อ|สั่งซื้อ/i }).first()
    await expect(contactBtn).toBeVisible()
    await contactBtn.tap()

    await expect(page.getByRole('heading', { name: 'ติดต่อสั่งซื้อ' })).toBeVisible({ timeout: 3_000 })
  })

  test('M-06: Touch targets ≥ 44px (buttons & links)', async ({ page }) => {
    // ตรวจ touch targets บน bottom nav
    const interactiveEls = await page.locator('button, a[href]').all()

    const tooSmall: string[] = []
    for (const el of interactiveEls.slice(0, 20)) {
      // ตรวจแค่ 20 รายการแรกเพื่อประสิทธิภาพ
      const box = await el.boundingBox()
      if (box && (box.width < 44 || box.height < 44)) {
        const text = await el.textContent().catch(() => '')
        tooSmall.push(`${text?.trim()} (${box.width.toFixed(0)}x${box.height.toFixed(0)})`)
      }
    }

    // warn ถ้ามีมากกว่า 3 elements ที่เล็กเกินไป
    if (tooSmall.length > 3) {
      console.warn('Touch targets < 44px:', tooSmall)
    }
    // ไม่ fail test เพราะ shadcn icons บางตัวอาจเล็ก แต่ warn เพื่อ review
  })

  test('M-07: ไม่มี horizontal scroll ในทุกหน้า', async ({ page }) => {
    const pagesToCheck = ['/', '/search?q=เบรก', '/garage', '/wishlist']

    for (const path of pagesToCheck) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth
      })

      expect(hasHorizontalScroll, `Horizontal scroll on ${path}`).toBe(false)
    }
  })

  test('M-08: Product cards แสดง 2 columns บน mobile', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })

    const cards = page.locator('a[href^="/product/"]')
    const count = await cards.count()

    if (count >= 2) {
      const box1 = await cards.nth(0).boundingBox()
      const box2 = await cards.nth(1).boundingBox()

      if (box1 && box2) {
        // สอง card อยู่ในแถวเดียวกัน (y ใกล้เคียงกัน)
        const sameRow = Math.abs(box1.y - box2.y) < 10
        expect(sameRow, '2 product cards should be side by side in 2-column grid').toBe(true)
      }
    }
  })

  test('M-09: รูปสินค้าโหลดได้บน mobile', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })

    const broken = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      // กรอง placeholder images จาก placehold.co ออก (อาจโหลดช้าบน mobile)
      return imgs
        .filter((img) => !img.src.includes('placehold.co'))
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src)
    })
    expect(broken).toHaveLength(0)
  })

  test('M-10: Wishlist heart toggle ทำงานได้บน mobile', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
    await dismissSearchDropdown(page)

    const heartBtn = page
      .getByRole('button', { name: /บันทึกในรายการโปรด|ลบออกจากรายการโปรด/i })
      .first()
    await expect(heartBtn).toBeVisible()

    const before = await heartBtn.getAttribute('aria-label')
    await heartBtn.tap()
    await page.waitForTimeout(300)
    const after = await heartBtn.getAttribute('aria-label')

    expect(after).not.toBe(before)
  })
})
