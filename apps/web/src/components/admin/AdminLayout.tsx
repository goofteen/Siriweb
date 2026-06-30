import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronDown,
  List,
  Tag,
  Car,
  Building2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'

const productSubItems = [
  { to: '/admin/products', icon: List, label: 'สินค้าทั้งหมด' },
  { to: '/admin/categories', icon: Tag, label: 'หมวดสินค้า' },
  { to: '/admin/vehicles', icon: Car, label: 'รุ่นรถ' },
]

export function AdminLayout() {
  const { session, signOut } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isProductsSection =
    location.pathname.startsWith('/admin/products') ||
    location.pathname.startsWith('/admin/categories') ||
    location.pathname.startsWith('/admin/vehicles')

  const [productsOpen, setProductsOpen] = useState(isProductsSection)

  useEffect(() => {
    if (isProductsSection) setProductsOpen(true)
  }, [isProductsSection])

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  const NavContent = () => (
    <>
      {/* logo */}
      <NavLink
        to="/admin/products"
        className="flex items-center gap-2.5 px-5 py-5 hover:opacity-80 transition-opacity"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Package className="size-4" />
        </div>
        <span className="font-bold">Siri Admin</span>
      </NavLink>

      {/* nav items */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {/* จัดการสินค้า — collapsible */}
        <div>
          <button
            onClick={() => setProductsOpen((o) => !o)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isProductsSection
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Package className="size-4 shrink-0" />
            <span className="flex-1 text-left">จัดการสินค้า</span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 transition-transform duration-200',
                productsOpen && 'rotate-180'
              )}
            />
          </button>

          {productsOpen && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border pl-3">
              {productSubItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <Icon className="size-3.5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* สาขา */}
        <NavLink
          to="/admin/branches"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <Building2 className="size-4 shrink-0" />
          สาขา
        </NavLink>

        {/* คำขอจากลูกค้า */}
        <NavLink
          to="/admin/inquiries"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )
          }
        >
          <ClipboardList className="size-4 shrink-0" />
          คำขอจากลูกค้า
        </NavLink>
      </nav>

      {/* user + logout */}
      <div className="border-t border-border px-3 py-4">
        <div className="mb-2 px-3 text-xs text-muted-foreground truncate">
          {session?.user.email}
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          ออกจากระบบ
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-dvh">
      {/* desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <NavContent />
      </aside>

      {/* mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-card transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="ปิดเมนู"
        >
          <X className="size-4" />
        </button>
        <NavContent />
      </aside>

      {/* main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="เปิดเมนู"
          >
            <Menu className="size-5" />
          </button>
          <NavLink to="/admin/products" className="font-bold hover:opacity-80 transition-opacity">
            Siri Admin
          </NavLink>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
