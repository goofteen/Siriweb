import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AdminAuthContextValue {
  session: Session | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(username: string, password: string) {
    const email = `${username}@siri.internal`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AdminAuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
