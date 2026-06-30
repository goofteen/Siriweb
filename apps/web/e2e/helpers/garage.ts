/**
 * Garage helpers — reusable actions for vehicle garage tests
 */
import type { Page } from '@playwright/test'

/**
 * เพิ่มรถผ่าน VehicleSelector cascade dropdowns
 * - ถ้า selector ยังไม่แสดง จะคลิกปุ่ม "เพิ่มรถ" (exact) หรือ "เพิ่มรถคันแรก" ก่อน
 * - ใช้ exact: true เพื่อไม่ match "เพิ่มรถคันแรก" ด้วย
 */
export async function addVehicle(
  page: Page,
  brand: string,
  model: string
): Promise<void> {
  // ตรวจว่า VehicleSelector (combobox) แสดงอยู่แล้วหรือยัง
  const brandCombobox = page.getByRole('combobox').first()
  const selectorVisible = await brandCombobox.isVisible().catch(() => false)

  if (!selectorVisible) {
    // พยายามคลิกปุ่ม "เพิ่มรถ" (exact match) ก่อน
    const addBtn = page.getByRole('button', { name: 'เพิ่มรถ', exact: true })
    const firstTimeBtn = page.getByRole('button', { name: 'เพิ่มรถคันแรก' })

    const addVisible = await addBtn.isVisible().catch(() => false)
    if (addVisible) {
      await addBtn.click()
    } else {
      await firstTimeBtn.click()
    }

    // รอ combobox ปรากฏ
    await brandCombobox.waitFor({ state: 'visible', timeout: 5_000 })
  }

  // เลือกยี่ห้อ (brand)
  await brandCombobox.click()
  await page.getByRole('option', { name: brand }).click()

  // เลือกรุ่น (model) — รอให้โหลดก่อน
  const modelCombobox = page.getByRole('combobox').nth(1)
  await modelCombobox.click()
  await page.getByRole('option', { name: model }).click()

  // เลือกปีแรกที่มีใน dropdown
  const yearCombobox = page.getByRole('combobox').nth(2)
  await yearCombobox.click()
  await page.getByRole('option').first().click()
}

/**
 * ล้างโรงรถทั้งหมดผ่าน localStorage
 */
export async function clearGarage(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.removeItem('siri_garage'))
}

/**
 * ตรวจว่ามีรถกี่คันในโรงรถผ่าน localStorage
 */
export async function getGarageCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('siri_garage')
    if (!raw) return 0
    try {
      const data = JSON.parse(raw)
      return Array.isArray(data.vehicles) ? data.vehicles.length : 0
    } catch {
      return 0
    }
  })
}
