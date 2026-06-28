/**
 * FilterDrawer — bottom sheet สำหรับเพิ่ม/แก้ filter
 * ใช้ shadcn Sheet (side=bottom)
 */
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'

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
}

const PRICE_RANGES = [
  { label: 'ทุกราคา', min: undefined, max: undefined },
  { label: 'ต่ำกว่า ฿500', min: undefined, max: 500 },
  { label: '฿500 – ฿1,000', min: 500, max: 1000 },
  { label: '฿1,000 – ฿3,000', min: 1000, max: 3000 },
  { label: '฿3,000 – ฿10,000', min: 3000, max: 10000 },
  { label: 'มากกว่า ฿10,000', min: 10000, max: undefined },
]

export function FilterDrawer({ open, onClose, current, onApply }: FilterDrawerProps) {
  const { data: categoryTree = [] } = useCategories()
  const [draft, setDraft] = useState<FilterState>(current)

  // sync draft เมื่อ open
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
    onClose()
  }

  const selectedPriceLabel =
    PRICE_RANGES.find((r) => r.min === draft.minPrice && r.max === draft.maxPrice)?.label ??
    'ทุกราคา'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left text-lg">กรองสินค้า</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* หมวดหมู่ */}
          <div className="space-y-2">
            <label className="text-sm font-medium">หมวดหมู่</label>
            <Select
              value={String(draft.categoryId ?? '')}
              onValueChange={(v: string | null) =>
                setDraft((d) => ({ ...d, categoryId: v ? Number(v) : undefined }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ทุกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทุกหมวดหมู่</SelectItem>
                {categoryTree.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ช่วงราคา */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ช่วงราคา</label>
            <Select
              value={selectedPriceLabel}
              onValueChange={(label: string | null) => {
                const range = PRICE_RANGES.find((r) => r.label === label)
                if (range) {
                  setDraft((d) => ({ ...d, minPrice: range.min, maxPrice: range.max }))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((r) => (
                  <SelectItem key={r.label} value={r.label}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* สต็อก */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">แสดงเฉพาะสินค้าที่มีสต็อก</label>
            <button
              role="switch"
              aria-checked={draft.inStock ?? false}
              onClick={() => setDraft((d) => ({ ...d, inStock: !d.inStock }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                draft.inStock ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                  draft.inStock ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <SheetFooter className="mt-6 flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            ล้างตัวกรอง
          </Button>
          <Button onClick={handleApply} className="flex-1">
            แสดงผล
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
