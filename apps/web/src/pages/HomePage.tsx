import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SmartSearchBox } from '@/components/search/SmartSearchBox'
import { VehicleSelector } from '@/components/vehicle/VehicleSelector'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useCategories } from '@/hooks/useCategories'
import { usePopularProducts } from '@/hooks/useProducts'
import { useGarage } from '@/contexts/GarageContext'
import { BrandLogo } from '@/components/vehicle/BrandLogo'
import heroPng from '@/assets/hero.png'

interface PendingVehicle {
  id: number
  brand: string
  model: string
  year: number
}

export default function HomePage() {
  usePageTitle()
  const navigate = useNavigate()
  const { addVehicle, primaryVehicle } = useGarage()
  const { data: categories = [] } = useCategories()
  const { data: popularRaw = [], isLoading: popularLoading } = usePopularProducts(8)
  const popular = popularRaw.map((p) => ({
    ...p,
    product_inventory: p.product_inventory
      ? [p.product_inventory as unknown as { quantity: number }]
      : null,
  }))

  // รถที่เลือกแล้วแต่ยังไม่ได้ตัดสินใจว่าจะ save หรือไม่
  const [pendingVehicle, setPendingVehicle] = useState<PendingVehicle | null>(null)

  function handleVehicleSelect(
    vehicleId: number,
    info: { brand: string; model: string; year: number }
  ) {
    // ไม่ auto-save — ตั้งเป็น pending ให้ลูกค้าตัดสินใจก่อน
    setPendingVehicle({ id: vehicleId, ...info })
  }

  function handleSaveAndView() {
    if (!pendingVehicle) return
    addVehicle(pendingVehicle)
    navigate(`/search?vehicle=${pendingVehicle.id}`)
    setPendingVehicle(null)
  }

  function handleViewOnly() {
    if (!pendingVehicle) return
    navigate(`/search?vehicle=${pendingVehicle.id}`)
    setPendingVehicle(null)
  }

  function handleCancelPending() {
    setPendingVehicle(null)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* hero banner */}
      <div className="relative overflow-hidden">
        <img src={heroPng} alt="อะไหล่รถยนต์ญี่ปุ่น" className="h-52 w-full object-cover" />
        {/* gradient: dark top for text legibility, fades to page bg at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-background" />
        <div className="absolute inset-x-0 top-0 px-4 pt-7">
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            อะไหล่รถยนต์ญี่ปุ่น
          </h1>
          <p className="mt-0.5 text-sm text-white/75">ค้นหาด้วยรุ่นรถ ชื่อสินค้า หรือรหัสอะไหล่</p>
        </div>
      </div>

      {/* search box — sits below hero, clean white card, no overlap ambiguity */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="rounded-2xl border border-border bg-card px-3 py-3 shadow-lg">
          <SmartSearchBox />
        </div>
      </div>

      {/* vehicle selector / primary vehicle chip */}
      <div className="px-4 py-4 space-y-3">
        {/* กรณียังไม่มีรถ primary และไม่มี pending */}
        {!primaryVehicle && !pendingVehicle && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Car className="size-4 text-accent" />
              <span className="text-sm font-medium">เลือกรุ่นรถเพื่อหาอะไหล่ที่ใช้ได้</span>
            </div>
            <VehicleSelector onSelect={handleVehicleSelect} />
          </div>
        )}

        {/* กรณีมีรถ primary อยู่แล้ว (และไม่มี pending) */}
        {primaryVehicle && !pendingVehicle && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <BrandLogo brand={primaryVehicle.brand} className="h-7 w-14 object-contain" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    รถของคุณ
                  </p>
                  <p className="font-semibold text-foreground">
                    {primaryVehicle.brand} {primaryVehicle.model} {primaryVehicle.year}
                  </p>
                </div>
              </div>
              <Link
                to={`/search?vehicle=${primaryVehicle.id}`}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                ดูอะไหล่
              </Link>
            </div>

            {/* VehicleSelector แสดงตลอดเพื่อให้เลือกรุ่นอื่นได้ทันที */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Car className="size-4 text-accent" />
                <span className="text-sm font-medium">เลือกรุ่นอื่น</span>
              </div>
              <VehicleSelector onSelect={handleVehicleSelect} />
            </div>
          </div>
        )}

        {/* กรณีเลือกรถแล้ว — รอการตัดสินใจว่าจะ save หรือไม่ */}
        {pendingVehicle && (
          <div className="rounded-xl border border-accent/30 bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
                <Car className="size-4 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รถที่เลือก</p>
                <p className="font-semibold text-foreground">
                  {pendingVehicle.brand} {pendingVehicle.model} {pendingVehicle.year}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              บันทึกรถคันนี้ไว้ใน Garage ของคุณไหม? (สามารถใช้ filter อะไหล่ได้ง่ายขึ้น)
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveAndView}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                บันทึกรถ + ดูอะไหล่
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleViewOnly}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  ดูอะไหล่เลย (ไม่บันทึก)
                </button>
                <button
                  onClick={handleCancelPending}
                  className="rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* หมวดหมู่ */}
      {categories.length > 0 && (
        <section className="px-4 py-2 pb-5">
          <h2 className="mb-3 text-base font-semibold">หมวดหมู่อะไหล่</h2>
          <div className="grid grid-cols-5 gap-2">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 text-center transition-colors hover:border-accent/40 hover:bg-accent/5"
              >
                {cat.icon ? (
                  <span className="text-2xl">{cat.icon}</span>
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-xs font-bold">{cat.name_th.slice(0, 2)}</span>
                  </div>
                )}
                <span className="line-clamp-2 text-xs leading-tight">{cat.name_th}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* สินค้าล่าสุด */}
      <section className="px-4 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">สินค้าใหม่</h2>
          <Link to="/search" className="text-sm font-medium text-accent hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        <ProductGrid
          products={popular}
          isLoading={popularLoading}
          skeletonCount={4}
          emptyMessage="ยังไม่มีสินค้า"
        />
      </section>
    </div>
  )
}
