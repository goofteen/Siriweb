/**
 * 04 — Wishlist Tests
 * ตรวจสอบ add/remove wishlist, optimistic UI, session persistence
 */
import { test, expect } from '@playwright/test'
import { toggleFirstProductWishlist, isInWishlist, dismissSearchDropdown } from '../helpers/wishlist'

test.describe('Wishlist', () => {
  test.beforeEach(async ({ page }) => {
    // ไปหน้า search ที่มีสินค้า
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')

    // SmartSearchBox แสดง autocomplete dropdown อัตโนมัติเมื่อ query >= 2 chars
    // ต้องปิดก่อนเพื่อไม่ให้ dropdown intercept pointer events บน wishlist buttons
    await dismissSearchDropdown(page)

    // รอ product cards โหลด
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
  })

  test('W-01: คลิก heart → icon เปลี่ยนสถานะ (toggle)', async ({ page }) => {
    const before = await isInWishlist(page)
    await toggleFirstProductWishlist(page)
    await page.waitForTimeout(300)
    const after = await isInWishlist(page)
    expect(after).toBe(!before)
  })

  test('W-02: Optimistic UI — heart เปลี่ยนทันที ก่อน network', async ({ page }) => {
    const before = await isInWishlist(page)
    await toggleFirstProductWishlist(page)
    // ตรวจทันทีโดยไม่รอ network (no waitForTimeout)
    const afterImmediate = await isInWishlist(page)
    expect(afterImmediate).toBe(!before)
  })

  test('W-03: สินค้าที่ save ปรากฏในหน้า /wishlist', async ({ page }) => {
    const inWishlist = await isInWishlist(page)
    if (!inWishlist) {
      await toggleFirstProductWishlist(page)
      await page.waitForTimeout(500)
    }

    await page.goto('/wishlist')
    await page.waitForLoadState('networkidle')

    const productLinks = page.locator('a[href^="/product/"]')
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 })
  })

  test('W-04: ลบสินค้าจากหน้า wishlist', async ({ page }) => {
    const inWishlist = await isInWishlist(page)
    if (!inWishlist) {
      await toggleFirstProductWishlist(page)
      await page.waitForTimeout(500)
    }

    await page.goto('/wishlist')
    await page.waitForLoadState('networkidle')

    const productsBefore = await page.locator('a[href^="/product/"]').count()
    if (productsBefore === 0) {
      test.skip()
      return
    }

    // คลิกลบ (trash icon หรือ button ลบ)
    const deleteBtn = page
      .getByRole('button', { name: /ลบ|remove/i })
      .or(page.locator('button[title*="ลบ"], button[aria-label*="ลบ"]'))
      .first()
    await deleteBtn.click()
    // รอให้ count ลดลงจาก productsBefore (อาจลดเป็น 0 ถ้ามี duplicate items)
    await page.waitForFunction(
      (before) => document.querySelectorAll('a[href^="/product/"]').length < before,
      productsBefore,
      { timeout: 10_000 }
    )
    const productsAfter = await page.locator('a[href^="/product/"]').count()
    expect(productsAfter).toBeLessThan(productsBefore)
  })

  test('W-05: toggle off บน product card → item ถูก remove', async ({ page }) => {
    const inWishlist = await isInWishlist(page)
    if (!inWishlist) {
      await toggleFirstProductWishlist(page)
      await page.waitForTimeout(300)
    }

    await toggleFirstProductWishlist(page)
    await page.waitForTimeout(300)

    const stillIn = await isInWishlist(page)
    expect(stillIn).toBe(false)
  })

  test('W-06: wishlist คง persist หลัง reload', async ({ page }) => {
    const inWishlist = await isInWishlist(page)
    if (!inWishlist) {
      await toggleFirstProductWishlist(page)
      await page.waitForTimeout(500)
    }

    await page.reload()
    await page.waitForLoadState('networkidle')
    await dismissSearchDropdown(page)
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })

    const afterReload = await isInWishlist(page)
    expect(afterReload).toBe(true)
  })

  test('W-07: ลบสินค้าทั้งหมด → empty state แสดง', async ({ page }) => {
    await page.goto('/wishlist')
    await page.waitForLoadState('networkidle')

    while (true) {
      const deleteBtn = page
        .getByRole('button', { name: /ลบ/i })
        .or(page.locator('button[title*="ลบ"]'))
        .first()
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click()
        await page.waitForTimeout(300)
      } else {
        break
      }
    }

    await expect(
      page.getByText(/ยังไม่มีสินค้า|รายการโปรดว่าง|empty/i)
    ).toBeVisible({ timeout: 5_000 })
  })
})
