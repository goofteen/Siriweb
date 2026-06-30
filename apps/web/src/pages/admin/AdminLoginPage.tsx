import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export default function AdminLoginPage() {
  const { session, signIn } = useAdminAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) navigate('/admin/products', { replace: true })
  }, [session, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(username, password)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      navigate('/admin/products', { replace: true })
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        {/* logo */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Siri Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">เข้าสู่ระบบจัดการร้าน</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
              ชื่อผู้ใช้
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              รหัสผ่าน
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </form>
      </div>
    </div>
  )
}
