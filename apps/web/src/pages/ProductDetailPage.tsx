import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Heart, Car, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ContactStoreSheet } from '@/components/inquiry/ContactStoreButton'
import { useProductDetail } from '@/hooks/useProducts'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useWishlist } from '@/contexts/WishlistContext'
import { useGarage } from '@/contexts/GarageContext'
import { BrandLogo } from '@/components/vehicle/BrandLogo'
import { cn } from '@/lib/utils'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = id ? Number(id) : undefined

  const { data: product, isLoading, error } = useProductDetail(productId)
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { primaryVehicle } = useGarage()

  usePageTitle(product?.name_th)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)

  if (isLoading) return <ProductDetailSkeleton />

  if (error || !product) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-medium">ไม่พบสินค้านี้</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          กลับหน้าหลัก
        </Link>
      </div>
    )
  }

  const images =
    product.product_images?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? []
  const activeImage = images[activeImageIdx]?.url ?? null
  const inventory = product.product_inventory as {
    quantity: number
    warehouse_code: string | null
  } | null
  const inStock = (inventory?.quantity ?? 0) > 0
  const inWishlist = isInWishlist(product.id)

  // ตรวจว่า primary vehicle ใช้ได้กับสินค้านี้ไหม
  const compatibleVehicles =
    product.product_vehicles?.map((pv) => pv.vehicles).filter(Boolean) ?? []
  const fitsMyVehicle =
    primaryVehicle !== null && compatibleVehicles.some((v) => v && v.id === primaryVehicle.id)

  return (
    <div className="mx-auto max-w-5xl pb-32">
      {/* breadcrumb */}
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 text-sm text-muted-foreground">
        <Link to="/" className="shrink-0 hover:text-foreground">
          หน้าหลัก
        </Link>
        {product.product_categories && (
          <>
            <ChevronRight className="size-3.5 shrink-0" />
            <Link
              to={`/search?category=${product.product_categories.id}`}
              className="shrink-0 hover:text-foreground"
            >
              {product.product_categories.name_th}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="truncate text-foreground">{product.name_th}</span>
      </div>

      {/* รูปสินค้า */}
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex gap-3">
          {/* thumbnail strip — ด้านซ้าย */}
          {images.length > 1 && (
            <div className="flex shrink-0 flex-col gap-2 overflow-y-auto max-h-[540px]">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(i)}
                  className={cn(
                    'aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                    i === activeImageIdx ? 'border-primary' : 'border-border'
                  )}
                >
                  <img src={img.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* รูปหลัก */}
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-muted aspect-[4/3] max-h-[540px]">
            {activeImage ? (
              <img src={activeImage} alt={product.name_th} className="size-full object-contain" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package className="size-16 text-muted-foreground/30" />
              </div>
            )}

            {/* ปุ่มเปลี่ยนรูป ซ้าย/ขวา */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImageIdx((prev) => (prev - 1 + images.length) % images.length)
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                  aria-label="รูปก่อนหน้า"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={() => setActiveImageIdx((prev) => (prev + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                  aria-label="รูปถัดไป"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ข้อมูลหลัก */}
      <div className="px-4 py-4">
        {/* badges */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {fitsMyVehicle && (
            <Badge className="bg-green-600 hover:bg-green-700">ใช้กับรถคุณได้</Badge>
          )}
          <Badge variant={inStock ? 'secondary' : 'outline'}>
            {inStock ? 'มีสินค้า' : 'สินค้าหมด'}
          </Badge>
          {product.oem_part_number && <Badge variant="outline">OEM</Badge>}
        </div>

        <h1 className="text-xl font-bold leading-snug">{product.name_th}</h1>
        {product.name_en && (
          <p className="mt-0.5 text-sm text-muted-foreground">{product.name_en}</p>
        )}

        {/* brand + SKU */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {product.brand && (
            <span>
              ยี่ห้อ: <span className="text-foreground">{product.brand}</span>
            </span>
          )}
          <span>
            SKU: <span className="font-mono text-foreground">{product.sku}</span>
          </span>
          {product.oem_part_number && (
            <span>
              OEM: <span className="font-mono text-foreground">{product.oem_part_number}</span>
            </span>
          )}
        </div>

        {/* ราคา */}
        <p className="mt-4 text-3xl font-bold text-primary">
          ฿{product.price.toLocaleString('th-TH')}
        </p>

        {/* description */}
        {product.description_th && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {product.description_th}
          </p>
        )}
      </div>

      {/* รถที่ใช้ได้ */}
      {compatibleVehicles.length > 0 && (
        <div className="border-t border-border px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Car className="size-4 text-primary" />
            <h2 className="font-medium">รุ่นรถที่ใช้ได้</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {compatibleVehicles.slice(0, 10).map((v) =>
              v ? (
                <Badge
                  key={v.id}
                  variant="outline"
                  className={cn(
                    primaryVehicle?.id === v.id && 'border-green-500 bg-green-50 text-green-800'
                  )}
                >
                  <BrandLogo
                    brand={v.brand}
                    className="mr-0.5 inline h-3.5 w-7 object-contain align-middle"
                  />
                  {v.brand} {v.model} {v.year_from}
                  {v.year_to ? `–${String(v.year_to).slice(-2)}` : '+'}
                </Badge>
              ) : null
            )}
            {compatibleVehicles.length > 10 && (
              <Badge variant="outline">+{compatibleVehicles.length - 10} รุ่น</Badge>
            )}
          </div>
        </div>
      )}

      {/* bottom action bar */}
      <div className="sticky bottom-16 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleWishlist(product.id)}
            aria-label={inWishlist ? 'ลบจากรายการโปรด' : 'บันทึกในรายการโปรด'}
            className="shrink-0"
          >
            <Heart className={cn('size-5', inWishlist && 'fill-primary text-primary')} />
          </Button>
          <Button className="flex-1" onClick={() => setContactOpen(true)} disabled={!inStock}>
            {inStock ? 'ติดต่อสั่งซื้อ' : 'สินค้าหมดชั่วคราว'}
          </Button>
        </div>
      </div>

      <ContactStoreSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        productId={product.id}
        productName={product.name_th}
      />
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <Skeleton className="mb-4 h-4 w-48" />
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
