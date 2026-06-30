import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useGarage } from '@/contexts/GarageContext'
import { BrandLogo } from '@/components/vehicle/BrandLogo'
import { cn } from '@/lib/utils'

// routes ที่เป็น main navigation — ไม่แสดงปุ่ม back
const ROOT_ROUTES = new Set(['/', '/search', '/garage', '/wishlist', '/inquiry'])

interface HeaderProps {
  /** ซ่อน search icon ในหน้า search (เพราะมี search box อยู่แล้ว) */
  hideSearchIcon?: boolean
}

export function Header({ hideSearchIcon = false }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { primaryVehicle } = useGarage()

  const isRootRoute = ROOT_ROUTES.has(location.pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        {/* left: back button on nested routes, logo on root */}
        {isRootRoute ? (
          <Link to="/" className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-primary">Siri</span>
            <span className="text-xl font-light text-foreground">อะไหล่</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              aria-label="กลับ"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
            <Link to="/" className="flex items-center gap-1">
              <span className="text-lg font-bold tracking-tight text-primary">Siri</span>
              <span className="text-lg font-light text-foreground">อะไหล่</span>
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* active vehicle chip — root routes only (ไม่ซ้ำกับ back button) */}
          {primaryVehicle && isRootRoute && (
            <Link
              to="/garage"
              className={cn(
                'flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1',
                'text-xs font-medium text-foreground transition-colors hover:bg-accent/20'
              )}
            >
              <BrandLogo brand={primaryVehicle.brand} className="h-3.5 w-7 object-contain" />
              {primaryVehicle.brand} {primaryVehicle.model}
            </Link>
          )}

          {/* search shortcut */}
          {!hideSearchIcon && (
            <button
              onClick={() => navigate('/search')}
              aria-label="ค้นหาสินค้า"
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Search className="size-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
