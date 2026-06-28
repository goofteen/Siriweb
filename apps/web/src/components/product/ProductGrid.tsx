import { ProductCard, ProductCardSkeleton, type ProductCardData } from './ProductCard'

interface ProductGridProps {
  products: ProductCardData[]
  isLoading?: boolean
  skeletonCount?: number
  emptyMessage?: string
}

export function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 6,
  emptyMessage = 'ไม่พบสินค้า',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
