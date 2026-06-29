import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useWishlist } from '@/contexts/WishlistContext'
import { useGarage } from '@/contexts/GarageContext'
import { cn } from '@/lib/utils'

export interface ProductCardData {
  id: number
  name_th: string
  brand: string | null
  price: number
  category_id: number | null
  product_images: Array<{ url: string; is_primary: boolean | null }> | null
  product_inventory: Array<{ quantity: number }> | null
  /** vehicle IDs ที่สินค้าใช้ได้ — optional, สำหรับแสดง "ใช้กับรถคุณได้" */
  vehicleIds?: number[]
}

interface ProductCardProps {
  product: ProductCardData
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { primaryVehicle } = useGarage()

  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.url ??
    product.product_images?.[0]?.url ??
    null

  const inStock = (product.product_inventory?.[0]?.quantity ?? 0) > 0
  const inWishlist = isInWishlist(product.id)

  // แสดง badge "ใช้กับรถคุณได้" เมื่อ primary vehicle อยู่ใน vehicleIds
  const fitsMyVehicle =
    primaryVehicle !== null && (product.vehicleIds?.includes(primaryVehicle.id) ?? false)

  return (
    <div className="group relative rounded-xl border border-border bg-card transition-all hover:border-l-2 hover:border-l-accent hover:shadow-md">
      {/* wishlist button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          toggleWishlist(product.id)
        }}
        aria-label={inWishlist ? 'ลบออกจากรายการโปรด' : 'บันทึกในรายการโปรด'}
        className={cn(
          'absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full',
          'transition-colors',
          inWishlist
            ? 'bg-primary text-primary-foreground'
            : 'bg-background/80 text-muted-foreground backdrop-blur hover:text-primary'
        )}
      >
        <Heart className={cn('size-4', inWishlist && 'fill-current')} />
      </button>

      <Link to={`/product/${product.id}`} className="block">
        {/* รูปสินค้า */}
        <div className="aspect-square overflow-hidden rounded-t-xl bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name_th}
              loading="lazy"
              className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/30">
              <svg className="size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* ข้อมูลสินค้า */}
        <div className="p-3">
          {/* badges */}
          <div className="mb-1.5 flex flex-wrap gap-1">
            {fitsMyVehicle && (
              <Badge
                variant="default"
                className="bg-accent text-xs text-accent-foreground hover:bg-accent/90"
              >
                ใช้กับรถคุณได้
              </Badge>
            )}
            {!inStock && (
              <Badge variant="secondary" className="text-xs">
                สินค้าหมด
              </Badge>
            )}
          </div>

          {/* ชื่อสินค้า */}
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">
            {product.name_th}
          </p>

          {/* ยี่ห้อ */}
          {product.brand && (
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </p>
          )}

          {/* ราคา */}
          <p className="mt-2 text-base font-bold text-primary">
            ฿{product.price.toLocaleString('th-TH')}
          </p>
        </div>
      </Link>
    </div>
  )
}

// Skeleton variant สำหรับ loading state
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Skeleton className="aspect-square rounded-t-xl rounded-b-none" />
      <div className="p-3">
        <Skeleton className="mb-2 h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
        <Skeleton className="mt-2 h-5 w-20" />
      </div>
    </div>
  )
}
