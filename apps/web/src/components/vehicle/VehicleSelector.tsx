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
import { BrandLogo } from './BrandLogo'

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
      <div className="grid grid-cols-3 gap-2">
        {/* ยี่ห้อ */}
        <Select
          value={brand ?? ''}
          onValueChange={(v: string | null) => v && handleBrandChange(v)}
          disabled={brandsLoading}
        >
          <SelectTrigger className="h-11">
            {brand ? (
              <span className="flex items-center gap-1.5">
                <BrandLogo brand={brand} className="h-4 w-8 object-contain" />
                <span className="truncate">{brand}</span>
              </span>
            ) : (
              <SelectValue placeholder={brandsLoading ? 'กำลังโหลด...' : 'ยี่ห้อ'} />
            )}
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                <span className="flex items-center gap-2">
                  <BrandLogo brand={b} className="h-4 w-8 object-contain" />
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
