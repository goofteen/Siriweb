import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useGarage } from '@/contexts/GarageContext'
import { cn } from '@/lib/utils'

interface HeaderProps {
  /** ซ่อน search icon ในหน้า search (เพราะมี search box อยู่แล้ว) */
  hideSearchIcon?: boolean
}

export function Header({ hideSearchIcon = false }: HeaderProps) {
  const navigate = useNavigate()
  const { primaryVehicle } = useGarage()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        {/* logo */}
        <Link to="/" className="flex items-center gap-1.5">
          <span className="text-xl font-bold tracking-tight text-primary">Siri</span>
          <span className="text-xl font-light text-foreground">อะไหล่</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* active vehicle chip */}
          {primaryVehicle && (
            <Link
              to="/garage"
              className={cn(
                'flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1',
                'text-xs font-medium text-green-800 transition-colors hover:bg-green-100'
              )}
            >
              <span className="size-1.5 rounded-full bg-green-500" />
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
