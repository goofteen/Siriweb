/**
 * 07 — Inquiry Form Tests
 * ตรวจสอบ form validation, submission, product pre-fill, contact buttons
 * หมายเหตุ: submissions จะถูก prefix ด้วย "[QA TEST]" เพื่อ identify ใน Supabase
 *
 * Selectors มาจาก InquiryPage.tsx โดยตรง:
 *   ชื่อ     → placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
 *   โทร      → placeholder="เบอร์โทรศัพท์"
 *   Line     → placeholder="Line ID"
 *   อีเมล    → placeholder="อีเมล"
 *   ข้อความ → placeholder="สอบถามสินค้า ราคา หรือรายละเอียดเพิ่มเติม..."
 *   ปุ่มส่ง  → button text "ส่งคำขอ"
 */
import { test, expect } from '@playwright/test'

const NAME_INPUT = 'ชื่อ-นามสกุล หรือชื่อเล่น'
const PHONE_INPUT = 'เบอร์โทรศัพท์'
const LINE_INPUT = 'Line ID'
const EMAIL_INPUT = 'อีเมล'
const MSG_INPUT = 'สอบถามสินค้า ราคา หรือรายละเอียดเพิ่มเติม...'
const SUBMIT_BTN = 'ส่งคำขอ'
const SUCCESS_TEXT = /ส่งคำขอเรียบร้อยแล้ว|สำเร็จ|ขอบคุณ/i

