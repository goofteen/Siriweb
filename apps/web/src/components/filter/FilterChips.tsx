/**
 * FilterChips — แสดง active filters เป็น chips
 * ลบ chip ได้ทีละอัน + ปุ่ม "ล้างทั้งหมด"
 */
import { X, SlidersHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ActiveFilter {
  key: string
  label: string
  value: string
}

interface FilterChipsProps {
  filters: ActiveFilter[]
  onRemove: (key: string) => void
  onClearAll: () => void
  onOpenDrawer: () => void
  className?: string
}

export function FilterChips({
  filters,
  onRemove,
  onClearAll,
  onOpenDrawer,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-1', className)}>
      {/* ปุ่มเปิด filter drawer */}
      <button
        onClick={onOpenDrawer}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent"
      >
        <SlidersHorizontal className="size-3.5" />
        <span>กรอง</span>
        {filters.length > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {filters.length}
          </span>
        )}
      </button>

      {/* active filter chips */}
      {filters.map((f) => (
        <Badge
          key={f.key}
          variant="secondary"
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-sm hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(f.key)}
        >
          {f.label}: {f.value}
          <X className="size-3" />
        </Badge>
      ))}

      {/* ล้างทั้งหมด */}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
        >
          ล้างทั้งหมด
        </button>
      )}
    </div>
  )
}
