import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export function AdminProtectedRoute() {
  const { session, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
