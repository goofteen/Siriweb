/**
 * FilterDrawer — bottom sheet สำหรับ mobile
 * เนื้อหาตรงกับ desktop sidebar: VehicleSelector + FilterPanel
 */
import { useState } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { VehicleSelector } from '@/components/vehicle/VehicleSelector'
import { FilterPanel } from './FilterPanel'

export interface FilterState {
  categoryId?: number
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
}

interface FilterDrawerProps {
  open: boolean
  onClose: () => void
  current: FilterState
  onApply: (filters: FilterState) => void
  /** label ของรถที่กำลัง filter อยู่ (ถ้ามี) */
  vehicleLabel?: string
  /** เมื่อเลือกรถในกล่อง VehicleSelector */
  onVehicleSelect?: (vehicleId: number) => void
  /** เมื่อกดล้างตัวกรองรถ */
  onVehicleRemove?: () => void
}

export function FilterDrawer({
  open,
  onClose,
  current,
  onApply,
  vehicleLabel,
  onVehicleSelect,
  onVehicleRemove,
}: FilterDrawerProps) {
  const [draft, setDraft] = useState<FilterState>(current)

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) setDraft(current)
    else onClose()
  }

  function handleApply() {
    onApply(draft)
    onClose()
  }

  function handleReset() {
    const empty: FilterState = {}
    setDraft(empty)
    onApply(empty)
    onVehicleRemove?.()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        {/* header — pb-2 ลด gap ระหว่าง title กับ content (SheetContent มี gap-4 อยู่แล้ว) */}
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left">กรองสินค้า</SheetTitle>
        </SheetHeader>

        {/* body — px-4 ให้ตรงกับ header, pb-safe รองรับ iPhone home indicator */}
        <div className="space-y-4 px-4 pb-8">
          {/* รุ่นรถ */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">รุ่นรถ</p>
            {vehicleLabel && (
              <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    กำลังดูอะไหล่สำหรับ
                  </p>
                  <p className="text-sm font-semibold">{vehicleLabel}</p>
                </div>
                {onVehicleRemove && (
                  <button
                    onClick={() => {
                      onVehicleRemove()
                      onClose()
                    }}
                    aria-label="ล้างตัวกรองรถ"
                    className="ml-3 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}
            <VehicleSelector
              vertical
              onSelect={(id) => {
                onVehicleSelect?.(id)
                onClose()
              }}
            />
          </div>

          <div className="border-t border-border" />

          {/* กรองสินค้า */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">กรองสินค้า</p>
            <FilterPanel
              draft={draft}
              onChange={setDraft}
              onApply={handleApply}
              onReset={handleReset}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
