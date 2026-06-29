/**
 * FilterPanel — filter UI ที่ใช้ร่วมกันได้ทั้ง drawer (mobile) และ sidebar (desktop)
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/useCategories'
import type { FilterState } from './FilterDrawer'

const PRICE_RANGES = [
  { label: 'ทุกราคา', min: undefined, max: undefined },
  { label: 'ต่ำกว่า ฿500', min: undefined, max: 500 },
  { label: '฿500 – ฿1,000', min: 500, max: 1000 },
  { label: '฿1,000 – ฿3,000', min: 1000, max: 3000 },
  { label: '฿3,000 – ฿10,000', min: 3000, max: 10000 },
  { label: 'มากกว่า ฿10,000', min: 10000, max: undefined },
]

interface FilterPanelProps {
  draft: FilterState
  onChange: (next: FilterState) => void
  onApply: () => void
  onReset: () => void
  /** ซ่อนปุ่ม Apply/Reset (ใช้ตอน sidebar apply อัตโนมัติ) */
  hideActions?: boolean
}

export function FilterPanel({ draft, onChange, onApply, onReset, hideActions }: FilterPanelProps) {
  const { data: categoryTree = [] } = useCategories()

  // รวม root + children ให้ flat เพื่อใช้ lookup ชื่อและแสดงใน dropdown
  const allCategories = categoryTree.flatMap((cat) => [
    { ...cat, isChild: false },
    ...cat.children.map((child) => ({ ...child, isChild: true })),
  ])

  const selectedCategoryName = draft.categoryId
    ? allCategories.find((c) => c.id === draft.categoryId)?.name_th
    : undefined

  const selectedPriceLabel =
    PRICE_RANGES.find((r) => r.min === draft.minPrice && r.max === draft.maxPrice)?.label ??
    'ทุกราคา'

  return (
    <div className="space-y-5">
      {/* หมวดหมู่ */}
      <div className="space-y-2">
        <label className="text-sm font-medium">หมวดหมู่</label>
        <Select
          value={String(draft.categoryId ?? '')}
          onValueChange={(v) => onChange({ ...draft, categoryId: v ? Number(v) : undefined })}
        >
          <SelectTrigger>
            {/* ระบุชื่อที่แสดงเองเพื่อแก้ปัญหา SelectValue โชว์ ID แทนชื่อ */}
            <SelectValue placeholder="ทุกหมวดหมู่">
              {draft.categoryId ? (selectedCategoryName ?? 'กำลังโหลด...') : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">ทุกหมวดหมู่</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.isChild ? '\u00a0\u00a0' : ''}
                {cat.icon ? `${cat.icon} ` : ''}
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
          onValueChange={(label) => {
            const range = PRICE_RANGES.find((r) => r.label === label)
            if (range) onChange({ ...draft, minPrice: range.min, maxPrice: range.max })
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
        <label className="text-sm font-medium">มีสินค้าพร้อมส่ง</label>
        <button
          role="switch"
          aria-checked={draft.inStock ?? false}
          onClick={() => onChange({ ...draft, inStock: !draft.inStock })}
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

      {!hideActions && (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onReset} className="flex-1">
            ล้างตัวกรอง
          </Button>
          <Button onClick={onApply} className="flex-1">
            แสดงผล
          </Button>
        </div>
      )}
    </div>
  )
}

export { PRICE_RANGES }
