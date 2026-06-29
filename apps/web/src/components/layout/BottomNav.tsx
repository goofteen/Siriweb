import { NavLink } from 'react-router-dom'
import { Home, Search, Car, Heart } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useGarage } from '@/contexts/GarageContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'หน้าหลัก', end: true },
  { to: '/search', icon: Search, label: 'ค้นหา' },
  { to: '/garage', icon: Car, label: 'รถของฉัน' },
  { to: '/wishlist', icon: Heart, label: 'รายการโปรด' },
]

export function BottomNav() {
  const { items: wishlistItems } = useWishlist()
  const { vehicles: garageVehicles } = useGarage()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[56px] min-w-[56px] flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs transition-colors',
                isActive ? 'text-accent' : 'text-muted-foreground'
              )
            }
          >
            <div className="relative">
              <Icon className="size-5" strokeWidth={1.75} />
              {/* badge: wishlist count */}
              {to === '/wishlist' && wishlistItems.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                </span>
              )}
              {/* badge: garage has vehicles */}
              {to === '/garage' && garageVehicles.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 size-2 rounded-full bg-accent" />
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
