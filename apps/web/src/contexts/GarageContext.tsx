/**
 * GarageContext — รายการรถที่ลูกค้าเก็บไว้ (localStorage 30 วัน)
 * primary vehicle ใช้สำหรับ filter สินค้าอัตโนมัติ
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const GARAGE_KEY = 'siri_garage'
const GARAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface GarageVehicle {
  id: number
  brand: string
  model: string
  year: number
  nickname?: string
  savedAt: number
}

interface GarageContextValue {
  vehicles: GarageVehicle[]
  primaryVehicle: GarageVehicle | null
  addVehicle: (vehicle: Omit<GarageVehicle, 'savedAt'>) => void
  removeVehicle: (id: number) => void
  setPrimary: (id: number) => void
  clearGarage: () => void
}

const GarageContext = createContext<GarageContextValue | null>(null)

function loadGarage(): GarageVehicle[] {
  try {
    const raw = localStorage.getItem(GARAGE_KEY)
    if (!raw) return []
    const { vehicles, expiresAt } = JSON.parse(raw) as {
      vehicles: GarageVehicle[]
      expiresAt: number
    }
    if (Date.now() > expiresAt) {
      localStorage.removeItem(GARAGE_KEY)
      return []
    }
    return vehicles
  } catch {
    return []
  }
}

function saveGarage(vehicles: GarageVehicle[]) {
  try {
    localStorage.setItem(
      GARAGE_KEY,
      JSON.stringify({ vehicles, expiresAt: Date.now() + GARAGE_TTL_MS })
    )
  } catch {
    // ignore write errors
  }
}

export function GarageProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>(loadGarage)

  useEffect(() => {
    saveGarage(vehicles)
  }, [vehicles])

  const addVehicle = useCallback((v: Omit<GarageVehicle, 'savedAt'>) => {
    setVehicles((prev) => {
      // ไม่เพิ่มซ้ำ (vehicle_id เดียวกัน)
      if (prev.some((x) => x.id === v.id)) return prev
      const next = [...prev, { ...v, savedAt: Date.now() }]
      return next
    })
  }, [])

  const removeVehicle = useCallback((id: number) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const setPrimary = useCallback((id: number) => {
    setVehicles((prev) => {
      // เลื่อนรถที่เลือกมาไว้หัวสุด (index 0 = primary)
      const idx = prev.findIndex((v) => v.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      const [selected] = next.splice(idx, 1)
      return [selected, ...next]
    })
  }, [])

  const clearGarage = useCallback(() => {
    setVehicles([])
    try {
      localStorage.removeItem(GARAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const primaryVehicle = vehicles[0] ?? null

  return (
    <GarageContext.Provider
      value={{ vehicles, primaryVehicle, addVehicle, removeVehicle, setPrimary, clearGarage }}
    >
      {children}
    </GarageContext.Provider>
  )
}

export function useGarage(): GarageContextValue {
  const ctx = useContext(GarageContext)
  if (!ctx) throw new Error('useGarage ต้องใช้ภายใน GarageProvider')
  return ctx
}
