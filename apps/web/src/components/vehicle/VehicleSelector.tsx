/**
 * VehicleSelector — cascade dropdown: ยี่ห้อ → รุ่น → ปี
 * Modes:
 *  1. Standard: onSelect fires when year is chosen (backward-compat for Garage/Search sidebar)
 *  2. Search button: showSearchButton=true + onSearch — fires on button click with partial selection
 */
import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVehicleBrands, useVehicleModels, useVehicleYears } from '@/hooks/useVehicles'
import { BrandLogo } from './BrandLogo'

export interface VehicleSearchData {
  brand?: string
  model?: string
  vehicleId?: number
  yearFrom?: number
}

interface VehicleSelectorProps {
  /** fires when all 3 dropdowns are selected (backward-compat) */
  onSelect?: (vehicleId: number, info: { brand: string; model: string; year: number }) => void
  /** fires on Search button click (partial selection OK) */
  onSearch?: (data: VehicleSearchData) => void
  /** show ค้นหา button below dropdowns */
  showSearchButton?: boolean
  /** label for the search button */
  searchButtonLabel?: string
  /** pre-fill brand (used in save banner) */
  initialBrand?: string
  /** pre-fill model (used in save banner) */
  initialModel?: string
  /** pre-fill vehicleId/year (used in save banner when full vehicle known) */
  initialVehicleId?: number
  className?: string
  /** stack dropdowns vertically instead of 3-column grid */
  vertical?: boolean
}

export function VehicleSelector({
  onSelect,
  onSearch,
  showSearchButton = false,
  searchButtonLabel = 'ค้นหา',
  initialBrand,
  initialModel,
  initialVehicleId,
  className,
  vertical = false,
}: VehicleSelectorProps) {
  const [brand, setBrand] = useState<string | null>(initialBrand ?? null)
  const [model, setModel] = useState<string | null>(initialModel ?? null)
  const [yearId, setYearId] = useState<number | null>(initialVehicleId ?? null)

  const { data: brands = [], isLoading: brandsLoading } = useVehicleBrands()
  const { data: models = [], isLoading: modelsLoading } = useVehicleModels(brand)
  const { data: years = [], isLoading: yearsLoading } = useVehicleYears(brand, model)

  function handleBrandChange(value: string) {
    setBrand(value)
    setModel(null)
    setYearId(null)
  }

  function handleModelChange(value: string) {
    setModel(value)
    setYearId(null)
  }

  function handleYearChange(value: string) {
    const year = years.find((y) => String(y.id) === value)
    if (year && brand && model) {
      setYearId(year.id)
      onSelect?.(year.id, { brand, model, year: year.year_from })
    }
  }

  function handleSearch() {
    const yearObj = years.find((y) => y.id === yearId)
    onSearch?.({
      brand: brand ?? undefined,
      model: model ?? undefined,
      vehicleId: yearId ?? undefined,
      yearFrom: yearObj?.year_from,
    })
  }

  const selectedYear = years.find((y) => y.id === yearId)
  const yearDisplay = selectedYear
    ? `${selectedYear.year_from}${selectedYear.year_to ? `–${String(selectedYear.year_to).slice(-2)}` : '+'}`
    : null

  if (vertical) {
    return (
      <div className={className}>
        <div className="flex flex-col gap-2">
          <Select
            value={brand ?? ''}
            onValueChange={(v) => v && handleBrandChange(v)}
            disabled={brandsLoading}
          >
            <SelectTrigger className="h-10 w-full">
              {brand ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <BrandLogo brand={brand} className="h-4 w-8 shrink-0 object-contain" />
                  <span className="truncate">{brand}</span>
                </span>
              ) : (
                <SelectValue placeholder={brandsLoading ? '...' : 'ยี่ห้อ'} />
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

          <Select
            value={model ?? ''}
            onValueChange={(v) => v && handleModelChange(v)}
            disabled={!brand || modelsLoading}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder={!brand ? 'เลือกยี่ห้อ' : modelsLoading ? '...' : 'รุ่น'} />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={yearId ? String(yearId) : ''}
            onValueChange={(v) => v && handleYearChange(v)}
            disabled={!model || yearsLoading}
          >
            <SelectTrigger className="h-10 w-full">
              {yearDisplay ? (
                <span>{yearDisplay}</span>
              ) : (
                <SelectValue placeholder={!model ? 'เลือกรุ่น' : yearsLoading ? '...' : 'ปี'} />
              )}
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.year_from}
                  {y.year_to ? `–${String(y.year_to).slice(-2)}` : '+'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // horizontal layout — dropdowns + optional search button in one row
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* ยี่ห้อ */}
        <div className="min-w-0 flex-1">
          <Select
            value={brand ?? ''}
            onValueChange={(v) => v && handleBrandChange(v)}
            disabled={brandsLoading}
          >
            <SelectTrigger className="h-10 w-full">
              {brand ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <BrandLogo brand={brand} className="h-4 w-8 shrink-0 object-contain" />
                  <span className="truncate">{brand}</span>
                </span>
              ) : (
                <SelectValue placeholder={brandsLoading ? '...' : 'ยี่ห้อ'} />
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
        </div>

        {/* รุ่น */}
        <div className="min-w-0 flex-1">
          <Select
            value={model ?? ''}
            onValueChange={(v) => v && handleModelChange(v)}
            disabled={!brand || modelsLoading}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder={modelsLoading ? '...' : 'รุ่น'} />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ปี */}
        <div className="min-w-0 flex-1">
          <Select
            value={yearId ? String(yearId) : ''}
            onValueChange={(v) => v && handleYearChange(v)}
            disabled={!model || yearsLoading}
          >
            <SelectTrigger className="h-10 w-full">
              {yearDisplay ? (
                <span className="truncate">{yearDisplay}</span>
              ) : (
                <SelectValue placeholder={yearsLoading ? '...' : 'ปี'} />
              )}
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.year_from}
                  {y.year_to ? `–${String(y.year_to).slice(-2)}` : '+'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ปุ่มค้นหา — บรรทัดเดียวกัน, always enabled */}
        {showSearchButton && (
          <button
            onClick={handleSearch}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 whitespace-nowrap"
          >
            <Search className="size-4" />
            {searchButtonLabel}
          </button>
        )}
      </div>
    </div>
  )
}
