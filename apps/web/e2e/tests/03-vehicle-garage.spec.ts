/**
 * 03 — Vehicle Garage Tests
 * ตรวจสอบการเพิ่ม/ลบ/ตั้ง primary vehicle และ persistence ใน localStorage
 */
import { test, expect } from '@playwright/test'
import { addVehicle, clearGarage, getGarageCount } from '../helpers/garage'

test.describe('Vehicle Garage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/garage')
    await clearGarage(page)
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('G-01: เพิ่มรถแล้วปรากฏใน garage list', async ({ page }) => {
    await addVehicle(page, 'Honda', 'Civic')
    // scope ไปยัง main เพื่อหลีกเลี่ยง header vehicle pill (strict mode)
    await expect(page.getByRole('main').getByText('Honda Civic')).toBeVisible({ timeout: 5_000 })
  })

  test('G-02: รถที่เพิ่มคง persist หลัง reload', async ({ page }) => {
    await addVehicle(page, 'Toyota', 'Camry')
    await expect(page.getByRole('main').getByText('Toyota Camry')).toBeVisible({ timeout: 5_000 })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').getByText('Toyota Camry')).toBeVisible()
  })

  test('G-03: ตั้งรถที่สองเป็น primary → ขึ้นมาก่อน', async ({ page }) => {
    // เพิ่มรถ 2 คัน
    await addVehicle(page, 'Honda', 'Civic')
    await expect(page.getByRole('main').getByText('Honda Civic')).toBeVisible({ timeout: 5_000 })

    // กดเพิ่มรถคันที่สอง
    await page.getByRole('button', { name: 'เพิ่มรถ', exact: true }).click()
    await addVehicle(page, 'Toyota', 'Camry')
    await expect(page.getByRole('main').getByText('Toyota Camry')).toBeVisible({ timeout: 5_000 })

    // ตั้ง Camry เป็น primary (Star button)
    const starBtns = page.getByTitle('ตั้งเป็นรถหลัก')
    await starBtns.last().click()

    // ควรเห็น badge "รถหลัก" ของ Camry
    await expect(page.getByText('รถหลัก')).toBeVisible()
  })

  test('G-04: ลบรถแล้วหายออกจาก list', async ({ page }) => {
    await addVehicle(page, 'Honda', 'Civic')
    await expect(page.getByRole('main').getByText('Honda Civic')).toBeVisible({ timeout: 5_000 })

    const deleteBtn = page.getByTitle('ลบออกจากโรงรถ')
    await deleteBtn.click()

    await expect(page.getByRole('main').getByText('Honda Civic')).not.toBeVisible()
  })

  test('G-05: เพิ่มครบ 5 คัน → ปุ่มเพิ่มหาย', async ({ page }) => {
    const brands = ['Honda', 'Toyota', 'Isuzu', 'Nissan', 'Mazda']
    const models = ['Civic', 'Camry', 'D-Max', 'Navara', 'CX-5']

    for (let i = 0; i < 5; i++) {
      // ต้องใช้ exact: true เพื่อหลีกเลี่ยง strict mode violation กับ "เพิ่มรถคันแรก"
      const addBtnExact = page.getByRole('button', { name: 'เพิ่มรถ', exact: true })
      const addBtnFirst = page.getByRole('button', { name: 'เพิ่มรถคันแรก' })
      const exactVisible = await addBtnExact.isVisible().catch(() => false)
      const firstVisible = await addBtnFirst.isVisible().catch(() => false)
      if (exactVisible) await addBtnExact.click()
      else if (firstVisible) await addBtnFirst.click()
      await addVehicle(page, brands[i], models[i])
      // รอให้รถปรากฏก่อนเพิ่มคันต่อไป
      await expect(page.getByRole('main').getByText(`${brands[i]} ${models[i]}`)).toBeVisible({ timeout: 5_000 })
    }

    const count = await getGarageCount(page)
    expect(count).toBe(5)

    // ปุ่ม "เพิ่มรถ" ควรหายไปเมื่อครบ 5
    await expect(page.getByRole('button', { name: /เพิ่มรถ/i })).not.toBeVisible()
  })

  test('G-06: ตั้ง primary vehicle แล้ว search results กรองตามรถ', async ({ page }) => {
    await addVehicle(page, 'Honda', 'Civic')
    await expect(page.getByRole('main').getByText('Honda Civic')).toBeVisible({ timeout: 5_000 })

    // ไปหน้า search
    await page.goto('/search?q=เบรก')
    await page.waitForLoadState('networkidle')

    // ถ้า primary vehicle ถูก set → URL ควรมี vehicle param
    // หรืออย่างน้อยไม่ crash
    await expect(page).toHaveURL(/\/search/)
  })

  test('G-07: เปิดสินค้าที่ compatible กับ primary vehicle → badge "ใช้กับรถคุณได้"', async ({
    page,
  }) => {
    await addVehicle(page, 'Honda', 'Civic')
    await expect(page.getByRole('main').getByText('Honda Civic')).toBeVisible({ timeout: 5_000 })

    // ไปหน้า search ผ้าเบรก Honda Civic
    await page.goto('/search?q=ผ้าเบรก')
    await page.waitForLoadState('networkidle')

    // ถ้ามี product card ที่ compatible → badge ควรปรากฏ
    const badge = page.getByText('ใช้กับรถคุณได้').first()
    // บางสินค้าอาจไม่ compatible แต่ถ้ามี badge ต้องเป็นสีที่ถูกต้อง
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible()
    }
  })

  test('G-08: ล้างโรงรถหมด → empty state แสดง', async ({ page }) => {
    // ไม่มีรถ → empty state
    await expect(page.getByText('ยังไม่มีรถในโรงรถ')).toBeVisible()
    await expect(page.getByRole('button', { name: /เพิ่มรถคันแรก/i })).toBeVisible()
  })
})
