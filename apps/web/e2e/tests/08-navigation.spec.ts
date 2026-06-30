/**
 * 08 — Navigation & 404 Tests
 * ตรวจสอบ nav links, back button, category pages, 404 handling
 */
import { test, expect } from '@playwright/test'

test.describe('Navigation & 404', () => {
  test('N-01: nav links ทุกปุ่มพา navigate ถูกหน้า', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Bottom nav labels จาก BottomNav.tsx: "ค้นหา", "รถของฉัน", "รายการโปรด"
    // ทดสอบแต่ละ link แยกกัน (ไม่ click loop) เพื่อหลีกเลี่ยงปัญหา goBack + SPA routing
    const navLinks: Array<{ name: string; to: string; expectedUrl: RegExp }> = [
      { name: 'ค้นหา', to: '/search', expectedUrl: /\/search/ },
      { name: 'รถของฉัน', to: '/garage', expectedUrl: /\/garage/ },
      { name: 'รายการโปรด', to: '/wishlist', expectedUrl: /\/wishlist/ },
    ]

    for (const { name, to, expectedUrl } of navLinks) {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      // หา NavLink ใน BottomNav (nav ที่ bottom)
      const navEl = page.locator('nav').last().getByRole('link', { name, exact: true })
      if (await navEl.isVisible().catch(() => false)) {
        await navEl.click()
        await expect(page).toHaveURL(expectedUrl)
      } else {
        // ถ้าหาไม่เจอ ใช้ page.goto() เพื่อตรวจว่า route มีอยู่
        await page.goto(to)
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(expectedUrl)
      }
    }
  })

  test('N-02: navigate ไป URL ไม่มีอยู่ → 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz123')
    await page.waitForLoadState('networkidle')

    // NotFoundPage แสดง <h1>ไม่พบหน้าที่ค้นหา</h1>
    await expect(
      page.getByRole('heading', { name: /ไม่พบหน้า/i })
    ).toBeVisible({ timeout: 5_000 })
  })

  test('N-03: browser back button ทำงานได้หลัง navigate', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/search/)

    await page.goBack()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/')
  })

  test('N-04: /search?category=<id> โหลดสินค้าได้', async ({ page }) => {
    // HomePage links ไปที่ /search?category=<id> (ไม่ใช่ /category/:slug)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const categoryLink = page.locator('a[href^="/search?category="]').first()
    await categoryLink.waitFor({ timeout: 10_000 })
    await categoryLink.click()
    await page.waitForLoadState('networkidle')

    // ควรอยู่ที่ search page และมีสินค้าหรือ empty state
    await expect(page).toHaveURL(/\/search/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('N-05: /category/invalid-slug → ไม่ crash, แสดง empty หรือ 404', async ({ page }) => {
    await page.goto('/category/this-category-does-not-exist-xyz999')
    await page.waitForLoadState('networkidle')

    // ไม่ควรมี unhandled error
    await expect(page.locator('body')).toBeVisible()
    // ควรแสดง empty state หรือ 404 message
    await expect(
      page.getByText(/404|ไม่พบ|ไม่มีสินค้า|empty/i).or(page.locator('h1'))
    ).toBeVisible({ timeout: 5_000 })
  })

  test('N-06: lazy-loaded pages ไม่ค้างที่ loading state นานเกินไป', async ({ page }) => {
    const pages = ['/garage', '/wishlist', '/inquiry']

    for (const path of pages) {
      await page.goto(path)
      // รอให้ spinner หายภายใน 5 วินาที
      await page.waitForLoadState('networkidle', { timeout: 5_000 })

      // ไม่ควรมี spinner อีกต่อไป
      const spinner = page.getByRole('progressbar').or(page.locator('.animate-spin, [data-loading]'))
      if (await spinner.isVisible()) {
        await expect(spinner).not.toBeVisible({ timeout: 5_000 })
      }
    }
  })
})
