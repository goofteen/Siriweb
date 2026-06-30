import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWishlist } from '@/contexts/WishlistContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProductCardData } from '@/components/product/ProductCard'

export default function WishlistPage() {
  usePageTitle('รายการโปรด')
  const { items, isLoading: wishlistLoading, removeFromWishlist } = useWishlist()

  // ดึงข้อมูลสินค้าจาก IDs ที่อยู่ใน wishlist
  const productIds = items.map((i) => i.productId)

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['wishlist-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return []
      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name_th, name_en, brand, price, category_id, product_images(url, is_primary), product_inventory(quantity)'
        )
        .in('id', productIds)
        .eq('is_active', true)
      if (error) throw error
      return (data ?? []) as unknown as ProductCardData[]
    },
    enabled: productIds.length > 0,
    staleTime: 60 * 1000,
  })

  const isLoading = wishlistLoading || productsLoading

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">รายการโปรด</h1>
        {!isLoading && items.length > 0 && (
          <p className="text-sm text-muted-foreground">{items.length} รายการ</p>
        )}
      </div>

      {/* empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Heart className="mb-3 size-12 text-muted-foreground/40" />
          <p className="font-medium">ยังไม่มีสินค้าในรายการโปรด</p>
          <p className="mt-1 text-sm text-muted-foreground">
            กดไอคอน ❤️ บนสินค้าเพื่อบันทึกไว้ดูทีหลัง
          </p>
          <Link
            to="/search"
            className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' mt-4'}
          >
            เริ่มค้นหาสินค้า
          </Link>
        </div>
      )}

      {/* loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border p-3">
              <Skeleton className="size-20 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* wishlist items */}
      {!isLoading && products.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const product = products.find((p) => p.id === item.productId)
            if (!product) return null

            const primaryImage =
              product.product_images?.find((img) => img.is_primary)?.url ??
              product.product_images?.[0]?.url ??
              null

            const inStock = (product.product_inventory?.[0]?.quantity ?? 0) > 0

            return (
              <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                <Link to={`/product/${product.id}`} className="shrink-0">
                  <div className="size-20 overflow-hidden rounded-lg bg-muted">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name_th}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-full bg-muted" />
                    )}
                  </div>
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <p className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
                        {product.name_th}
                      </p>
                    </Link>
                    {product.brand && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{product.brand}</p>
                    )}
                    {!inStock && <p className="mt-0.5 text-xs text-muted-foreground">สินค้าหมด</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="font-bold text-primary">
                      ฿{product.price.toLocaleString('th-TH')}
                    </p>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      aria-label="ลบออกจากรายการโปรด"
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
