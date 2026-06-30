import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Car, ChevronDown, ChevronUp } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SmartSearchBox } from '@/components/search/SmartSearchBox'
import { VehicleSelector, type VehicleSearchData } from '@/components/vehicle/VehicleSelector'
import { ProductGrid } from '@/components/product/ProductGrid'
import { useCategories } from '@/hooks/useCategories'
import { usePopularProducts } from '@/hooks/useProducts'
import { useGarage } from '@/contexts/GarageContext'
import { BrandLogo } from '@/components/vehicle/BrandLogo'
import heroPng from '@/assets/hero.png'

export default function HomePage() {
  usePageTitle()
  const navigate = useNavigate()
  const { primaryVehicle } = useGarage()
  const { data: categories = [] } = useCategories()
  const { data: popularRaw = [], isLoading: popularLoading } = usePopularProducts(8)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showOtherVehicle, setShowOtherVehicle] = useState(false)

  const popular = popularRaw.map((p) => ({
    ...p,
    product_inventory: p.product_inventory
      ? [p.product_inventory as unknown as { quantity: number }]
      : null,
  }))

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 8)

  function handleVehicleSearch({ brand, model, vehicleId }: VehicleSearchData) {
    if (vehicleId) {
      navigate(`/search?vehicle=${vehicleId}`)
    } else if (brand && model) {
      navigate(
        `/search?vehicle_brand=${encodeURIComponent(brand)}&vehicle_model=${encodeURIComponent(model)}`
      )
    } else if (brand) {
      navigate(`/search?q=${encodeURIComponent(brand)}`)
    } else {
      // ไม่เลือกอะไรเลย → แสดงสินค้าทั้งหมด
      navigate('/search')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* hero banner */}
      <div className="relative overflow-hidden">
        <img src={heroPng} alt="อะไหล่รถยนต์ญี่ปุ่น" className="h-52 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-background" />
        <div className="absolute inset-x-0 top-0 px-4 pt-7">
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            อะไหล่รถยนต์ญี่ปุ่น
          </h1>
          <p className="mt-0.5 text-sm text-white/75">ค้นหาด้วยรุ่นรถ ชื่อสินค้า หรือรหัสอะไหล่</p>
        </div>
      </div>

      {/* search box */}
      <div className="-mt-6 relative z-10 px-4">
        <div className="rounded-2xl border border-border bg-card px-3 py-3 shadow-lg">
          <SmartSearchBox />
        </div>
      </div>

      {/* vehicle section */}
      <div className="space-y-3 px-4 py-4">
        {/* กรณีมีรถ primary — แสดง chip + ปุ่มดูอะไหล่ */}
        {primaryVehicle && (
          <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <BrandLogo brand={primaryVehicle.brand} className="h-7 w-14 object-contain" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-accent">รถของคุณ</p>
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
        )}

        {/* Vehicle selector — collapse เมื่อมี primary vehicle */}
        {primaryVehicle ? (
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <button
              onClick={() => setShowOtherVehicle((s) => !s)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Car className="size-4 text-accent" />
                เลือกรุ่นอื่น
              </span>
              {showOtherVehicle ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            {showOtherVehicle && (
              <div className="border-t border-border px-4 pb-4 pt-3">
                <VehicleSelector showSearchButton onSearch={handleVehicleSearch} />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Car className="size-4 text-accent" />
              <span className="text-sm font-medium">เลือกรุ่นรถเพื่อหาอะไหล่ที่ใช้ได้</span>
            </div>
            <VehicleSelector showSearchButton onSearch={handleVehicleSearch} />
          </div>
        )}
      </div>

      {/* หมวดหมู่ */}
      {categories.length > 0 && (
        <section className="px-4 pb-5 pt-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">หมวดหมู่อะไหล่</h2>
            {categories.length > 8 && (
              <button
                onClick={() => setShowAllCategories((s) => !s)}
                className="flex items-center gap-1 text-sm font-medium text-accent"
              >
                {showAllCategories ? (
                  <>
                    ย่อลง <ChevronUp className="size-3.5" />
                  </>
                ) : (
                  <>
                    ดูทั้งหมด <ChevronDown className="size-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {displayedCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/search?category=${cat.id}`}
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

      {/* สินค้าขายดี */}
      <section className="px-4 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">สินค้าขายดี</h2>
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