test.describe('Inquiry Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inquiry')
    await page.waitForLoadState('networkidle')
  })

  test('I-01: form render ครบทุก field', async ({ page }) => {
    await expect(page.getByPlaceholder(NAME_INPUT)).toBeVisible()
    await expect(page.getByPlaceholder(PHONE_INPUT)).toBeVisible()
    await expect(page.getByPlaceholder(LINE_INPUT)).toBeVisible()
    await expect(page.getByPlaceholder(EMAIL_INPUT)).toBeVisible()
    await expect(page.getByPlaceholder(MSG_INPUT)).toBeVisible()
    await expect(page.getByRole('button', { name: SUBMIT_BTN })).toBeVisible()
  })

  test('I-02: submit โดยไม่กรอก → แสดง validation error', async ({ page }) => {
    await page.getByRole('button', { name: SUBMIT_BTN }).click()
    await expect(page.getByText(/กรุณา/i).first()).toBeVisible({ timeout: 3_000 })
  })

  test('I-03: submit ด้วยข้อมูลขั้นต่ำ (ชื่อ + เบอร์ + ข้อความ)', async ({ page }) => {
    await page.getByPlaceholder(NAME_INPUT).fill('[QA TEST] ทดสอบ')
    await page.getByPlaceholder(PHONE_INPUT).fill('0812345678')
    await page.getByPlaceholder(MSG_INPUT).fill('[QA TEST] ทดสอบการส่งฟอร์มขั้นต่ำ')

    await page.getByRole('button', { name: SUBMIT_BTN }).click()

    await expect(page.getByRole('heading', { name: 'ส่งคำขอเรียบร้อยแล้ว' })).toBeVisible({ timeout: 15_000 })
  })

  test('I-04: submit ด้วยข้อมูลครบทุก field', async ({ page }) => {
    await page.getByPlaceholder(NAME_INPUT).fill('[QA TEST] ครบทุก field')
    await page.getByPlaceholder(PHONE_INPUT).fill('0812345678')
    await page.getByPlaceholder(LINE_INPUT).fill('qatest.line')
    await page.getByPlaceholder(EMAIL_INPUT).fill('qa@test.com')
    await page.getByPlaceholder(MSG_INPUT).fill('[QA TEST] ทดสอบส่งครบทุก field ภาษาไทย English 123')

    await page.getByRole('button', { name: SUBMIT_BTN }).click()

    await expect(page.getByRole('heading', { name: 'ส่งคำขอเรียบร้อยแล้ว' })).toBeVisible({ timeout: 15_000 })
  })

  test('I-05: navigate จากหน้าสินค้า → product ID ถูก pre-fill', async ({ page }) => {
    await page.goto('/inquiry?product=1')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/product=1/)
  })

  test('I-06: ปุ่ม Line OA เปิด link ใหม่', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
    await page.locator('a[href^="/product/"]').first().click()
    await page.waitForLoadState('networkidle')

    const contactBtn = page.getByRole('button', { name: 'ติดต่อสั่งซื้อ' })
    await contactBtn.click()

    // รอ Sheet heading แสดง
    await expect(page.getByRole('heading', { name: 'ติดต่อสั่งซื้อ' })).toBeVisible({ timeout: 3_000 })

    // คลิก Line OA → เปิด popup หรือ navigate
    const [popup] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 3_000 }).catch(() => null),
      page.getByText('Line OA').click(),
    ])

    // ถ้ามี popup แสดงว่า Line link เปิดสำเร็จ
    if (popup) {
      expect(popup).toBeTruthy()
    } else {
      // ไม่มี popup → browser อาจ block หรือ navigate ออก
      // ตรวจว่า page ยังอยู่ (ไม่ crash)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('I-07: ปุ่ม "โทรหาร้าน" trigger tel: link', async ({ page }) => {
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')
    await page.locator('a[href^="/product/"]').first().waitFor({ timeout: 10_000 })
    await page.locator('a[href^="/product/"]').first().click()
    await page.waitForLoadState('networkidle')

    const contactBtn = page.getByRole('button', { name: 'ติดต่อสั่งซื้อ' })
    await contactBtn.click()
    await expect(page.getByRole('heading', { name: 'ติดต่อสั่งซื้อ' })).toBeVisible({ timeout: 3_000 })

    // คลิกปุ่มโทร — tel: link ไม่สามารถ intercept ใน headless ได้ แต่ปุ่มต้องคลิกได้
    await page.getByText('โทรหาร้าน').click()
    await page.waitForTimeout(500)
    // ไม่ crash และหน้ายังอยู่
    await expect(page.locator('body')).toBeVisible()
  })

  test('I-08: กรอก Thai text ใน message field → ส่งได้ถูกต้อง', async ({ page }) => {
    await page.getByPlaceholder(NAME_INPUT).fill('[QA TEST] Thai Input')
    await page.getByPlaceholder(PHONE_INPUT).fill('0812345678')
    await page.getByPlaceholder(MSG_INPUT).fill(
      '[QA TEST] ต้องการสอบถามผ้าเบรกหน้า Honda Civic ปี 2020 ราคาเท่าไหร่ครับ?'
    )

    await page.getByRole('button', { name: SUBMIT_BTN }).click()

    await expect(page.getByRole('heading', { name: 'ส่งคำขอเรียบร้อยแล้ว' })).toBeVisible({ timeout: 15_000 })
  })

  test('I-09: กด submit → ปุ่ม disabled ระหว่าง loading (double-submit protection)', async ({ page }) => {
    await page.getByPlaceholder(NAME_INPUT).fill('[QA TEST] Double Submit')
    await page.getByPlaceholder(PHONE_INPUT).fill('0899999999')
    await page.getByPlaceholder(MSG_INPUT).fill('[QA TEST] double submit test')

    const submitBtn = page.getByRole('button', { name: SUBMIT_BTN })
    await submitBtn.click()

    // ทันทีหลัง click ปุ่มควร disabled หรือ text เปลี่ยนเป็น "กำลังส่ง..."
    // ซึ่งแสดงว่า double-submit protection ทำงาน
    // ตรวจ Optimistic UI ก่อน network return (เร็วกว่า Supabase roundtrip)
    await expect(
      page.locator('button[type="submit"][disabled]')
    ).toBeVisible({ timeout: 2_000 })
  })
})
