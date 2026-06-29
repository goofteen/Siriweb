import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Car, Plus, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VehicleSelector } from '@/components/vehicle/VehicleSelector'
import { useGarage, type GarageVehicle } from '@/contexts/GarageContext'
import { BrandLogo } from '@/components/vehicle/BrandLogo'
import { cn } from '@/lib/utils'

export default function GaragePage() {
  usePageTitle('รถของฉัน')
  const navigate = useNavigate()
  const { vehicles, primaryVehicle, addVehicle, removeVehicle, setPrimary } = useGarage()
  const [showSelector, setShowSelector] = useState(false)

  function handleVehicleSelect(
    vehicleId: number,
    info: { brand: string; model: string; year: number }
  ) {
    addVehicle({ id: vehicleId, ...info })
    setShowSelector(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">รถของฉัน</h1>
          <p className="text-sm text-muted-foreground">เพิ่มรถเพื่อหาอะไหล่ที่ใช้ได้ทันที</p>
        </div>
        {vehicles.length < 5 && (
          <Button size="sm" variant="outline" onClick={() => setShowSelector((s) => !s)}>
            <Plus className="mr-1 size-4" />
            เพิ่มรถ
          </Button>
        )}
      </div>

      {/* vehicle selector */}
      {showSelector && (
        <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium">เลือกรุ่นรถที่ต้องการเพิ่ม</p>
          <VehicleSelector onSelect={handleVehicleSelect} />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowSelector(false)}>
            ยกเลิก
          </Button>
        </div>
      )}

      {/* empty state */}
      {vehicles.length === 0 && !showSelector && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Car className="mb-3 size-12 text-muted-foreground/40" />
          <p className="font-medium">ยังไม่มีรถในโรงรถ</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เพิ่มรถเพื่อดูอะไหล่ที่ใช้ได้กับรถคุณ
          </p>
          <Button className="mt-4" onClick={() => setShowSelector(true)}>
            <Plus className="mr-2 size-4" />
            เพิ่มรถคันแรก
          </Button>
        </div>
      )}

      {/* vehicle list */}
      {vehicles.length > 0 && (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              isPrimary={primaryVehicle?.id === v.id}
              onSetPrimary={() => setPrimary(v.id)}
              onRemove={() => removeVehicle(v.id)}
              onBrowse={() => navigate(`/search?vehicle=${v.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface VehicleCardProps {
  vehicle: GarageVehicle
  isPrimary: boolean
  onSetPrimary: () => void
  onRemove: () => void
  onBrowse: () => void
}

function VehicleCard({ vehicle, isPrimary, onSetPrimary, onRemove, onBrowse }: VehicleCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-shadow',
        isPrimary ? 'border-primary/40 shadow-sm' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          {isPrimary && (
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
              <Star className="size-3 fill-current" />
              รถหลัก
            </div>
          )}
          <div className="mb-1">
            <BrandLogo brand={vehicle.brand} className="h-5 w-12 object-contain" />
          </div>
          <p className="font-semibold">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="text-sm text-muted-foreground">ปี {vehicle.year}</p>
          {vehicle.nickname && (
            <p className="mt-0.5 text-xs text-muted-foreground">"{vehicle.nickname}"</p>
          )}
        </div>

        <div className="flex gap-1">
          {!isPrimary && (
            <button
              onClick={onSetPrimary}
              title="ตั้งเป็นรถหลัก"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Star className="size-4" />
            </button>
          )}
          <button
            onClick={onRemove}
            title="ลบออกจากโรงรถ"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onBrowse}>
        ดูอะไหล่สำหรับรถคันนี้
      </Button>
    </div>
  )
}
