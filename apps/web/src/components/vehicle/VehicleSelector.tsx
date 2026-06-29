/**
 * VehicleSelector — cascade dropdown: ยี่ห้อ → รุ่น → ปี
 * เมื่อ select ครบ → เรียก onSelect(vehicleId)
 */
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVehicleBrands, useVehicleModels, useVehicleYears } from '@/hooks/useVehicles'

const BRAND_LOGOS: Record<string, string> = {
  Toyota: '/logos/toyota.svg',
  Honda: '/logos/honda.svg',
  Nissan: '/logos/nissan.svg',
  Mazda: '/logos/mazda.svg',
  Mitsubishi: '/logos/mitsubishi.svg',
  Isuzu: '/logos/isuzu.svg',
  Subaru: '/logos/subaru.svg',
  Suzuki: '/logos/suzuki.svg',
}

interface VehicleSelectorProps {
  onSelect: (vehicleId: number, info: { brand: string; model: string; year: number }) => void
  className?: string
}

export function VehicleSelector({ onSelect, className }: VehicleSelectorProps) {
  const [brand, setBrand] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)

  const { data: brands = [], isLoading: brandsLoading } = useVehicleBrands()
  const { data: models = [], isLoading: modelsLoading } = useVehicleModels(brand)
  const { data: years = [], isLoading: yearsLoading } = useVehicleYears(brand, model)

  function handleBrandChange(value: string) {
    setBrand(value)
    setModel(null)
  }

  function handleModelChange(value: string) {
    setModel(value)
  }

  function handleYearChange(value: string) {
    const year = years.find((y) => String(y.id) === value)
    if (year && brand && model) {
      onSelect(year.id, { brand, model, year: year.year_from })
    }
  }

  return (
    <div className={className}>
      {/* brand grid — แสดง logo ก่อนเลือก */}
      {!brand && !brandsLoading && (
        <div className="mb-3 grid grid-cols-4 gap-2">
          {brands.map((b) => {
            const logo = BRAND_LOGOS[b]
            return (
              <button
                key={b}
                onClick={() => handleBrandChange(b)}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-2 py-2.5 transition-colors hover:border-accent/50 hover:bg-accent/5"
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={b}
                    className="h-7 w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-xs font-bold text-foreground">{b}</span>
                )}
                <span className="text-[11px] text-muted-foreground">{b}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* selected brand chip + model/year dropdowns */}
      {brand && (
        <div className="mb-3 flex items-center gap-2">
          {BRAND_LOGOS[brand] && (
            <img src={BRAND_LOGOS[brand]} alt={brand} className="h-6 w-12 object-contain" />
          )}
          <span className="text-sm font-medium">{brand}</span>
          <button
            onClick={() => {
              setBrand(null)
              setModel(null)
            }}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            เปลี่ยน
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {/* ยี่ห้อ — แสดงเมื่อมี brand แล้ว (read-only visual) หรือ fallback dropdown */}
        <Select
          value={brand ?? ''}
          onValueChange={(v: string | null) => v && handleBrandChange(v)}
          disabled={brandsLoading}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={brandsLoading ? 'กำลังโหลด...' : 'ยี่ห้อ'} />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                <span className="flex items-center gap-2">
                  {BRAND_LOGOS[b] && (
                    <img src={BRAND_LOGOS[b]} alt={b} className="h-4 w-8 object-contain" />
                  )}
                  {b}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* รุ่น */}
        <Select
          value={model ?? ''}
          onValueChange={(v: string | null) => v && handleModelChange(v)}
          disabled={!brand || modelsLoading}
        >
          <SelectTrigger className="h-11">
            <SelectValue
              placeholder={!brand ? 'เลือกยี่ห้อก่อน' : modelsLoading ? 'กำลังโหลด...' : 'รุ่น'}
            />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ปี */}
        <Select
          onValueChange={(v: string | null) => v && handleYearChange(v)}
          disabled={!model || yearsLoading}
        >
          <SelectTrigger className="h-11">
            <SelectValue
              placeholder={!model ? 'เลือกรุ่นก่อน' : yearsLoading ? 'กำลังโหลด...' : 'ปี'}
            />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.id} value={String(y.id)}>
                {y.year_from}
                {y.year_to ? `–${y.year_to}` : '+'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
