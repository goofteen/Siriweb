import { Link, useNavigate } from 'react-router-dom'
import { Car } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SmartSearchBox } from '@/components/search/SmartSearchBox'
import { VehicleSelector } from '@/components/vehicle/VehicleSelector'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useCategories } from '@/hooks/useCategories'
import { usePopularProducts } from '@/hooks/useProducts'
import { useGarage } from '@/contexts/GarageContext'
import heroPng from '@/assets/hero.png'

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

  function handleVehicleSelect(
    vehicleId: number,
    info: { brand: string; model: string; year: number }
  ) {
    addVehicle({ id: vehicleId, ...info })
    navigate(`/search?vehicle=${vehicleId}`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* hero banner */}
      <div className="relative overflow-hidden">
        <img src={heroPng} alt="อะไหล่รถยนต์ญี่ปุ่น" className="h-56 w-full object-cover" />
        {/* dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* hero content overlaid on image */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-5 pt-8">
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-white drop-shadow">
            อะไหล่รถยนต์ญี่ปุ่น
          </h1>
          <p className="mb-4 text-sm text-white/80">ค้นหาด้วยรุ่นรถ ชื่อสินค้า หรือรหัสอะไหล่</p>
          <SmartSearchBox className="mb-0" />
        </div>
      </div>

      {/* vehicle selector / primary vehicle chip */}
      <div className="px-4 py-4">
        {!primaryVehicle && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Car className="size-4 text-accent" />
              <span className="text-sm font-medium">เลือกรุ่นรถเพื่อหาอะไหล่ที่ใช้ได้</span>
            </div>
            <VehicleSelector onSelect={handleVehicleSelect} />
          </div>
        )}

        {primaryVehicle && (
          <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">รถของคุณ</p>
              <p className="font-semibold text-foreground">
                {primaryVehicle.brand} {primaryVehicle.model} {primaryVehicle.year}
              </p>
            </div>
            <Link
              to={`/search?vehicle=${primaryVehicle.id}`}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              ดูอะไหล่
            </Link>
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
