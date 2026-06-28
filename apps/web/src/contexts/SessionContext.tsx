/**
 * SessionContext — สร้าง/เก็บ session ID ใน localStorage (อายุ 30 วัน)
 * session ID ใช้สำหรับ garage + wishlist ผ่าน RLS policy (x-session-id header)
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

const SESSION_KEY = 'siri_session_id'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 วัน

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function getOrCreateSessionId(): string {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      const { id, expiresAt } = JSON.parse(stored) as { id: string; expiresAt: number }
      if (Date.now() < expiresAt) return id
    }
  } catch {
    // localStorage อาจ throw ใน private browsing บาง browser
  }

  const id = generateSessionId()
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id, expiresAt: Date.now() + SESSION_TTL_MS })
    )
  } catch {
    // ถ้า write ไม่ได้ ใช้ in-memory session ชั่วคราว
  }
  return id
}

interface SessionContextValue {
  sessionId: string
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(getOrCreateSessionId)

  return <SessionContext.Provider value={{ sessionId }}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession ต้องใช้ภายใน SessionProvider')
  return ctx
}
