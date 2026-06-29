/**
 * FilterDrawer — bottom sheet สำหรับ mobile
 */
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
}

export function FilterDrawer({ open, onClose, current, onApply }: FilterDrawerProps) {
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
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left text-lg">กรองสินค้า</SheetTitle>
        </SheetHeader>
        <FilterPanel
          draft={draft}
          onChange={setDraft}
          onApply={handleApply}
          onReset={handleReset}
        />
      </SheetContent>
    </Sheet>
  )
}
